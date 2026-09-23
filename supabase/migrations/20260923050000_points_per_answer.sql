begin;

-- Repetitions are learning activity. Award each correct answer event, rather than
-- limiting a learner to one award per question/week. Keep the table name so all
-- deployed leaderboard clients continue to work without an app refresh.
lock table public.fifa_english_events in share row exclusive mode;
lock table public.fifa_english_weekly_points in access exclusive mode;

alter table public.fifa_english_weekly_points
  add column id uuid not null default gen_random_uuid(),
  add column event_id uuid references public.fifa_english_events(id) on delete set null;

-- Attach existing awards to the nearest recorded correct answer in their week.
-- Preserve their original amount and date; never re-award the same event.
update public.fifa_english_weekly_points w
set event_id = (
  select e.id from public.fifa_english_events e
  where e.learner_id = w.learner_id and e.kind = 'answer'
    and e.payload->>'questionId' = w.question_id
    and e.payload->>'correct' = 'true'
    and date_trunc('week', e.occurred_at at time zone 'Asia/Bangkok')::date = w.week_start
  order by abs(extract(epoch from (w.awarded_at - e.occurred_at))), e.id
  limit 1
);

alter table public.fifa_english_weekly_points
  drop constraint fifa_english_weekly_points_pkey,
  add primary key (id),
  add constraint fifa_english_points_event_unique unique (event_id);
create index fifa_english_points_learner_week
  on public.fifa_english_weekly_points(learner_id, week_start);

create or replace function public.fifa_english_award_points()
returns trigger language plpgsql security definer set search_path = '' as $$
declare answered_at timestamptz := least(new.occurred_at, clock_timestamp());
begin
  if new.kind = 'answer' and exists (
    select 1 from public.fifa_english_scoring_questions q
    where q.question_id = new.payload->>'questionId' and q.active
      and q.answer = new.payload->>'choice'
  ) then
    insert into public.fifa_english_weekly_points
      (learner_id, question_id, week_start, awarded_at, points, event_id)
    values (new.learner_id, new.payload->>'questionId',
      date_trunc('week', answered_at at time zone 'Asia/Bangkok')::date,
      answered_at, public.fifa_english_answer_points(new.payload->'helpWords'), new.id)
    on conflict (event_id) do nothing;
  end if;
  return new;
end $$;

-- Restore excluded repetitions at their original practice dates. Only backfill
-- answers with both a recorded correct result and a verifiable selected choice.
-- Early records without a choice cannot establish an award and remain untouched.
insert into public.fifa_english_weekly_points
  (learner_id, question_id, week_start, awarded_at, points, event_id)
select e.learner_id, q.question_id,
  date_trunc('week', e.occurred_at at time zone 'Asia/Bangkok')::date,
  e.occurred_at, public.fifa_english_answer_points(e.payload->'helpWords'), e.id
from public.fifa_english_events e
join public.fifa_english_scoring_questions q
  on q.question_id = e.payload->>'questionId' and q.answer = e.payload->>'choice'
where e.kind = 'answer' and e.payload->>'correct' = 'true' and e.occurred_at <= now()
on conflict (event_id) do nothing;

commit;
