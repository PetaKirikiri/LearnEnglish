begin;

create table public.fifa_english_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 60),
  owner_id uuid not null references public.profiles(id),
  invite_code text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''),1,16)),
  created_at timestamptz not null default now()
);
create table public.fifa_english_group_members (
  group_id uuid not null references public.fifa_english_groups(id) on delete cascade,
  learner_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key(group_id, learner_id)
);
create index fifa_group_member_lookup on public.fifa_english_group_members(learner_id,group_id);
create table public.fifa_english_scoring_questions (
  question_id text primary key,
  answer text not null,
  active boolean not null default true
);
create table public.fifa_english_weekly_points (
  learner_id uuid not null references public.profiles(id) on delete cascade,
  question_id text not null references public.fifa_english_scoring_questions(question_id),
  week_start date not null,
  awarded_at timestamptz not null default now(),
  primary key(learner_id, question_id, week_start)
);
alter table public.fifa_english_groups enable row level security;
alter table public.fifa_english_group_members enable row level security;
alter table public.fifa_english_scoring_questions enable row level security;
alter table public.fifa_english_weekly_points enable row level security;
revoke all on public.fifa_english_groups, public.fifa_english_group_members,
  public.fifa_english_scoring_questions, public.fifa_english_weekly_points from anon, authenticated;

-- Only the server can award points. A known answer must match the actual choice;
-- a client-supplied score, timestamp, or correct=true alone is not sufficient.
create function public.fifa_english_award_points() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.kind = 'answer' and exists (
    select 1 from public.fifa_english_scoring_questions q
    where q.question_id = new.payload->>'questionId' and q.active
      and q.answer = new.payload->>'choice'
  ) then
    insert into public.fifa_english_weekly_points(learner_id, question_id, week_start)
    values(new.learner_id, new.payload->>'questionId',
      date_trunc('week', clock_timestamp() at time zone 'Asia/Bangkok')::date)
    on conflict do nothing;
  end if;
  return new;
end $$;
revoke all on function public.fifa_english_award_points() from public, anon, authenticated;
create trigger fifa_english_score_answer after insert on public.fifa_english_events
for each row execute function public.fifa_english_award_points();

create function public.fifa_english_create_group(group_name text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare result uuid;
begin
  if auth.uid() is null then raise exception 'Sign in to create a group.'; end if;
  perform pg_advisory_xact_lock(hashtext(auth.uid()::text));
  if (select count(*) from public.fifa_english_groups where owner_id=auth.uid()) >= 5 then
    raise exception 'You can create up to five groups.';
  end if;
  if char_length(trim(group_name)) not between 1 and 60 or group_name is null then
    raise exception 'Use a group name between 1 and 60 characters.';
  end if;
  insert into public.fifa_english_groups(name,owner_id) values(trim(group_name),auth.uid()) returning id into result;
  insert into public.fifa_english_group_members(group_id,learner_id) values(result,auth.uid());
  return result;
end $$;

create function public.fifa_english_join_group(code text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare result uuid;
begin
  if auth.uid() is null then raise exception 'Sign in to join a group.'; end if;
  select id into result from public.fifa_english_groups where invite_code=upper(trim(code)) for update;
  if result is null then raise exception 'That invite code was not found.'; end if;
  if not exists(select 1 from public.fifa_english_group_members where group_id=result and learner_id=auth.uid())
    and (select count(*) from public.fifa_english_group_members where group_id=result) >= 200 then
    raise exception 'This group is full.';
  end if;
  insert into public.fifa_english_group_members(group_id,learner_id) values(result,auth.uid()) on conflict do nothing;
  return result;
end $$;

create function public.fifa_english_my_groups()
returns table(id uuid,name text,invite_code text,members bigint)
language sql stable security definer set search_path = '' as $$
  select g.id,g.name,g.invite_code,(select count(*) from public.fifa_english_group_members x where x.group_id=g.id)
  from public.fifa_english_groups g join public.fifa_english_group_members m on m.group_id=g.id
  where m.learner_id=auth.uid() order by g.created_at,g.id;
$$;

create function public.fifa_english_group_board(target_group uuid, previous_week boolean default false)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
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
      count(w.question_id)*10 as points
    from public.fifa_english_group_members m join public.profiles p on p.id=m.learner_id
    left join public.fifa_english_weekly_points w on w.learner_id=m.learner_id and w.week_start=week
    where m.group_id=target_group group by m.learner_id,p.display_name
  ), ranked as (select *,rank() over(order by points desc) as rank from scores)
  select coalesce(jsonb_agg(jsonb_build_object('id',learner_id,'name',name,'points',points,'rank',rank)
    order by points desc,lower(name),learner_id),'[]'::jsonb) into board from ranked;
  return jsonb_build_object('weekStart',week,'weekEnd',week+7,'rows',board);
end $$;

create function public.fifa_english_leave_group(target_group uuid) returns void
language sql security definer set search_path = '' as $$
  delete from public.fifa_english_group_members where group_id=target_group and learner_id=auth.uid();
$$;

revoke all on function public.fifa_english_create_group(text), public.fifa_english_join_group(text),
  public.fifa_english_my_groups(), public.fifa_english_group_board(uuid,boolean),
  public.fifa_english_leave_group(uuid) from public, anon, authenticated;
grant execute on function public.fifa_english_create_group(text), public.fifa_english_join_group(text),
  public.fifa_english_my_groups(), public.fifa_english_group_board(uuid,boolean),
  public.fifa_english_leave_group(uuid) to authenticated;

commit;
