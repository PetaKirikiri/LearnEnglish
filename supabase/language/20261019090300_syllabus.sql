-- TARGET: SubtitleDisplay gbsopnbovsxlstnmaaga. Language catalogue only.
begin;
create table public.englishsuccess_sentence_structures (
  id text primary key, node_id text not null references public.englishsuccess_curriculum_skills(id),
  payload jsonb not null check(payload->>'id'=id and payload->>'nodeId'=node_id)
);
create table public.englishsuccess_curriculum_vocabulary (
  word text primary key references public.englishsuccess_words(word),
  payload jsonb not null check(payload->>'word'=word)
);
do $$ declare t text; begin
  foreach t in array array['englishsuccess_sentence_structures','englishsuccess_curriculum_vocabulary'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on public.%I from anon, authenticated',t);
    execute format('grant select on public.%I to anon, authenticated',t);
    execute format('create policy syllabus_read on public.%I for select to anon, authenticated using (true)',t);
  end loop;
end $$;
create function public.englishsuccess_curriculum_v2() returns jsonb
language sql stable security invoker set search_path=public as $$
  select public.englishsuccess_curriculum() || jsonb_build_object(
    'version',2,
    'structures',coalesce((select jsonb_agg(payload order by id) from englishsuccess_sentence_structures),'[]'::jsonb),
    'vocabulary',coalesce((select jsonb_agg(payload order by word) from englishsuccess_curriculum_vocabulary),'[]'::jsonb)
  );
$$;
revoke all on function public.englishsuccess_curriculum_v2() from public;
grant execute on function public.englishsuccess_curriculum_v2() to anon,authenticated;
commit;
