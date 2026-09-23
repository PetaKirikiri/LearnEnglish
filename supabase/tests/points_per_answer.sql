-- Run in a transaction and roll back. Tests do not persist learner activity.
do $$
declare
  learner uuid := (select learner_id from public.fifa_english_events limit 1);
  q text := 'repetition-test-' || gen_random_uuid()::text;
  first_event uuid := gen_random_uuid();
  second_event uuid := gen_random_uuid();
  offline_event uuid := gen_random_uuid();
  previous_week timestamptz := (date_trunc('week', now() at time zone 'Asia/Bangkok') - interval '1 day') at time zone 'Asia/Bangkok';
  board jsonb;
  before_points bigint;
  after_points bigint;
begin
  perform set_config('request.jwt.claim.sub', learner::text, true);
  select (r->>'points')::bigint into before_points
    from jsonb_array_elements(public.fifa_english_leaderboard_period('today')->'rows') r
    where r->>'id' = learner::text;
  insert into public.fifa_english_scoring_questions(question_id, answer, active) values(q, 'right', true);

  insert into public.fifa_english_events(id, learner_id, kind, payload) values
    (first_event, learner, 'answer', jsonb_build_object('questionId', q, 'choice', 'right', 'helpWords', '[]'::jsonb)),
    (second_event, learner, 'answer', jsonb_build_object('questionId', q, 'choice', 'right', 'helpWords', '["one","two"]'::jsonb));
  if (select count(*) from public.fifa_english_weekly_points where question_id=q) <> 2
    or (select sum(points) from public.fifa_english_weekly_points where question_id=q) <> 16 then
    raise exception 'Two correct repetitions must both earn points, with individual help deductions';
  end if;

  -- A network retry reuses the answer ID and must not generate another award.
  insert into public.fifa_english_events(id, learner_id, kind, payload)
    values(first_event, learner, 'answer', jsonb_build_object('questionId', q, 'choice', 'right'))
    on conflict (id) do nothing;
  if (select count(*) from public.fifa_english_weekly_points where question_id=q) <> 2 then
    raise exception 'A sync retry awarded points twice';
  end if;
  insert into public.fifa_english_events(id, learner_id, kind, payload) values
    (gen_random_uuid(), learner, 'answer', jsonb_build_object('questionId', q, 'choice', 'wrong', 'correct', true, 'points', 1000)),
    (gen_random_uuid(), learner, 'visit', jsonb_build_object('questionId', q, 'choice', 'right')),
    (gen_random_uuid(), learner, 'answer', jsonb_build_object('questionId', q || '-unknown', 'choice', 'right', 'correct', true));
  if (select count(*) from public.fifa_english_weekly_points where question_id like q || '%') <> 2 then
    raise exception 'Wrong, unknown, or non-answer events earned points';
  end if;

  -- Offline repetitions belong to when the practice happened, not when it synced.
  insert into public.fifa_english_events(id, learner_id, kind, occurred_at, payload)
    values(offline_event, learner, 'answer', previous_week, jsonb_build_object('questionId', q, 'choice', 'right'));
  if not exists(select 1 from public.fifa_english_weekly_points where event_id=offline_event
    and awarded_at=previous_week
    and week_start=date_trunc('week', previous_week at time zone 'Asia/Bangkok')::date and points=10) then
    raise exception 'Offline practice was credited to the wrong period';
  end if;
  board := public.fifa_english_leaderboard_period('today');
  select (r->>'points')::bigint into after_points from jsonb_array_elements(board->'rows') r where r->>'id'=learner::text;
  if after_points <> before_points + 16 then
    raise exception 'Today must include both new repetitions and exclude last-week offline practice';
  end if;
  if has_table_privilege('authenticated', 'public.fifa_english_weekly_points', 'INSERT') then
    raise exception 'Clients must not write points directly';
  end if;
end $$;
