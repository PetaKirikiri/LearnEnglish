begin;
alter table public.english_word_progress
 add column if not exists fade_score integer not null default 0 check(fade_score between 0 and 25),
 add column if not exists confirmation_count integer not null default 0 check(confirmation_count between 0 and 3),
 add column if not exists proven_at timestamptz,
 add column if not exists review_due_at timestamptz,
 add column if not exists review_step integer not null default 0 check(review_step between 0 and 4),
 add column if not exists reviewed_at timestamptz,
 add column if not exists lapsed_at timestamptz,
 add column if not exists learning_updated_at timestamptz,
 add column if not exists learning_version integer not null default 1,
 add column if not exists learning_backfilled_at timestamptz not null default now();

-- Replaying chronology handles both historical backfill and late offline answers.
-- Summary-only legacy successes contribute support fading, never invented proof.
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
 and exists(select 1 from regexp_matches(replace(q.credit_sentence,'’',''''),'([A-Za-z]+(?:''[A-Za-z]+)*)','g') m where 'en:'||lower(m[1])=p_word);
 legacy_correct:=greatest(0,current_row.correct-known_correct);
 for e in
  select a.correct,a.modality,a.replays,a.occurred_at,q.evidence
  from public.english_word_attempts a join public.english_word_questions q on q.id=a.question_id and q.version=a.question_version
  where a.learner_id=p_learner and q.credit_sentence is not null
  and exists(select 1 from regexp_matches(replace(q.credit_sentence,'’',''''),'([A-Za-z]+(?:''[A-Za-z]+)*)','g') m where 'en:'||lower(m[1])=p_word)
  order by a.occurred_at,a.recorded_at,a.id
 loop
  if not legacy_added and e.occurred_at>=current_row.learning_backfilled_at then
   if lapsed is null then score:=least(25,score+legacy_correct);end if;
   legacy_added:=true;
  end if;
  latest:=e.occurred_at;hidden_before:=score>=25;
  if not e.correct then
   if proven is not null then score:=least(5,score);lapsed:=e.occurred_at;else score:=greatest(0,score-2);end if;
   confirmations:=0;proven:=null;due:=null;step:=0;reviewed:=null;
  else
   score:=least(25,score+1);
   if hidden_before and e.modality='audio' and e.replays=0 and e.evidence='sentence' then
    if proven is not null then
     if e.occurred_at>=due then step:=least(4,step+1);reviewed:=e.occurred_at;due:=e.occurred_at+make_interval(days=>intervals[step+1]);end if;
    else
     confirmations:=least(3,confirmations+1);
     if confirmations=3 then proven:=e.occurred_at;reviewed:=e.occurred_at;lapsed:=null;step:=0;due:=e.occurred_at+interval '1 day';end if;
    end if;
   end if;
  end if;
 end loop;
 if not legacy_added and lapsed is null then score:=least(25,score+legacy_correct);end if;
 update public.english_word_progress set fade_score=score,confirmation_count=confirmations,proven_at=proven,
  review_due_at=due,review_step=step,reviewed_at=reviewed,lapsed_at=lapsed,
  learning_updated_at=greatest(coalesce(latest,current_row.last_practised),current_row.learning_backfilled_at),learning_version=1
 where learner_id=p_learner and word_id=p_word;
end $$;
revoke all on function public.rebuild_english_word_learning(uuid,text) from public,anon,authenticated;
grant execute on function public.rebuild_english_word_learning(uuid,text) to service_role;
create or replace function public.sync_english_word_learning() returns trigger
language plpgsql security definer set search_path='' as $$
begin perform public.rebuild_english_word_learning(new.learner_id,new.word_id);return new;end $$;
revoke all on function public.sync_english_word_learning() from public,anon,authenticated;
drop trigger if exists english_word_learning_sync on public.english_word_progress;
create trigger english_word_learning_sync after insert or update of correct,attempts,listening_correct,recent_results
 on public.english_word_progress for each row execute function public.sync_english_word_learning();
do $$declare r record;begin
 for r in select learner_id,word_id from public.english_word_progress order by learner_id,word_id loop
  perform public.rebuild_english_word_learning(r.learner_id,r.word_id);
 end loop;
end $$;

create or replace function public.english_vocabulary_student_progress(p_learner uuid default null)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare viewer uuid:=auth.uid(); teacher boolean; target uuid; students jsonb; progress jsonb;
begin
 if viewer is null then raise exception 'Sign in required' using errcode='42501'; end if;
 teacher:=public.fifa_english_is_admin();
 target:=p_learner;
 if target is null then
  if teacher then
   select p.id into target from public.profiles p join public.english_success_members m on m.learner_id=p.id
    where lower(trim(p.display_name))='peta' order by p.is_admin desc,p.id limit 1;
  end if;
  target:=coalesce(target,viewer);
 end if;
 if target<>viewer and (not teacher or not exists(select 1 from public.english_success_members m where m.learner_id=target)) then
  raise exception 'Teacher access required for this learner' using errcode='42501';
 end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'name',coalesce(nullif(trim(p.display_name),''),'Learner')) order by lower(p.display_name),p.id),'[]'::jsonb)
 into students from public.profiles p where p.id=viewer or (teacher and exists(select 1 from public.english_success_members m where m.learner_id=p.id));
 select coalesce(jsonb_agg(to_jsonb(w) order by w.word_id),'[]'::jsonb) into progress from (
  select word_id,correct,attempts,listening_correct,direct_correct,last_practised,recent_results,fade_score,confirmation_count,proven_at,review_due_at,review_step,reviewed_at,lapsed_at,learning_updated_at,learning_version
  from public.english_word_progress where learner_id=target
 ) w;
 return jsonb_build_object('selected',target,'students',students,'rows',progress);
end $$;
revoke all on function public.english_vocabulary_student_progress(uuid) from public,anon,authenticated;
grant execute on function public.english_vocabulary_student_progress(uuid) to authenticated;

commit;
