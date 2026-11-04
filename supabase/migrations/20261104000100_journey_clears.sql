begin;
-- Completed game runs, including existing clears synced from the learner's device.
-- These are client-reported game completions, not inferred from lifetime points.
create table public.english_journey_clears (
 learner_id uuid not null references public.profiles(id) on delete cascade,
 level integer not null check(level between 1 and 6),
 score integer not null,
 total integer not null check(total>0),
 recorded_at timestamptz not null default now(),
 primary key(learner_id,level),
 check(score between 0 and total and score::numeric/total>=0.9),
 check((level between 1 and 3 and total=30) or (level=4 and total=10) or (level=5 and total=30) or (level=6 and total=150))
);
alter table public.english_journey_clears enable row level security;
grant select,insert on public.english_journey_clears to authenticated;
create policy own_clear_read on public.english_journey_clears for select to authenticated using(learner_id=auth.uid());
create policy own_clear_insert on public.english_journey_clears for insert to authenticated with check(
 learner_id=auth.uid() and exists(select 1 from public.english_success_members where learner_id=auth.uid())
);
create function public.english_journey_passes() returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null or not (auth.uid()='7bdc33ac-7f21-4ebf-bfbf-343080724890'::uuid or exists(select 1 from public.english_success_members where learner_id=auth.uid())) then
 raise exception 'English Success membership required' using errcode='42501'; end if;
 return (select coalesce(jsonb_agg(jsonb_build_object('level',c.level,'id',p.id,'name',coalesce(nullif(trim(p.display_name),''),'Learner')) order by c.level,lower(p.display_name),p.id),'[]'::jsonb)
 from public.english_journey_clears c join public.profiles p on p.id=c.learner_id
 join public.english_success_members m on m.learner_id=c.learner_id
 where not exists(select 1 from public.english_tester_accounts t where t.learner_id=c.learner_id));
end $$;
revoke all on function public.english_journey_passes() from public,anon;
grant execute on function public.english_journey_passes() to authenticated;
notify pgrst,'reload schema';
commit;
