begin;
-- Hotel-only activity lives with shared accounts, never in FIFA's point ledger.
create table public.englishsuccess_hotel_questions (
  id text primary key, answer smallint not null check (answer in (0,1)), active boolean not null default true
);
create table public.englishsuccess_hotel_members (
  learner_id uuid primary key references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(), last_active_at timestamptz not null default now()
);
create table public.englishsuccess_hotel_answers (
  event_id uuid primary key,
  learner_id uuid not null references public.englishsuccess_hotel_members(learner_id) on delete cascade,
  question_id text not null references public.englishsuccess_hotel_questions(id),
  choice smallint not null check (choice in (0,1)), assisted boolean not null,
  correct boolean not null, points smallint not null check (points between 0 and 10),
  answered_at timestamptz not null default now(),
  score_day date not null default (now() at time zone 'Asia/Bangkok')::date
);
create index hotel_answers_learner_day on public.englishsuccess_hotel_answers(learner_id,score_day,question_id);
create index hotel_answers_time on public.englishsuccess_hotel_answers(answered_at);
alter table public.englishsuccess_hotel_questions enable row level security;
alter table public.englishsuccess_hotel_members enable row level security;
alter table public.englishsuccess_hotel_answers enable row level security;
revoke all on public.englishsuccess_hotel_questions, public.englishsuccess_hotel_members, public.englishsuccess_hotel_answers from public, anon, authenticated;

create function public.hotel_join() returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Sign in required' using errcode='42501'; end if;
  insert into public.englishsuccess_hotel_members(learner_id) values(auth.uid())
    on conflict(learner_id) do update set last_active_at=now();
end $$;

create function public.hotel_record_answer(p_event_id uuid, p_question_id text, p_choice integer, p_assisted boolean)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  learner uuid := auth.uid(); existing public.englishsuccess_hotel_answers;
  answer_key smallint; is_correct boolean; earned integer; already_earned integer;
  today date := (now() at time zone 'Asia/Bangkok')::date;
begin
  if learner is null then raise exception 'Sign in required' using errcode='42501'; end if;
  if p_event_id is null or p_question_id is null or p_choice is null or p_choice not in (0,1) or p_assisted is null then
    raise exception 'Invalid answer' using errcode='22023'; end if;
  -- Serialize awards for one account across devices; event IDs make retries safe.
  perform pg_advisory_xact_lock(hashtextextended(learner::text, 418));
  select * into existing from public.englishsuccess_hotel_answers where event_id=p_event_id;
  if found then
    if existing.learner_id<>learner or existing.question_id<>p_question_id or existing.choice<>p_choice or existing.assisted<>p_assisted then
      raise exception 'Answer ID already used' using errcode='22023'; end if;
    return jsonb_build_object('points',existing.points,'correct',existing.correct);
  end if;
  select answer into answer_key from public.englishsuccess_hotel_questions where id=p_question_id and active;
  if not found then raise exception 'Unknown Hotel question' using errcode='22023'; end if;
  perform public.hotel_join();
  is_correct := p_choice=answer_key;
  select coalesce(sum(points),0) into already_earned from public.englishsuccess_hotel_answers
    where learner_id=learner and question_id=p_question_id and score_day=today;
  earned := greatest(0, (case when not is_correct then 0 when p_assisted then 5 else 10 end)-already_earned);
  insert into public.englishsuccess_hotel_answers(event_id,learner_id,question_id,choice,assisted,correct,points,score_day)
    values(p_event_id,learner,p_question_id,p_choice,p_assisted,is_correct,earned,today);
  return jsonb_build_object('points',earned,'correct',is_correct);
end $$;

create function public.hotel_scoreboard(p_period text default 'week') returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare start_at timestamptz; end_at timestamptz; local_now timestamp := now() at time zone 'Asia/Bangkok'; result jsonb;
begin
  -- Only the existing EnglishSuccess administrator can inspect member activity.
  if auth.uid() is distinct from '7bdc33ac-7f21-4ebf-bfbf-343080724890'::uuid then
    raise exception 'Admin access required' using errcode='42501'; end if;
  if p_period is null or p_period not in ('today','week','month','all') then
    raise exception 'Invalid period' using errcode='22023'; end if;
  if p_period='all' then start_at := '-infinity'; end_at := 'infinity';
  else
    start_at := date_trunc(case when p_period='today' then 'day' else p_period end,local_now) at time zone 'Asia/Bangkok';
    end_at := (date_trunc(case when p_period='today' then 'day' else p_period end,local_now)
      + case p_period when 'today' then interval '1 day' when 'week' then interval '1 week' else interval '1 month' end) at time zone 'Asia/Bangkok';
  end if;
  with totals as (
    select learner_id,sum(points) points,count(*) answers,count(*) filter(where correct) correct
    from public.englishsuccess_hotel_answers where answered_at>=start_at and answered_at<end_at group by learner_id
  ), members as (
    select m.learner_id id, coalesce(nullif(p.display_name,''),'Learner') name, nullif(p.avatar_url,'') avatar,
      coalesce(t.points,0) points,coalesce(t.answers,0) answers,coalesce(t.correct,0) correct,m.last_active_at
    from public.englishsuccess_hotel_members m join public.profiles p on p.id=m.learner_id
    left join totals t on t.learner_id=m.learner_id
  ), ranked as (select *,rank() over(order by points desc) rank from members)
  select coalesce(jsonb_agg(jsonb_build_object('id',id,'name',name,'avatarUrl',avatar,'points',points,'answers',answers,
    'correct',correct,'rank',rank,'lastActiveAt',last_active_at) order by points desc,lower(name),id),'[]'::jsonb) into result from ranked;
  return result;
end $$;
revoke all on function public.hotel_join(),public.hotel_record_answer(uuid,text,integer,boolean),public.hotel_scoreboard(text) from public,anon;
grant execute on function public.hotel_join(),public.hotel_record_answer(uuid,text,integer,boolean),public.hotel_scoreboard(text) to authenticated;
commit;
