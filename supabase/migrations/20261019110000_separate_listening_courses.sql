-- TARGET: shared accounts bknorpjoyxucrihnpyda. Preserve the existing answer
-- ledger and event IDs. Separate course membership and score views without
-- copying awards or changing historical points.
begin;
create table public.englishsuccess_listening_members (
  course text not null check (course in ('hotel','english')),
  learner_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  last_active_at timestamptz not null default now(),
  primary key(course,learner_id)
);
alter table public.englishsuccess_listening_members enable row level security;
revoke all on public.englishsuccess_listening_members from public,anon,authenticated;

-- Stable legacy IDs retain their audio/progress references. This classification
-- matches the domain-authored general bank in the language database.
create function public.listening_question_course(p_id text) returns text
language sql immutable set search_path='' as $$
  select case when p_id like 'hotel-g3-general-%' then 'english' else 'hotel' end;
$$;
revoke all on function public.listening_question_course(text) from public,anon,authenticated;

insert into public.englishsuccess_listening_members(course,learner_id,joined_at,last_active_at)
select 'hotel',m.learner_id,m.joined_at,m.last_active_at
from public.englishsuccess_hotel_members m
where not exists(select 1 from public.englishsuccess_hotel_answers a where a.learner_id=m.learner_id)
   or exists(select 1 from public.englishsuccess_hotel_answers a where a.learner_id=m.learner_id and public.listening_question_course(a.question_id)='hotel');
insert into public.englishsuccess_listening_members(course,learner_id,joined_at,last_active_at)
select 'english',learner_id,min(answered_at),max(answered_at)
from public.englishsuccess_hotel_answers where public.listening_question_course(question_id)='english' group by learner_id;

create function public.listening_join(p_course text) returns void language plpgsql security definer set search_path='' as $$
begin
  if auth.uid() is null then raise exception 'Sign in required' using errcode='42501'; end if;
  if p_course is null or p_course not in ('hotel','english') then raise exception 'Unknown course' using errcode='22023'; end if;
  -- Compatibility parent for the existing ledger FK, not course membership.
  insert into public.englishsuccess_hotel_members(learner_id) values(auth.uid())
    on conflict(learner_id) do update set last_active_at=now();
  insert into public.englishsuccess_listening_members(course,learner_id) values(p_course,auth.uid())
    on conflict(course,learner_id) do update set last_active_at=now();
end $$;
revoke all on function public.listening_join(text) from public,anon,authenticated;
create or replace function public.hotel_join() returns void language sql security definer set search_path='' as $$ select public.listening_join('hotel'); $$;
create function public.english_join() returns void language sql security definer set search_path='' as $$ select public.listening_join('english'); $$;
revoke all on function public.english_join() from public,anon;
grant execute on function public.english_join() to authenticated;

create or replace function public.hotel_record_answer(p_event_id uuid,p_question_id text,p_choice integer,p_assisted boolean)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  learner uuid := auth.uid(); existing public.englishsuccess_hotel_answers;
  answer_key smallint; is_correct boolean; earned integer; already_earned integer;
  today date := (now() at time zone 'Asia/Bangkok')::date;
begin
  if learner is null then raise exception 'Sign in required' using errcode='42501'; end if;
  if p_event_id is null or p_question_id is null or p_choice is null or p_choice not in (0,1) or p_assisted is null then
    raise exception 'Invalid answer' using errcode='22023'; end if;
  perform pg_advisory_xact_lock(hashtextextended(learner::text,418));
  select * into existing from public.englishsuccess_hotel_answers where event_id=p_event_id;
  if found then
    if existing.learner_id<>learner or existing.question_id<>p_question_id or existing.choice<>p_choice or existing.assisted<>p_assisted then
      raise exception 'Answer ID already used' using errcode='22023'; end if;
    return jsonb_build_object('points',existing.points,'correct',existing.correct);
  end if;
  select answer into answer_key from public.englishsuccess_hotel_questions where id=p_question_id and active;
  if not found then raise exception 'Unknown listening question' using errcode='22023'; end if;
  -- Old deployed/offline clients can still flush general answers through this
  -- endpoint. The server assigns them to English, never Hotel's scoreboard.
  perform public.listening_join(public.listening_question_course(p_question_id));
  is_correct := p_choice=answer_key;
  select coalesce(sum(points),0) into already_earned from public.englishsuccess_hotel_answers
    where learner_id=learner and question_id=p_question_id and score_day=today;
  earned := greatest(0,(case when not is_correct then 0 when p_assisted then 5 else 10 end)-already_earned);
  insert into public.englishsuccess_hotel_answers(event_id,learner_id,question_id,choice,assisted,correct,points,score_day)
    values(p_event_id,learner,p_question_id,p_choice,p_assisted,is_correct,earned,today);
  return jsonb_build_object('points',earned,'correct',is_correct);
