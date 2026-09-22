-- This entire check rolls back: no learner history or test scores persist.
begin;
do $$
declare
  learner uuid := '7bdc33ac-7f21-4ebf-bfbf-343080724890';
  period text;
  board jsonb;
  before_row jsonb;
  after_row jsonb;
  start_at timestamptz;
  end_at timestamptz;
  marker text;
begin
  perform set_config('request.jwt.claim.sub', learner::text, true);
  foreach period in array array['today','week','month'] loop
    board := public.fifa_english_leaderboard_period(period);
    if board->>'timeZone' <> 'Asia/Bangkok' then raise exception 'Missing timezone'; end if;
    start_at := (board->>'periodStart')::date::timestamp at time zone 'Asia/Bangkok';
    end_at := (board->>'periodEnd')::date::timestamp at time zone 'Asia/Bangkok';
    if start_at <> date_trunc(case when period='today' then 'day' else period end,
      now() at time zone 'Asia/Bangkok') at time zone 'Asia/Bangkok' then
      raise exception 'Incorrect calendar boundary for %', period;
    end if;
    select r into before_row from jsonb_array_elements(board->'rows') r where r->>'id'=learner::text;
    marker := 'leaderboard-activity-test-' || gen_random_uuid()::text;
    -- An unregistered answer gives no points, but still represents an attempt.
    insert into public.fifa_english_events(id,learner_id,kind,occurred_at,payload)
    select gen_random_uuid(),learner,'answer',t,
      jsonb_build_object('questionId',marker,'choice','unregistered','correct',true)
    from unnest(array[start_at-interval '1 microsecond',start_at,now(),end_at]) t;
    insert into public.fifa_english_events(id,learner_id,kind,occurred_at,payload)
      values(gen_random_uuid(),learner,'visit',now(),'{}');
    select r into after_row from jsonb_array_elements(public.fifa_english_leaderboard_period(period)->'rows') r
      where r->>'id'=learner::text;
    if (after_row->>'answers')::bigint <> (before_row->>'answers')::bigint+2 then
      raise exception 'Attempt boundaries or event filtering failed for %', period;
    end if;
    if (after_row->>'lastAnsweredAt')::timestamptz <> now() then
      raise exception 'Last answer should exclude future events';
    end if;
    if after_row->>'points' <> before_row->>'points' then raise exception 'Unvalidated activity awarded points'; end if;
    -- Points use the original award ledger, including help deductions, with an exclusive end.
    insert into public.fifa_english_scoring_questions(question_id,answer,active)
      values(marker,'right',true),(marker||'-end','right',true);
    insert into public.fifa_english_weekly_points(learner_id,question_id,week_start,awarded_at,points)
      values(learner,marker,date_trunc('week',now())::date,start_at,6),
        (learner,marker||'-end',date_trunc('week',now())::date,end_at,10);
    select r into after_row from jsonb_array_elements(public.fifa_english_leaderboard_period(period)->'rows') r
      where r->>'id'=learner::text;
    if (after_row->>'points')::bigint <> (before_row->>'points')::bigint+6 then
      raise exception 'Award boundaries or reduced points failed for %', period;
    end if;
    delete from public.fifa_english_events where learner_id=learner and payload->>'questionId'=marker;
    delete from public.fifa_english_weekly_points where learner_id=learner and question_id in (marker,marker||'-end');
    delete from public.fifa_english_scoring_questions where question_id in (marker,marker||'-end');
  end loop;
  -- Every returned member's activity must match their real answer dates, including zeros.
  if exists (
    select 1 from unnest(array['today','week','month']) selected_period
    cross join lateral (select public.fifa_english_leaderboard_period(selected_period) data) b
    cross join lateral jsonb_to_recordset(b.data->'rows') r(id uuid, answers bigint)
    where r.answers <> (select count(*) from public.fifa_english_events e where e.learner_id=r.id
      and e.kind='answer' and e.occurred_at <= now()
      and e.occurred_at >= (b.data->>'periodStart')::date::timestamp at time zone 'Asia/Bangkok'
      and e.occurred_at < (b.data->>'periodEnd')::date::timestamp at time zone 'Asia/Bangkok')
  ) then raise exception 'Activity does not match saved events'; end if;
end $$;
rollback;
