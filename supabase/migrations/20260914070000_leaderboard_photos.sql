begin;

create or replace function public.fifa_english_leaderboard() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  week date := date_trunc('week', now() at time zone 'Asia/Bangkok')::date;
  board jsonb;
  champion jsonb;
begin
  if auth.uid() is null or not (
    exists (select 1 from public.fifa_english_events where learner_id = auth.uid())
    or exists (select 1 from public.fifa_english_group_members where learner_id = auth.uid())
  ) then
    raise exception 'FIFA English membership required.' using errcode = '42501';
  end if;

  with members as (
    select learner_id from public.fifa_english_events
    union
    select learner_id from public.fifa_english_group_members
  ), weekly_scores as (
    select learner_id, count(*) * 10 as points
    from public.fifa_english_weekly_points
    where week_start = week
    group by learner_id
  ), scores as (
    select p.id, coalesce(nullif(p.display_name, ''), 'Player') as name,
      coalesce(w.points, 0) as points, nullif(p.avatar_url, '') as avatar_url
    from members m
    join public.profiles p on p.id = m.learner_id
    left join weekly_scores w on w.learner_id = m.learner_id
  ), ranked as (
    select *, rank() over (order by points desc) as rank from scores
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', id, 'name', name, 'points', points, 'rank', rank, 'avatarUrl', avatar_url
  ) order by points desc, lower(name), id), '[]'::jsonb)
  into board from ranked;

  -- Keep the reigning champion visible after Monday's reset. Any scored
  -- answer this week takes precedence; never choose an arbitrary zero scorer.
  select jsonb_build_object('id', p.id,
    'name', coalesce(nullif(p.display_name, ''), 'Player'),
    'points', count(*) * 10, 'rank', 1, 'weekStart', w.week_start,
    'avatarUrl', nullif(p.avatar_url, ''))
  into champion
  from public.fifa_english_weekly_points w
  join public.profiles p on p.id = w.learner_id
  where w.week_start in (week, week - 7)
    and (exists (select 1 from public.fifa_english_events e where e.learner_id = p.id)
      or exists (select 1 from public.fifa_english_group_members m where m.learner_id = p.id))
  group by w.week_start, p.id, p.display_name
  order by w.week_start desc, count(*) desc,
    lower(coalesce(nullif(p.display_name, ''), 'Player')), p.id
  limit 1;

  return jsonb_build_object('weekStart', week, 'weekEnd', week + 7,
    'rows', board, 'champion', champion);
end $$;

revoke all on function public.fifa_english_leaderboard() from public, anon, authenticated;
grant execute on function public.fifa_english_leaderboard() to authenticated;
commit;
