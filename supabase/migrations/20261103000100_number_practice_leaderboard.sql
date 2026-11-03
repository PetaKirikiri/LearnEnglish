-- Include every saved correct Level 1-3 answer, using its original practice date.
-- Preserve the live classroom roster, tester exclusion and course boundaries.
begin;
CREATE OR REPLACE FUNCTION public.english_success_leaderboard(p_period text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
 start_at timestamptz; end_at timestamptz;
 local_now timestamp := now() at time zone 'Asia/Bangkok'; result jsonb;
begin
 if auth.uid() is null or not (
  auth.uid()='7bdc33ac-7f21-4ebf-bfbf-343080724890'::uuid
  or exists(select 1 from public.english_success_members where learner_id=auth.uid())
 ) then raise exception 'English Success membership required' using errcode='42501'; end if;
 if p_period is null or p_period not in ('today','week','month','all') then
  raise exception 'Invalid leaderboard period' using errcode='22023';
 end if;
 if p_period='all' then start_at:='-infinity'; end_at:='infinity';
 else
  start_at:=date_trunc(case when p_period='today' then 'day' else p_period end,local_now) at time zone 'Asia/Bangkok';
  end_at:=(date_trunc(case when p_period='today' then 'day' else p_period end,local_now)
   +case p_period when 'today' then interval '1 day' when 'week' then interval '1 week' else interval '1 month' end) at time zone 'Asia/Bangkok';
 end if;
 with members as (
  select learner_id from public.english_success_members
 ), awards as (
  -- Only this class's homework awards. Older courses keep their own scores.
  select learner_id,10::bigint points from public.english_word_attempts
   where correct and occurred_at>=start_at and occurred_at<end_at and occurred_at<=now()
  union all
  select learner_id,10::bigint from public.english_number_attempts
   where correct and occurred_at>=start_at and occurred_at<end_at and occurred_at<=now()
 ), totals as (select learner_id,sum(points)::bigint points from awards group by learner_id),
 scores as (
  select p.id,coalesce(nullif(trim(p.display_name),''),'Learner') name,nullif(p.avatar_url,'') avatar,
   coalesce(t.points,0) points
  from members m join public.profiles p on p.id=m.learner_id
  left join totals t on t.learner_id=m.learner_id
  where not exists(select 1 from public.english_tester_accounts testers where testers.learner_id=p.id)
 ), ranked as (select *,case when points>0 then rank() over(order by points desc) end rank from scores)
 select coalesce(jsonb_agg(jsonb_build_object('id',id,'name',name,'avatarUrl',avatar,'points',points,'rank',rank)
  order by points desc,lower(name),id),'[]'::jsonb) into result from ranked;
 return jsonb_build_object('period',p_period,'timeZone','Asia/Bangkok',
  'periodStart',case when p_period<>'all' then (start_at at time zone 'Asia/Bangkok')::date end,
  'periodEnd',case when p_period<>'all' then (end_at at time zone 'Asia/Bangkok')::date end,'rows',result);
end $function$;
notify pgrst,'reload schema';
commit;
