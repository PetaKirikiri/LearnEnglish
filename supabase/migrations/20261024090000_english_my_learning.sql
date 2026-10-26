-- Shared account database: classroom metadata only. Language content remains
-- in the existing language catalogue. Does not change any existing scores.
begin;
create table public.englishsuccess_class_lessons (
  id uuid primary key,
  number integer not null unique check(number between 1 and 999),
  title text not null check(length(trim(title)) between 1 and 160),
  date text not null default '' check(date='' or date ~ '^\d{4}-\d{2}-\d{2}$'),
  skills text[] not null,
  published boolean not null default false,
  check(not published or cardinality(skills)>0)
);
alter table public.englishsuccess_class_lessons enable row level security;
revoke all on public.englishsuccess_class_lessons from public,anon,authenticated;
grant select,insert,update on public.englishsuccess_class_lessons to authenticated;
create policy lesson_read on public.englishsuccess_class_lessons for select to authenticated
using(published or auth.uid()='7bdc33ac-7f21-4ebf-bfbf-343080724890'::uuid);
create policy lesson_create on public.englishsuccess_class_lessons for insert to authenticated
with check(auth.uid()='7bdc33ac-7f21-4ebf-bfbf-343080724890'::uuid);

-- Yjs document snapshot, merged in the client with optimistic version checks.
create table public.englishsuccess_lesson_documents (
  lesson_id uuid primary key references public.englishsuccess_class_lessons(id),
  snapshot text not null check(length(snapshot) between 1 and 2000000),
  revision integer not null check(revision>=1)
);
alter table public.englishsuccess_lesson_documents enable row level security;
revoke all on public.englishsuccess_lesson_documents from public,anon,authenticated;
grant select,insert,update on public.englishsuccess_lesson_documents to authenticated;
create policy document_read on public.englishsuccess_lesson_documents for select to authenticated
using(exists(select 1 from public.englishsuccess_class_lessons l where l.id=lesson_id));
create policy document_create on public.englishsuccess_lesson_documents for insert to authenticated
with check(auth.uid()='7bdc33ac-7f21-4ebf-bfbf-343080724890'::uuid);
create policy document_edit on public.englishsuccess_lesson_documents for update to authenticated
using(auth.uid()='7bdc33ac-7f21-4ebf-bfbf-343080724890'::uuid)
with check(auth.uid()='7bdc33ac-7f21-4ebf-bfbf-343080724890'::uuid);
create policy lesson_edit on public.englishsuccess_class_lessons for update to authenticated
using(auth.uid()='7bdc33ac-7f21-4ebf-bfbf-343080724890'::uuid)
with check(auth.uid()='7bdc33ac-7f21-4ebf-bfbf-343080724890'::uuid);

-- Learner-safe ranking: no emails, answer histories or last-active timestamps.
-- Existing administrator scoreboard retains its original access policy.
create function public.english_learning_leaderboard(p_period text default 'week')
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare start_at timestamptz; end_at timestamptz; local_now timestamp := now() at time zone 'Asia/Bangkok'; result jsonb;
begin
  if auth.uid() is null then raise exception 'Sign in required' using errcode='42501'; end if;
  if p_period is null or p_period not in ('today','week','month') then raise exception 'Invalid period' using errcode='22023'; end if;
  if auth.uid()<>'7bdc33ac-7f21-4ebf-bfbf-343080724890'::uuid and not exists(
    select 1 from public.englishsuccess_listening_members where course='english' and learner_id=auth.uid()
  ) then raise exception 'Join English practice first' using errcode='42501'; end if;
  start_at := date_trunc(case when p_period='today' then 'day' else p_period end,local_now) at time zone 'Asia/Bangkok';
  end_at := (date_trunc(case when p_period='today' then 'day' else p_period end,local_now) + case p_period when 'today' then interval '1 day' when 'week' then interval '1 week' else interval '1 month' end) at time zone 'Asia/Bangkok';
  with totals as (
    select learner_id,sum(points) points from public.englishsuccess_hotel_answers
    where answered_at>=start_at and answered_at<end_at and public.listening_question_course(question_id)='english' group by learner_id
  ), ranked as (
    select p.id,coalesce(nullif(p.display_name,''),'Learner') name,p.avatar_url,
      coalesce(t.points,0) points,rank() over(order by coalesce(t.points,0) desc) rank
    from public.englishsuccess_listening_members m join public.profiles p on p.id=m.learner_id
    left join totals t on t.learner_id=m.learner_id where m.course='english'
  ) select coalesce(jsonb_agg(jsonb_build_object('id',id,'name',name,'avatarUrl',avatar_url,'points',points,'rank',rank) order by rank,name,id),'[]'::jsonb) into result from ranked;
  return result;
end $$;
revoke all on function public.english_learning_leaderboard(text) from public,anon;
grant execute on function public.english_learning_leaderboard(text) to authenticated;
commit;