end $$;
create function public.english_record_answer(p_event_id uuid,p_question_id text,p_choice integer,p_assisted boolean)
returns jsonb language plpgsql security definer set search_path='' as $$
begin
  if auth.uid() is null then raise exception 'Sign in required' using errcode='42501'; end if;
  if public.listening_question_course(p_question_id) <> 'english' then raise exception 'Not an English question' using errcode='22023'; end if;
  return public.hotel_record_answer(p_event_id,p_question_id,p_choice,p_assisted);
end $$;
revoke all on function public.english_record_answer(uuid,text,integer,boolean) from public,anon;
grant execute on function public.english_record_answer(uuid,text,integer,boolean) to authenticated;

create function public.listening_scoreboard(p_course text,p_period text) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare start_at timestamptz; end_at timestamptz; local_now timestamp := now() at time zone 'Asia/Bangkok'; result jsonb;
begin
  if auth.uid() is distinct from '7bdc33ac-7f21-4ebf-bfbf-343080724890'::uuid then raise exception 'Admin access required' using errcode='42501'; end if;
  if p_course is null or p_course not in ('hotel','english') or p_period is null or p_period not in ('today','week','month','all') then
    raise exception 'Invalid course or period' using errcode='22023'; end if;
  if p_period='all' then start_at := '-infinity'; end_at := 'infinity';
  else
    start_at := date_trunc(case when p_period='today' then 'day' else p_period end,local_now) at time zone 'Asia/Bangkok';
    end_at := (date_trunc(case when p_period='today' then 'day' else p_period end,local_now)
      + case p_period when 'today' then interval '1 day' when 'week' then interval '1 week' else interval '1 month' end) at time zone 'Asia/Bangkok';
  end if;
  with totals as (
    select learner_id,sum(points) points,count(*) answers,count(*) filter(where correct) correct
    from public.englishsuccess_hotel_answers
    where answered_at>=start_at and answered_at<end_at and public.listening_question_course(question_id)=p_course group by learner_id
  ), members as (
    select m.learner_id id,coalesce(nullif(p.display_name,''),'Learner') name,nullif(p.avatar_url,'') avatar,
      coalesce(t.points,0) points,coalesce(t.answers,0) answers,coalesce(t.correct,0) correct,m.last_active_at
    from public.englishsuccess_listening_members m join public.profiles p on p.id=m.learner_id
    left join totals t on t.learner_id=m.learner_id where m.course=p_course
  ), ranked as (select *,rank() over(order by points desc) rank from members)
  select coalesce(jsonb_agg(jsonb_build_object('id',id,'name',name,'avatarUrl',avatar,'points',points,'answers',answers,
    'correct',correct,'rank',rank,'lastActiveAt',last_active_at) order by points desc,lower(name),id),'[]'::jsonb) into result from ranked;
  return result;
end $$;
revoke all on function public.listening_scoreboard(text,text) from public,anon,authenticated;
create or replace function public.hotel_scoreboard(p_period text default 'week') returns jsonb
language sql stable security definer set search_path='' as $$ select public.listening_scoreboard('hotel',p_period); $$;
create function public.english_scoreboard(p_period text default 'week') returns jsonb
language sql stable security definer set search_path='' as $$ select public.listening_scoreboard('english',p_period); $$;
revoke all on function public.english_scoreboard(text) from public,anon;
grant execute on function public.english_scoreboard(text) to authenticated;
commit;
