begin;
create table public.english_tester_accounts (
 learner_id uuid primary key references public.profiles(id) on delete cascade,
 created_at timestamptz not null default now()
);
alter table public.english_tester_accounts enable row level security;
revoke all on public.english_tester_accounts from anon, authenticated;
grant select on public.english_tester_accounts to authenticated;
create policy own_tester_setting on public.english_tester_accounts for select to authenticated using (learner_id=auth.uid());
insert into public.english_tester_accounts(learner_id) values ('7bdc33ac-7f21-4ebf-bfbf-343080724890');

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
  where not exists(select 1 from public.english_tester_accounts testers where testers.learner_id=p.id)
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
    where not exists(select 1 from public.english_tester_accounts testers where testers.learner_id=p.id)
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
    where not exists(select 1 from public.english_tester_accounts testers where testers.learner_id=p.id)
      and w.awarded_at >= (start_local - interval '1 week') at time zone 'Asia/Bangkok'
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
