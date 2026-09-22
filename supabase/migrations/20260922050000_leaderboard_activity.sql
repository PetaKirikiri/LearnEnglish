begin;
-- Expose dated practice activity alongside validated points without changing awards.
CREATE OR REPLACE FUNCTION public.fifa_english_leaderboard_period(target_period text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  local_now timestamp := now() at time zone 'Asia/Bangkok';
  start_local timestamp;
  end_local timestamp;
  board jsonb;
  champion jsonb;
begin
  if auth.uid() is null or not (
    exists (select 1 from public.fifa_english_events where learner_id = auth.uid())
    or exists (select 1 from public.fifa_english_group_members where learner_id = auth.uid())
  ) then raise exception 'FIFA English membership required.' using errcode = '42501'; end if;
  if target_period is null or target_period not in ('today', 'week', 'month') then
    raise exception 'Invalid leaderboard period.' using errcode = '22023';
  end if;
  start_local := date_trunc(case when target_period = 'today' then 'day' else target_period end, local_now);
  end_local := start_local + case target_period when 'today' then interval '1 day' when 'week' then interval '1 week' else interval '1 month' end;

  with members as (
    select learner_id from public.fifa_english_events
    union select learner_id from public.fifa_english_group_members
  ), awarded as (
    -- Each ledger row is a server-validated award, reduced by word help. Never reconstruct
    -- points from client correct flags, local memory, or raw answer counts.
    select learner_id, sum(points) as points
    from public.fifa_english_weekly_points
    where awarded_at >= start_local at time zone 'Asia/Bangkok'
      and awarded_at < end_local at time zone 'Asia/Bangkok'
    group by learner_id
  ), activity as (
    -- Count every saved attempt, including retries that earn no extra points.
    -- Use when the answer happened, including answers synced after offline practice.
    select learner_id,
      count(*) filter (where occurred_at >= start_local at time zone 'Asia/Bangkok'
        and occurred_at < end_local at time zone 'Asia/Bangkok') as answers,
      max(occurred_at) as last_answered_at
    from public.fifa_english_events
    where kind = 'answer' and occurred_at <= now()
    group by learner_id
  ), scores as (
    select p.id, coalesce(nullif(p.display_name, ''), 'Player') as name,
      nullif(p.avatar_url, '') as avatar_url, coalesce(a.points, 0) as points,
      coalesce(v.answers, 0) as answers, v.last_answered_at
    from members m join public.profiles p on p.id = m.learner_id
    left join awarded a on a.learner_id = p.id
    left join activity v on v.learner_id = p.id
  ), ranked as (select *, rank() over (order by points desc) as rank from scores)
  select coalesce(jsonb_agg(jsonb_build_object('id', id, 'name', name,
    'avatarUrl', avatar_url, 'points', points, 'rank', rank,
    'answers', answers, 'lastAnsweredAt', last_answered_at)
    order by points desc, lower(name), id), '[]'::jsonb)
  into board from ranked;

  if (board->0->>'points')::bigint > 0 then champion := board->0;
  elsif target_period = 'week' then
    -- Preserve last week's reigning champion on the learner's header only.
    select jsonb_build_object('id', p.id, 'name', coalesce(nullif(p.display_name, ''), 'Player'),
      'avatarUrl', nullif(p.avatar_url, ''), 'points', sum(points), 'rank', 1,
      'weekStart', (start_local - interval '1 week')::date)
    into champion
    from public.fifa_english_weekly_points w join public.profiles p on p.id = w.learner_id
    where w.awarded_at >= (start_local - interval '1 week') at time zone 'Asia/Bangkok'
      and w.awarded_at < start_local at time zone 'Asia/Bangkok'
      and (exists (select 1 from public.fifa_english_events e where e.learner_id=p.id)
        or exists (select 1 from public.fifa_english_group_members m where m.learner_id=p.id))
    group by p.id, p.display_name
    having sum(w.points) > 0
    order by sum(w.points) desc, lower(coalesce(nullif(p.display_name, ''), 'Player')), p.id limit 1;
  end if;
  return jsonb_build_object('period', target_period, 'periodStart', start_local::date,
    'periodEnd', end_local::date, 'timeZone', 'Asia/Bangkok', 'rows', board, 'champion', champion);
end $function$
;


commit;
