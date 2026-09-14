begin;
create or replace function public.fifa_english_admin_members() returns jsonb
language plpgsql stable security definer set search_path='' as $$
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
    select learner_id,count(*)*10 as score from public.fifa_english_weekly_points
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
end $$;
revoke all on function public.fifa_english_admin_members() from public,anon,authenticated;
grant execute on function public.fifa_english_admin_members() to authenticated;
commit;
