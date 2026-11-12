begin;
-- Every presented word records an encounter. Correct sentence context earns fading
-- support (+3 on the contrasted word, +1 on context). Full fading means Learnt.
create or replace function public.english_word_contrast_tokens(p_credit text)
returns setof text language sql immutable set search_path='' as $$
 with tokens as (select distinct lower(m[1]) as word from regexp_matches(replace(coalesce(p_credit,''),'’',''''),'([A-Za-z]+(?:''[A-Za-z]+)*)','g') m)
 select word from tokens where word not in ('am','is','are') or not exists(select 1 from tokens where word not in ('am','is','are'))
$$;
revoke all on function public.english_word_contrast_tokens(text) from public,anon,authenticated;
create or replace function public.score_english_word_answer(p_id uuid,p_question text,p_version integer,p_answer text,p_occurred timestamptz,p_modality text,p_replays integer,p_rule integer,p_learner uuid)
returns void language plpgsql security definer set search_path='' as $$
declare q public.english_word_questions;won boolean;credited boolean;token text;inserted integer;tested boolean;uid uuid:=auth.uid();
begin
 if uid is null or uid is distinct from p_learner then raise exception 'Account mismatch';end if;
 if p_rule<>1 or p_modality not in ('visible','faded','audio') or p_replays<0 or p_replays>10000 or p_occurred>now()+interval '5 minutes' then raise exception 'Invalid answer metadata';end if;
 select * into q from public.english_word_questions where id=p_question and version=p_version;
 if not found or not(p_answer=any(q.choices)) then raise exception 'Unknown question or answer';end if;
 won:=p_answer=q.answer;
 insert into public.english_word_attempts(learner_id,id,question_id,question_version,answer,correct,occurred_at,modality,replays,rule_version)
 values(uid,p_id,p_question,p_version,p_answer,won,p_occurred,p_modality,p_replays,p_rule) on conflict do nothing;
 get diagnostics inserted=row_count;
 if inserted=0 then return;end if;
 -- Rejecting an ungrammatical sentence records a successful judgement, not credit for its incorrect wording.
 credited:=won and q.credit_sentence is not null;
 for token in select distinct lower(m[1]) from regexp_matches(replace(coalesce(q.credit_sentence,q.sentence)||case when q.credit_sentence is not null then ' '||q.sentence else '' end,'’',''''),'([A-Za-z]+(?:''[A-Za-z]+)*)','g') m order by 1 loop
  tested:=exists(select 1 from public.english_word_contrast_tokens(q.credit_sentence) w where w=token);
  insert into public.english_word_forms(id,form) values('en:'||token,token) on conflict do nothing;
  insert into public.english_word_progress(learner_id,word_id,correct,attempts,listening_correct,direct_correct,last_practised,recent_results)
  values(uid,'en:'||token,credited::integer,1,(credited and tested and p_modality='audio')::integer,(credited and tested and q.evidence='direct')::integer,p_occurred,case when tested or won then array[won] else '{}'::boolean[] end)
  on conflict(learner_id,word_id) do update set
   correct=english_word_progress.correct+excluded.correct,attempts=english_word_progress.attempts+1,
   listening_correct=english_word_progress.listening_correct+excluded.listening_correct,direct_correct=english_word_progress.direct_correct+excluded.direct_correct,
   last_practised=greatest(english_word_progress.last_practised,excluded.last_practised),
   recent_results=(english_word_progress.recent_results||excluded.recent_results)[greatest(1,cardinality(english_word_progress.recent_results)+cardinality(excluded.recent_results)-19):],rule_version=1;
 end loop;
end;$$;
revoke all on function public.score_english_word_answer(uuid,text,integer,text,timestamptz,text,integer,integer,uuid) from public,anon,authenticated;
create or replace function public.rebuild_english_word_learning(p_learner uuid,p_word text)
returns void language plpgsql security definer set search_path='' as $$
declare current_row public.english_word_progress; e record; known_correct integer;
 score integer:=0; confirmations integer:=0; proven timestamptz; due timestamptz;
 step integer:=0; reviewed timestamptz; lapsed timestamptz; latest timestamptz; hidden_before boolean; legacy_correct integer; legacy_added boolean:=false;
 intervals integer[]:=array[1,3,7,14,30];
begin
 select * into current_row from public.english_word_progress where learner_id=p_learner and word_id=p_word for update;
 if not found then return;end if;
 select count(*) filter(where a.correct) into known_correct
 from public.english_word_attempts a join public.english_word_questions q on q.id=a.question_id and q.version=a.question_version
 where a.learner_id=p_learner and q.credit_sentence is not null
 and (exists(select 1 from public.english_word_contrast_tokens(q.credit_sentence) w where 'en:'||w=p_word) or (a.correct and exists(select 1 from regexp_matches(replace(q.sentence,'’',''''),'([A-Za-z]+(?:''[A-Za-z]+)*)','g') m where 'en:'||lower(m[1])=p_word)));
 legacy_correct:=greatest(0,current_row.correct-known_correct);
 for e in
  select a.correct,a.modality,a.replays,a.occurred_at,q.evidence,(exists(select 1 from public.english_word_contrast_tokens(q.credit_sentence) w where 'en:'||w=p_word)) as tested
  from public.english_word_attempts a join public.english_word_questions q on q.id=a.question_id and q.version=a.question_version
  where a.learner_id=p_learner and q.credit_sentence is not null
  and (exists(select 1 from public.english_word_contrast_tokens(q.credit_sentence) w where 'en:'||w=p_word) or (a.correct and exists(select 1 from regexp_matches(replace(q.sentence,'’',''''),'([A-Za-z]+(?:''[A-Za-z]+)*)','g') m where 'en:'||lower(m[1])=p_word)))
  order by a.occurred_at,a.recorded_at,a.id
 loop
  if not legacy_added and e.occurred_at>=current_row.learning_backfilled_at then
   if lapsed is null then score:=least(25,score+legacy_correct);end if;
   if score>=25 and proven is null then
    proven:=current_row.learning_backfilled_at;reviewed:=proven;due:=proven+interval '1 day';confirmations:=0;
   end if;
   legacy_added:=true;
  end if;
  latest:=e.occurred_at;hidden_before:=score>=25;
  if not e.correct then
   if proven is not null then score:=least(5,score);lapsed:=e.occurred_at;else score:=greatest(0,score-2);end if;
   confirmations:=0;proven:=null;due:=null;step:=0;reviewed:=null;
  else
   score:=least(25,score+case when e.tested then 3 else 1 end);
   if score>=25 and proven is null then
    proven:=e.occurred_at;reviewed:=e.occurred_at;lapsed:=null;step:=0;confirmations:=0;due:=e.occurred_at+interval '1 day';
   elsif proven is not null and e.tested and e.modality='audio' and e.replays=0 and e.occurred_at>=due then
    step:=least(4,step+1);reviewed:=e.occurred_at;due:=e.occurred_at+make_interval(days=>intervals[step+1]);
   end if;
  end if;
 end loop;
 if not legacy_added and lapsed is null then score:=least(25,score+legacy_correct);end if;
 if score>=25 and proven is null then
  proven:=coalesce(latest,current_row.learning_backfilled_at);reviewed:=proven;due:=proven+interval '1 day';lapsed:=null;confirmations:=0;
 end if;
 update public.english_word_progress set fade_score=score,confirmation_count=confirmations,proven_at=proven,
  review_due_at=due,review_step=step,reviewed_at=reviewed,lapsed_at=lapsed,
  learning_updated_at=greatest(coalesce(latest,current_row.last_practised),current_row.learning_backfilled_at),learning_version=1
 where learner_id=p_learner and word_id=p_word;
end $$;
-- Existing fully faded words follow the same Learnt rule immediately.
update public.english_word_progress set proven_at=coalesce(learning_updated_at,last_practised,now()),
 review_due_at=coalesce(learning_updated_at,last_practised,now())+interval '1 day',
 reviewed_at=coalesce(learning_updated_at,last_practised,now()),confirmation_count=0,lapsed_at=null,review_step=0
 where fade_score>=25 and proven_at is null;
notify pgrst,'reload schema';
commit;
