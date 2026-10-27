begin;
create table public.english_word_forms(
 id text primary key, form text not null unique, lemma_id text,
 check(id='en:'||form),check(form ~ '^[a-z]+(''[a-z]+)*$')
);
create table public.english_word_questions(
 id text not null,version integer not null, sentence text not null, choices text[] not null, answer text not null,
 credit_sentence text, evidence text not null default 'sentence' check(evidence in ('sentence','direct')),
 primary key(id,version),check(answer=any(choices)),check(cardinality(choices)=2)
);
create table public.english_word_attempts(
 learner_id uuid not null references public.profiles(id) on delete cascade,id uuid not null,
 question_id text not null,question_version integer not null,answer text not null,correct boolean not null,
 occurred_at timestamptz not null,recorded_at timestamptz not null default now(),
 modality text not null check(modality in ('visible','faded','audio')),replays integer not null check(replays>=0),rule_version integer not null,
 primary key(learner_id,id),foreign key(question_id,question_version) references public.english_word_questions(id,version)
);
create table public.english_word_progress(
 learner_id uuid not null references public.profiles(id) on delete cascade,word_id text not null references public.english_word_forms(id),
 correct integer not null default 0,attempts integer not null default 0,listening_correct integer not null default 0,direct_correct integer not null default 0,
 last_practised timestamptz not null,recent_results boolean[] not null default '{}',rule_version integer not null default 1,
 primary key(learner_id,word_id)
);
create index english_word_attempts_recent on public.english_word_attempts(learner_id,recorded_at desc);
alter table public.english_word_forms enable row level security;
alter table public.english_word_questions enable row level security;
alter table public.english_word_attempts enable row level security;
alter table public.english_word_progress enable row level security;
revoke all on public.english_word_forms,public.english_word_questions,public.english_word_attempts,public.english_word_progress from anon,authenticated;
grant select on public.english_word_forms,public.english_word_questions,public.english_word_attempts,public.english_word_progress to authenticated;
create policy word_forms_read on public.english_word_forms for select to authenticated using(true);
create policy word_questions_read on public.english_word_questions for select to authenticated using(true);
create policy word_attempts_read on public.english_word_attempts for select to authenticated using(learner_id=auth.uid() or public.fifa_english_is_admin());
create policy word_progress_read on public.english_word_progress for select to authenticated using(learner_id=auth.uid() or public.fifa_english_is_admin());
create function public.record_english_word_answer(p_id uuid,p_question text,p_version integer,p_answer text,p_occurred timestamptz,p_modality text,p_replays integer,p_rule integer,p_learner uuid)
returns void language plpgsql security definer set search_path='' as $$
declare q public.english_word_questions;won boolean;credited boolean;token text;inserted integer;uid uuid:=auth.uid();
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
 for token in select distinct lower(m[1]) from regexp_matches(replace(coalesce(q.credit_sentence,q.sentence),'’',''''),'([A-Za-z]+(?:''[A-Za-z]+)*)','g') m order by 1 loop
  insert into public.english_word_forms(id,form) values('en:'||token,token) on conflict do nothing;
  insert into public.english_word_progress(learner_id,word_id,correct,attempts,listening_correct,direct_correct,last_practised,recent_results)
  values(uid,'en:'||token,credited::integer,1,(credited and p_modality='audio')::integer,(credited and q.evidence='direct')::integer,p_occurred,array[won])
  on conflict(learner_id,word_id) do update set
   correct=english_word_progress.correct+excluded.correct,attempts=english_word_progress.attempts+1,
   listening_correct=english_word_progress.listening_correct+excluded.listening_correct,direct_correct=english_word_progress.direct_correct+excluded.direct_correct,
   last_practised=greatest(english_word_progress.last_practised,excluded.last_practised),
   recent_results=(english_word_progress.recent_results||won)[greatest(1,cardinality(english_word_progress.recent_results)+1-19):],rule_version=1;
 end loop;
end;$$;
revoke all on function public.record_english_word_answer(uuid,text,integer,text,timestamptz,text,integer,integer,uuid) from public,anon;
grant execute on function public.record_english_word_answer(uuid,text,integer,text,timestamptz,text,integer,integer,uuid) to authenticated;
commit;
