begin;

create table public.fifa_english_events (
  id uuid primary key,
  learner_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('answer', 'round_completed', 'visit', 'login', 'active_time', 'legacy_import')),
  occurred_at timestamptz not null default now(),
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object')
);
create index fifa_english_events_learner_time on public.fifa_english_events(learner_id, occurred_at, id);
alter table public.fifa_english_events enable row level security;

create function public.fifa_english_is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.profiles where id = auth.uid() and is_admin = true);
$$;
revoke all on function public.fifa_english_is_admin() from public;
grant execute on function public.fifa_english_is_admin() to authenticated;

create policy fifa_english_read_progress on public.fifa_english_events for select to authenticated
using (learner_id = auth.uid() or public.fifa_english_is_admin());
create policy fifa_english_write_own_progress on public.fifa_english_events for insert to authenticated
with check (learner_id = auth.uid());
revoke all on public.fifa_english_events from anon, authenticated;
grant select, insert on public.fifa_english_events to authenticated;

create function public.fifa_english_learners()
returns table(id uuid, display_name text)
language sql stable security definer set search_path = '' as $$
  select p.id, p.display_name from public.profiles p
  where public.fifa_english_is_admin()
  order by lower(p.display_name), p.id;
$$;
revoke all on function public.fifa_english_learners() from public;
grant execute on function public.fifa_english_learners() to authenticated;

commit;
