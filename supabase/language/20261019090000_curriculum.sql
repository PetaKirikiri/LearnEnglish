-- TARGET: SubtitleDisplay gbsopnbovsxlstnmaaga. Additive language-only migration.
-- No profile, account, score, translation or learner-progress updates.
begin;
do $$ begin
  if to_regclass('public.englishsuccess_words') is null then
    raise exception 'Wrong database: EnglishSuccess language dictionary is required';
  end if;
end $$;

create table public.englishsuccess_curriculum_meta (
  singleton boolean primary key default true check(singleton), revision text not null
);
create table public.englishsuccess_curriculum_sources (
  id text primary key, payload jsonb not null check(payload->>'id'=id)
);
create table public.englishsuccess_curriculum_skills (
  id text primary key, level text not null check(level in ('A1','A2','B1','B2','C1')),
  position integer not null unique check(position>=0),
  payload jsonb not null check(payload->>'id'=id and payload->>'level'=level)
);
create table public.englishsuccess_course_skills (
  course text not null check(course='hotel'), skill text not null,
  node_id text not null references public.englishsuccess_curriculum_skills(id),
  position integer not null check(position>=0), primary key(course,skill), unique(course,position)
);
create table public.englishsuccess_course_questions (
  id text primary key, course text not null, skill text not null,
  position integer not null check(position>=0), payload jsonb not null,
  foreign key(course,skill) references public.englishsuccess_course_skills(course,skill),
  check(payload->>'id'=id and payload->>'skill'=skill),
  check(jsonb_array_length(payload->'answers')=2), check(payload->>'correct' in ('0','1'))
);
create table public.englishsuccess_question_words (
  question_id text not null references public.englishsuccess_course_questions(id),
  word text not null references public.englishsuccess_words(word),
  role text not null check(role in ('target','context')), primary key(question_id,word)
);

do $$ declare t text; begin
  foreach t in array array['englishsuccess_curriculum_meta','englishsuccess_curriculum_sources','englishsuccess_curriculum_skills','englishsuccess_course_skills','englishsuccess_course_questions','englishsuccess_question_words'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on public.%I from anon, authenticated',t);
    execute format('grant select on public.%I to anon, authenticated',t);
    execute format('create policy curriculum_read on public.%I for select to anon, authenticated using (true)',t);
  end loop;
end $$;

create function public.englishsuccess_curriculum() returns jsonb
language sql stable security invoker set search_path=public as $$
  select jsonb_build_object(
    'version',1,'revision',(select revision from englishsuccess_curriculum_meta where singleton),
    'sources',coalesce((select jsonb_agg(payload order by id) from englishsuccess_curriculum_sources),'[]'::jsonb),
    'skills',coalesce((select jsonb_agg(payload order by position) from englishsuccess_curriculum_skills),'[]'::jsonb),
    'courseSkills',coalesce((select jsonb_agg(jsonb_build_object('course',course,'skill',skill,'nodeId',node_id,'order',position) order by position) from englishsuccess_course_skills),'[]'::jsonb),
    'questions',coalesce((select jsonb_agg(payload order by position) from englishsuccess_course_questions),'[]'::jsonb),
    'wordLinks',coalesce((select jsonb_agg(jsonb_build_object('questionId',question_id,'word',word,'role',role) order by question_id,word) from englishsuccess_question_words),'[]'::jsonb)
  );
$$;
revoke all on function public.englishsuccess_curriculum() from public;
grant execute on function public.englishsuccess_curriculum() to anon,authenticated;
commit;
