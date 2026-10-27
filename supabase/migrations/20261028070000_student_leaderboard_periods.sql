begin;
-- Combine existing English learners and validated awards. Hotel/Padel stay separate.
create or replace function public.english_success_leaderboard(p_period text)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare
 start_at timestamptz; end_at timestamptz;
 local_now timestamp := now() at time zone 'Asia/Bangkok'; result jsonb;
begin
 if auth.uid() is null or not (
  auth.uid()='7bdc33ac-7f21-4ebf-bfbf-343080724890'::uuid
  or exists(select 1 from public.english_success_members where learner_id=auth.uid())
  or exists(select 1 from public.englishsuccess_listening_members where course='english' and learner_id=auth.uid())
  or exists(select 1 from public.fifa_english_group_members where learner_id=auth.uid())
  or exists(select 1 from public.fifa_english_events where learner_id=auth.uid())
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
  union select learner_id from public.englishsuccess_listening_members where course='english'
  union select learner_id from public.fifa_english_group_members
  union select learner_id from public.fifa_english_events
  union select learner_id from public.fifa_english_weekly_points
  union select learner_id from public.english_word_attempts
 ), awards as (
  -- These ledgers are distinct activities. Preserve existing help deductions and awards.
  select learner_id,points::bigint points from public.fifa_english_weekly_points
   where awarded_at>=start_at and awarded_at<end_at and awarded_at<=now()
  union all
  select learner_id,points::bigint from public.englishsuccess_hotel_answers
   where public.listening_question_course(question_id)='english'
    and answered_at>=start_at and answered_at<end_at and answered_at<=now()
  union all
  select learner_id,10::bigint from public.english_word_attempts
   where correct and occurred_at>=start_at and occurred_at<end_at and occurred_at<=now()
 ), totals as (select learner_id,sum(points)::bigint points from awards group by learner_id),
 scores as (
  select p.id,coalesce(nullif(trim(p.display_name),''),'Learner') name,nullif(p.avatar_url,'') avatar,
   coalesce(t.points,0) points
  from members m join public.profiles p on p.id=m.learner_id
  left join totals t on t.learner_id=m.learner_id
  where p.id<>'7bdc33ac-7f21-4ebf-bfbf-343080724890'::uuid
 ), ranked as (select *,case when points>0 then rank() over(order by points desc) end rank from scores)
 select coalesce(jsonb_agg(jsonb_build_object('id',id,'name',name,'avatarUrl',avatar,'points',points,'rank',rank)
  order by points desc,lower(name),id),'[]'::jsonb) into result from ranked;
 return jsonb_build_object('period',p_period,'timeZone','Asia/Bangkok',
  'periodStart',case when p_period<>'all' then (start_at at time zone 'Asia/Bangkok')::date end,
  'periodEnd',case when p_period<>'all' then (end_at at time zone 'Asia/Bangkok')::date end,'rows',result);
end $$;
revoke all on function public.english_success_leaderboard(text) from public,anon;
grant execute on function public.english_success_leaderboard(text) to authenticated;
-- Keep already-open clients compatible while the new interface is released.
create or replace function public.english_success_leaderboard() returns jsonb
language sql stable security definer set search_path='' as $$
 select public.english_success_leaderboard('all')->'rows';
$$;
notify pgrst,'reload schema';
commit;
