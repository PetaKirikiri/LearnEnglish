begin;
-- Preserve every historical award at its original ten points.
alter table public.fifa_english_weekly_points add column points integer not null default 10 check (points between 0 and 10);

-- Never accept a client-supplied score. Count distinct normalized hint words.
create or replace function public.fifa_english_answer_points(help_words jsonb)
returns integer language plpgsql immutable set search_path = '' as $$
declare used_count integer;
begin
  if help_words is null then return 10; end if;
  if jsonb_typeof(help_words) <> 'array' then return 0; end if;
  if jsonb_array_length(help_words) > 100 then return 0; end if;
  if exists(select 1 from jsonb_array_elements(help_words) w where jsonb_typeof(w) <> 'string') then return 0; end if;
  select count(distinct lower(replace(btrim(word), '’', ''''))) into used_count
  from jsonb_array_elements_text(help_words) word where btrim(word) <> '';
  return greatest(0, 10 - 2 * used_count);
end $$;
revoke all on function public.fifa_english_answer_points(jsonb) from public, anon, authenticated;

create or replace function public.fifa_english_award_points()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.kind = 'answer' and exists (
    select 1 from public.fifa_english_scoring_questions q
    where q.question_id = new.payload->>'questionId' and q.active
      and q.answer = new.payload->>'choice'
  ) then
    insert into public.fifa_english_weekly_points(learner_id, question_id, week_start, points)
    values(new.learner_id, new.payload->>'questionId',
      date_trunc('week', clock_timestamp() at time zone 'Asia/Bangkok')::date,
      public.fifa_english_answer_points(new.payload->'helpWords'))
    on conflict do nothing;
  end if;
  return new;
end $$;

CREATE OR REPLACE FUNCTION public.fifa_english_group_board(target_group uuid, previous_week boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  week date := date_trunc('week', now() at time zone 'Asia/Bangkok')::date;
  board jsonb;
begin
  if auth.uid() is null or not exists(select 1 from public.fifa_english_group_members where group_id=target_group and learner_id=auth.uid()) then
    raise exception 'Join this group to see its leaderboard.';
  end if;
  if previous_week then week := week-7; end if;
  with scores as (
    select m.learner_id,coalesce(nullif(p.display_name,''),'Player') as name,
      coalesce(sum(w.points),0) as points
    from public.fifa_english_group_members m join public.profiles p on p.id=m.learner_id
    left join public.fifa_english_weekly_points w on w.learner_id=m.learner_id and w.week_start=week
    where m.group_id=target_group group by m.learner_id,p.display_name
  ), ranked as (select *,rank() over(order by points desc) as rank from scores)
  select coalesce(jsonb_agg(jsonb_build_object('id',learner_id,'name',name,'points',points,'rank',rank)
    order by points desc,lower(name),learner_id),'[]'::jsonb) into board from ranked;
  return jsonb_build_object('weekStart',week,'weekEnd',week+7,'rows',board);
end $function$
;

CREATE OR REPLACE FUNCTION public.fifa_english_admin_members()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare result jsonb;
begin
  if auth.uid() is null or not public.fifa_english_is_admin() then
    raise exception 'Admin access required.';
  end if;
  with activity as (
    select learner_id, min(occurred_at) as first_seen,
      max(occurred_at) filter(where kind <> 'legacy_import') as last_active,
      count(*) filter(where kind='login') as logins,
      count(*) filter(where kind='answer') as answers,
      count(*) filter(where kind='answer' and payload->>'correct'='true') as correct
    from public.fifa_english_events group by learner_id
  ), membership as (
    select m.learner_id,min(m.joined_at) as joined_at,
      jsonb_agg(jsonb_build_object('name',g.name,'joinedAt',m.joined_at) order by g.name,g.id) as groups
    from public.fifa_english_group_members m join public.fifa_english_groups g on g.id=m.group_id
    group by m.learner_id
  ), points as (
    select learner_id,sum(points) as score from public.fifa_english_weekly_points
    where week_start=date_trunc('week',now() at time zone 'Asia/Bangkok')::date group by learner_id
  ), joined as (select learner_id from activity union select learner_id from membership)
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',p.id,'name',coalesce(nullif(p.display_name,''),'Player'),
    'firstSeen',least(a.first_seen,m.joined_at),'lastActive',a.last_active,
    'logins',coalesce(a.logins,0),'answers',coalesce(a.answers,0),'correct',coalesce(a.correct,0),
    'groups',coalesce(m.groups,'[]'::jsonb),'weeklyPoints',coalesce(w.score,0)
  ) order by least(a.first_seen,m.joined_at),p.id),'[]'::jsonb) into result
  from joined j join public.profiles p on p.id=j.learner_id
  left join activity a on a.learner_id=p.id left join membership m on m.learner_id=p.id
  left join points w on w.learner_id=p.id;
  return result;
end $function$
;

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
  ), scores as (
    select p.id, coalesce(nullif(p.display_name, ''), 'Player') as name,
      nullif(p.avatar_url, '') as avatar_url, coalesce(a.points, 0) as points
    from members m join public.profiles p on p.id = m.learner_id
    left join awarded a on a.learner_id = p.id
  ), ranked as (select *, rank() over (order by points desc) as rank from scores)
  select coalesce(jsonb_agg(jsonb_build_object('id', id, 'name', name,
    'avatarUrl', avatar_url, 'points', points, 'rank', rank)
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
    'periodEnd', end_local::date, 'rows', board, 'champion', champion);
end $function$
;

commit;
