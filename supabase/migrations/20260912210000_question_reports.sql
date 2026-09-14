begin;
create table public.fifa_english_question_reports (
 id uuid primary key,
 learner_id uuid not null references public.profiles(id),
 question_id text not null,
 question jsonb not null,
 reason text not null check (reason in ('More than one answer fits', 'Doesn’t make sense', 'Other')),
 note text not null default '' check (length(note) <= 1000),
 created_at timestamptz not null default now()
);
alter table public.fifa_english_question_reports enable row level security;
revoke all on public.fifa_english_question_reports from anon, authenticated;
grant select, insert on public.fifa_english_question_reports to authenticated;
create policy report_own_question on public.fifa_english_question_reports for insert to authenticated
with check (learner_id = auth.uid());
create policy read_question_reports on public.fifa_english_question_reports for select to authenticated
using (learner_id = auth.uid() or auth.uid() = '7bdc33ac-7f21-4ebf-bfbf-343080724890'::uuid);
commit;
