begin;
alter table public.english_word_progress add column if not exists exposure_count integer not null default 0,
 add column if not exists last_exposed_at timestamptz;
-- Historical answered questions imply one actual encounter, not one per target.
with totals as (
 select a.learner_id,'en:'||token.word as word_id,count(*)::integer as exposures,max(a.occurred_at) as last_at
 from public.english_word_attempts a join public.english_word_questions q on q.id=a.question_id and q.version=a.question_version
 cross join lateral(select distinct lower(m[1]) as word from regexp_matches(replace(q.sentence,'’',''''),'([A-Za-z]+(?:''[A-Za-z]+)*)','g') m) token
 group by a.learner_id,token.word
)
update public.english_word_progress w set exposure_count=t.exposures,last_exposed_at=t.last_at
 from totals t where w.learner_id=t.learner_id and w.word_id=t.word_id and w.exposure_count=0;
create table if not exists public.english_word_presentations(
 learner_id uuid not null references auth.users(id) on delete cascade,
 id uuid not null,question_id text not null,question_version integer not null,
 occurred_at timestamptz not null,recorded_at timestamptz not null default now(),
 primary key(learner_id,id),foreign key(question_id,question_version) references public.english_word_questions(id,version)
);
alter table public.english_word_presentations enable row level security;
revoke all on public.english_word_presentations from public,anon,authenticated;
grant select on public.english_word_presentations to authenticated;
drop policy if exists word_presentations_read on public.english_word_presentations;
create policy word_presentations_read on public.english_word_presentations for select to authenticated
 using(learner_id=auth.uid() or public.fifa_english_is_admin());
create or replace function public.score_english_word_presentation(p_id uuid,p_question text,p_version integer,p_occurred timestamptz,p_learner uuid)
returns void language plpgsql security definer set search_path='' as $$
declare q public.english_word_questions;token text;inserted integer;uid uuid:=auth.uid();answered boolean;
begin
 if uid is null or uid is distinct from p_learner then raise exception 'Account mismatch';end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(uid::text||':'||p_id::text,0));
 if p_occurred is null or p_occurred>now()+interval '5 minutes' then raise exception 'Invalid presentation time';end if;
 select * into q from public.english_word_questions where id=p_question and version=p_version;
 if not found then raise exception 'Unknown question';end if;
 if exists(select 1 from public.english_word_presentations where learner_id=uid and id=p_id and (question_id<>p_question or question_version<>p_version)) or
 exists(select 1 from public.english_word_attempts where learner_id=uid and id=p_id and (question_id<>p_question or question_version<>p_version)) then raise exception 'Presentation mismatch';end if;
 answered:=exists(select 1 from public.english_word_attempts where learner_id=uid and id=p_id);
 insert into public.english_word_presentations(learner_id,id,question_id,question_version,occurred_at)
 values(uid,p_id,p_question,p_version,p_occurred) on conflict do nothing;
 get diagnostics inserted=row_count;
 if inserted=0 then return;end if;
 for token in select distinct lower(m[1]) from regexp_matches(replace(q.sentence,'’',''''),'([A-Za-z]+(?:''[A-Za-z]+)*)','g') m order by 1 loop
  insert into public.english_word_forms(id,form) values('en:'||token,token) on conflict do nothing;
  insert into public.english_word_progress(learner_id,word_id,correct,attempts,listening_correct,direct_correct,last_practised,recent_results,exposure_count,last_exposed_at)
  values(uid,'en:'||token,0,0,0,0,p_occurred,'{}',case when answered then 0 else 1 end,p_occurred)
  on conflict(learner_id,word_id) do update set exposure_count=english_word_progress.exposure_count+excluded.exposure_count,
   last_exposed_at=greatest(english_word_progress.last_exposed_at,excluded.last_exposed_at);
  perform public.rebuild_english_word_learning(uid,'en:'||token);
 end loop;
end $$;
revoke all on function public.score_english_word_presentation(uuid,text,integer,timestamptz,uuid) from public,anon,authenticated;
create or replace function public.score_english_word_answer(p_id uuid,p_question text,p_version integer,p_answer text,p_occurred timestamptz,p_modality text,p_replays integer,p_rule integer,p_learner uuid)
returns void language plpgsql security definer set search_path='' as $$
declare q public.english_word_questions;won boolean;credited boolean;token text;inserted integer;tested boolean;shown boolean;uid uuid:=auth.uid();
begin
 if uid is null or uid is distinct from p_learner then raise exception 'Account mismatch';end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(uid::text||':'||p_id::text,0));
 if p_rule<>1 or p_modality not in ('visible','faded','audio') or p_replays<0 or p_replays>10000 or p_occurred>now()+interval '5 minutes' then raise exception 'Invalid answer metadata';end if;
 select * into q from public.english_word_questions where id=p_question and version=p_version;
 if not found or not(p_answer=any(q.choices)) then raise exception 'Unknown question or answer';end if;
 shown:=exists(select 1 from public.english_word_presentations where learner_id=uid and id=p_id);
 if shown and not exists(select 1 from public.english_word_presentations where learner_id=uid and id=p_id and question_id=p_question and question_version=p_version) then raise exception 'Presentation mismatch';end if;
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
  insert into public.english_word_progress(learner_id,word_id,correct,attempts,listening_correct,direct_correct,last_practised,recent_results,exposure_count,last_exposed_at)
  values(uid,'en:'||token,credited::integer,1,(credited and tested and p_modality='audio')::integer,(credited and tested and q.evidence='direct')::integer,p_occurred,case when tested or won then array[won] else '{}'::boolean[] end,case when shown then 0 else 1 end,p_occurred)
  on conflict(learner_id,word_id) do update set
   exposure_count=english_word_progress.exposure_count+excluded.exposure_count,last_exposed_at=greatest(english_word_progress.last_exposed_at,excluded.last_exposed_at),
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
  select * from (
   select true as correct,'visible'::text as modality,0 as replays,p.occurred_at,q.evidence,false as tested,1 as weight,0 as phase,p.recorded_at,p.id
   from public.english_word_presentations p join public.english_word_questions q on q.id=p.question_id and q.version=p.question_version
   where p.learner_id=p_learner and exists(select 1 from regexp_matches(replace(q.sentence,'’',''''),'([A-Za-z]+(?:''[A-Za-z]+)*)','g') m where 'en:'||lower(m[1])=p_word)
   union all
   select a.correct,a.modality,a.replays,a.occurred_at,q.evidence,
    exists(select 1 from public.english_word_contrast_tokens(q.credit_sentence) w where 'en:'||w=p_word) as tested,
    case when exists(select 1 from public.english_word_presentations p where p.learner_id=a.learner_id and p.id=a.id) then 2
     when exists(select 1 from public.english_word_contrast_tokens(q.credit_sentence) w where 'en:'||w=p_word) then 3 else 1 end as weight,
    1 as phase,a.recorded_at,a.id
   from public.english_word_attempts a join public.english_word_questions q on q.id=a.question_id and q.version=a.question_version
   where a.learner_id=p_learner and q.credit_sentence is not null and (
    exists(select 1 from public.english_word_contrast_tokens(q.credit_sentence) w where 'en:'||w=p_word)
    or (a.correct and not exists(select 1 from public.english_word_presentations p where p.learner_id=a.learner_id and p.id=a.id)
     and exists(select 1 from regexp_matches(replace(q.sentence,'’',''''),'([A-Za-z]+(?:''[A-Za-z]+)*)','g') m where 'en:'||lower(m[1])=p_word)))
  ) events order by occurred_at,phase,recorded_at,id
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
   score:=least(25,score+e.weight);
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
create or replace function public.process_english_attempt(p_receipt uuid) returns void
language plpgsql security definer set search_path='' as $$
declare r public.english_attempt_inbox; p jsonb; code text; message text;
 old_claims text:=current_setting('request.jwt.claims',true);
 old_sub text:=current_setting('request.jwt.claim.sub',true);
begin
 select * into r from public.english_attempt_inbox where id=p_receipt for update;
 if not found or r.status='scored' then return; end if;
 p:=coalesce(r.resolution_payload,r.payload);
 -- Only this private worker can supply the stored learner identity to scorers.
 perform set_config('request.jwt.claims',jsonb_build_object('sub',r.learner_id,'role','authenticated')::text,true);
 perform set_config('request.jwt.claim.sub',r.learner_id::text,true);
 begin
  if r.source='number' then
   perform public.score_english_number_answer(p->>'p_id',p->>'p_word',(p->>'p_module')::integer,
    (p->>'p_answer')::integer,(p->>'p_at')::timestamptz,(p->>'p_assisted')::boolean,
    (p->>'p_heard')::boolean,(p->>'p_replays')::integer,(p->>'p_support')::integer,p->>'p_verb',p->>'p_subject');
  elsif p->>'p_event'='presented' then
   perform public.score_english_word_presentation((p->>'p_id')::uuid,p->>'p_question',(p->>'p_version')::integer,(p->>'p_occurred')::timestamptz,r.learner_id);
  else
   perform public.score_english_word_answer((p->>'p_id')::uuid,p->>'p_question',(p->>'p_version')::integer,
    p->>'p_answer',(p->>'p_occurred')::timestamptz,p->>'p_modality',(p->>'p_replays')::integer,
    (p->>'p_rule')::integer,r.learner_id);
  end if;
  update public.english_attempt_inbox set status='scored',scored_at=now(),last_attempt_at=now(),
   processing_attempts=processing_attempts+1,error_code=null,error_message=null where id=r.id;
 exception when others then
  get stacked diagnostics code=returned_sqlstate,message=message_text;
  -- This subtransaction rolls back partial scoring, never the original receipt.
  update public.english_attempt_inbox set status='needs_review',last_attempt_at=now(),
   processing_attempts=processing_attempts+1,error_code=code,error_message=left(message,2000),
   next_retry_at=now()+make_interval(secs=>least(21600,60*power(2,least(r.processing_attempts,9)))::integer)
   where id=r.id;
 end;
 perform set_config('request.jwt.claims',coalesce(old_claims,''),true);
 perform set_config('request.jwt.claim.sub',coalesce(old_sub,''),true);
end;$$;
revoke all on function public.process_english_attempt(uuid) from public,anon,authenticated;

notify pgrst,'reload schema';
commit;
