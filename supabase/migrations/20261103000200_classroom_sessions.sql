begin;
create table if not exists public.english_class_sessions (
 id uuid primary key default gen_random_uuid(), host_id uuid not null references auth.users, created_at timestamptz not null default now(), current_turn uuid
);
create table if not exists public.english_class_members (
 session_id uuid references public.english_class_sessions on delete cascade, learner_id uuid references auth.users,
 active boolean not null default true, turns integer not null default 0, joined_at timestamptz not null default now(), last_seen timestamptz not null default now(),
 primary key(session_id,learner_id)
);
create table if not exists public.english_class_turns (
 id uuid primary key default gen_random_uuid(), session_id uuid references public.english_class_sessions on delete cascade,
 learner_id uuid not null references auth.users, question_id text not null, version integer not null,
 choices text[] not null, created_at timestamptz not null default now(), answer text, correct boolean
);
alter table public.english_class_sessions enable row level security;
alter table public.english_class_members enable row level security;
alter table public.english_class_turns enable row level security;
-- Only RPCs expose a participant's current task; question keys and other students' history stay private.
create or replace function public.english_classroom(p_action text,p_session uuid default null,p_payload jsonb default '{}') returns jsonb
language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); s public.english_class_sessions; tr public.english_class_turns; q public.english_word_questions;
 target uuid; result jsonb; mode integer; choices text[];
begin
 if uid is null then raise exception 'Sign in with LINE first'; end if;
 if p_action='create' then
  if not public.fifa_english_is_admin() then raise exception 'Teacher account required'; end if;
  insert into public.english_class_sessions(host_id) values(uid) returning * into s;
  return jsonb_build_object('id',s.id);
 end if;
 select * into s from public.english_class_sessions where id=p_session and created_at>now()-interval '18 hours' for update;
 if not found then raise exception 'Class has ended. Scan the current code.';end if;
 if p_action='join' then
  if exists(select 1 from public.english_class_members where session_id=s.id and learner_id=uid and not active) then raise exception 'Ask your teacher to add you back';end if;
  insert into public.english_class_members(session_id,learner_id) values(s.id,uid) on conflict(session_id,learner_id) do update set last_seen=now();
 end if;
 if s.host_id<>uid and not exists(select 1 from public.english_class_members where session_id=s.id and learner_id=uid and active) then raise exception 'Join this class first';end if;
 if p_action in ('remove','restore','next') and s.host_id<>uid then raise exception 'Teacher account required';end if;
 if p_action in ('remove','restore') then
  update public.english_class_members set active=(p_action='restore') where session_id=s.id and learner_id=(p_payload->>'learner')::uuid;
 elsif p_action='next' then
  -- A duplicate click/retry cannot assign another turn.
  if coalesce(p_payload->>'previous','')<>coalesce(s.current_turn::text,'') then raise exception 'The turn changed. Refresh and try again.';end if;
  select learner_id into target from public.english_class_members where session_id=s.id and active
   order by turns+random()*1.5,random() limit 1;
  if target is null then raise exception 'Wait for a student to join';end if;
  mode:=case when random()<0.7 then 0 when random()<0.67 then 1 else 2 end;
  -- Existing blueprint-generated catalogue; favour familiar context, with weaker/new words mixed in.
  select candidate.* into q from public.english_word_questions candidate
  cross join lateral (
   select coalesce(avg(least(25,coalesce(w.correct,0))),0) familiarity,
    coalesce(avg(case when w.attempts>0 then 1.0-w.correct::numeric/w.attempts else 0 end),0) difficulty
   from (select distinct lower(m[1]) token from regexp_matches(candidate.sentence,'([A-Za-z]+)','g') m) words
   left join public.english_word_progress w on w.learner_id=target and w.word_id='en:'||words.token
  ) knowledge
  where candidate.id like 'action-%' and candidate.version=1
    and not exists(select 1 from public.english_class_turns old where old.session_id=s.id and old.learner_id=target and old.question_id=candidate.id)
  order by case mode when 0 then knowledge.familiarity when 1 then knowledge.difficulty*25 else -knowledge.familiarity end+random()*8 desc limit 1;
  if q.id is null then raise exception 'All available questions practised. Open a new class.';end if;
  choices:=q.choices;if random()<0.5 then choices:=array[q.choices[2],q.choices[1]];end if;
  insert into public.english_class_turns(session_id,learner_id,question_id,version,choices) values(s.id,target,q.id,q.version,choices) returning * into tr;
  update public.english_class_members set turns=turns+1 where session_id=s.id and learner_id=target;
  update public.english_class_sessions set current_turn=tr.id where id=s.id returning * into s;
 elsif p_action='answer' then
  select * into tr from public.english_class_turns where id=s.current_turn for update;
  if tr.id is distinct from (p_payload->>'turn')::uuid or tr.learner_id<>uid then raise exception 'This is not your current question';end if;
  if tr.answer is null then
   if not ((p_payload->>'answer')=any(tr.choices)) then raise exception 'Choose one of the answers';end if;
   select * into q from public.english_word_questions where id=tr.question_id and version=tr.version;
   perform public.record_english_word_answer(tr.id,q.id,q.version,p_payload->>'answer',now(),'visible',0,1,uid);
   update public.english_class_turns set answer=p_payload->>'answer',correct=(p_payload->>'answer'=q.answer) where id=tr.id;
  end if;
 elsif p_action not in ('join','state','remove','restore','next') then raise exception 'Unknown classroom action';
 end if;
 update public.english_class_members set last_seen=now() where session_id=s.id and learner_id=uid;
 select * into tr from public.english_class_turns where id=s.current_turn;
 select jsonb_build_object('id',s.id,'host',s.host_id=uid,'me',uid,'members',coalesce((
  select jsonb_agg(jsonb_build_object('id',m.learner_id,'name',coalesce(nullif(p.display_name,''),'Student'),'avatar',p.avatar_url,'active',m.active,'turns',m.turns,'lastSeen',m.last_seen,
   'coins',(select count(*)*10 from public.english_class_turns a where a.session_id=s.id and a.learner_id=m.learner_id and a.correct)) order by m.joined_at)
  from public.english_class_members m join public.profiles p on p.id=m.learner_id where m.session_id=s.id and (s.host_id=uid or m.active)
 ),'[]'::jsonb),'turn',case when tr.id is null then null else jsonb_build_object('id',tr.id,'learner',tr.learner_id,'questionId',tr.question_id,
 'english',(select sentence from public.english_word_questions where id=tr.question_id and version=tr.version),
 'choices',tr.choices,'answer',tr.answer,'correct',tr.correct) end) into result;
 return result;
end;$$;
revoke all on function public.english_classroom(text,uuid,jsonb) from public,anon;
grant execute on function public.english_classroom(text,uuid,jsonb) to authenticated;
commit;
