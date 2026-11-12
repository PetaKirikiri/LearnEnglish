begin;
insert into public.english_word_forms(id,form) values ('en:these','these'),('en:those','those') on conflict do nothing;
insert into public.english_word_questions(id,version,sentence,choices,answer,credit_sentence) values
('identify-v1-this-phone',1,'What is this?',array['this','that'],'this','this'),
('identify-v1-that-phone',1,'What is that?',array['that','that over there'],'that','that'),
('identify-v1-over-there-phone',1,'What is that over there?',array['that over there','this'],'that over there','that over there'),
('identify-v1-this-bag',1,'What is this?',array['this','that over there'],'this','this'),
('identify-v1-that-bag',1,'What is that?',array['that','this'],'that','that'),
('identify-v1-over-there-bag',1,'What is that over there?',array['that over there','that'],'that over there','that over there'),
('identify-v1-this-cup',1,'What is this?',array['this','that'],'this','this'),
('identify-v1-that-cup',1,'What is that?',array['that','that over there'],'that','that'),
('identify-v1-over-there-cup',1,'What is that over there?',array['that over there','this'],'that over there','that over there'),
('identify-v1-this-key',1,'What is this?',array['this','that over there'],'this','this'),
('identify-v1-that-key',1,'What is that?',array['that','this'],'that','that'),
('identify-v1-over-there-key',1,'What is that over there?',array['that over there','that'],'that over there','that over there'),
('identify-v1-this-bottle',1,'What is this?',array['this','that'],'this','this'),
('identify-v1-that-bottle',1,'What is that?',array['that','that over there'],'that','that'),
('identify-v1-over-there-bottle',1,'What is that over there?',array['that over there','this'],'that over there','that over there'),
('identify-v1-this-plate',1,'What is this?',array['this','that over there'],'this','this'),
('identify-v1-that-plate',1,'What is that?',array['that','this'],'that','that'),
('identify-v1-over-there-plate',1,'What is that over there?',array['that over there','that'],'that over there','that over there'),
('identify-v1-this-book',1,'What is this?',array['this','that'],'this','this'),
('identify-v1-that-book',1,'What is that?',array['that','that over there'],'that','that'),
('identify-v1-over-there-book',1,'What is that over there?',array['that over there','this'],'that over there','that over there'),
('identify-v1-this-shoe',1,'What is this?',array['this','that over there'],'this','this'),
('identify-v1-that-shoe',1,'What is that?',array['that','this'],'that','that'),
('identify-v1-over-there-shoe',1,'What is that over there?',array['that over there','that'],'that over there','that over there'),
('identify-v1-this-hat',1,'What is this?',array['this','that'],'this','this'),
('identify-v1-that-hat',1,'What is that?',array['that','that over there'],'that','that'),
('identify-v1-over-there-hat',1,'What is that over there?',array['that over there','this'],'that over there','that over there'),
('identify-v1-this-apple',1,'What is this?',array['this','that over there'],'this','this'),
('identify-v1-that-apple',1,'What is that?',array['that','this'],'that','that'),
('identify-v1-over-there-apple',1,'What is that over there?',array['that over there','that'],'that over there','that over there'),
('identify-v1-these-phone',1,'What are these?',array['these','those'],'these','these'),
('identify-v1-those-phone',1,'What are those?',array['those','these'],'those','those'),
('identify-v1-these-bag',1,'What are these?',array['these','this'],'these','these'),
('identify-v1-those-bag',1,'What are those?',array['those','that'],'those','those'),
('identify-v1-these-cup',1,'What are these?',array['these','those'],'these','these'),
('identify-v1-those-cup',1,'What are those?',array['those','these'],'those','those'),
('identify-v1-these-key',1,'What are these?',array['these','this'],'these','these'),
('identify-v1-those-key',1,'What are those?',array['those','that'],'those','those'),
('identify-v1-these-bottle',1,'What are these?',array['these','those'],'these','these'),
('identify-v1-those-bottle',1,'What are those?',array['those','these'],'those','those'),
('identify-v1-these-plate',1,'What are these?',array['these','this'],'these','these'),
('identify-v1-those-plate',1,'What are those?',array['those','that'],'those','those'),
('identify-v1-these-book',1,'What are these?',array['these','those'],'these','these'),
('identify-v1-those-book',1,'What are those?',array['those','these'],'those','those'),
('identify-v1-these-shoe',1,'What are these?',array['these','this'],'these','these'),
('identify-v1-those-shoe',1,'What are those?',array['those','that'],'those','those'),
('identify-v1-these-hat',1,'What are these?',array['these','those'],'these','these'),
('identify-v1-those-hat',1,'What are those?',array['those','these'],'those','those'),
('identify-v1-these-apple',1,'What are these?',array['these','this'],'these','these'),
('identify-v1-those-apple',1,'What are those?',array['those','that'],'those','those')
on conflict(id,version) do nothing;
insert into public.english_classroom_question_catalogue(question_id) values ('identify-v1-this-phone'),('identify-v1-that-phone'),('identify-v1-over-there-phone'),('identify-v1-this-bag'),('identify-v1-that-bag'),('identify-v1-over-there-bag'),('identify-v1-this-cup'),('identify-v1-that-cup'),('identify-v1-over-there-cup'),('identify-v1-this-key'),('identify-v1-that-key'),('identify-v1-over-there-key'),('identify-v1-this-bottle'),('identify-v1-that-bottle'),('identify-v1-over-there-bottle'),('identify-v1-this-plate'),('identify-v1-that-plate'),('identify-v1-over-there-plate'),('identify-v1-this-book'),('identify-v1-that-book'),('identify-v1-over-there-book'),('identify-v1-this-shoe'),('identify-v1-that-shoe'),('identify-v1-over-there-shoe'),('identify-v1-this-hat'),('identify-v1-that-hat'),('identify-v1-over-there-hat'),('identify-v1-this-apple'),('identify-v1-that-apple'),('identify-v1-over-there-apple'),('identify-v1-these-phone'),('identify-v1-those-phone'),('identify-v1-these-bag'),('identify-v1-those-bag'),('identify-v1-these-cup'),('identify-v1-those-cup'),('identify-v1-these-key'),('identify-v1-those-key'),('identify-v1-these-bottle'),('identify-v1-those-bottle'),('identify-v1-these-plate'),('identify-v1-those-plate'),('identify-v1-these-book'),('identify-v1-those-book'),('identify-v1-these-shoe'),('identify-v1-those-shoe'),('identify-v1-these-hat'),('identify-v1-those-hat'),('identify-v1-these-apple'),('identify-v1-those-apple') on conflict do nothing;
CREATE OR REPLACE FUNCTION public.english_classroom(p_action text, p_session uuid DEFAULT NULL::uuid, p_payload jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare uid uuid:=auth.uid(); s public.english_class_sessions; tr public.english_class_turns; q public.english_word_questions;
 host boolean:=false; secret text:=p_payload->>'hostSecret'; target uuid; result jsonb; mode integer; choices text[];
begin
 if p_action='create' then
  if secret is null or length(secret)<64 then raise exception 'Host key required';end if;
  insert into public.english_class_sessions(host_id,host_secret_hash) values(null,md5(secret)) returning * into s;
  return jsonb_build_object('id',s.id);
 end if;
 select * into s from public.english_class_sessions where id=p_session and created_at>now()-interval '18 hours' for update;
 if not found then raise exception 'Class has ended. Scan the current code.';end if;
 host:=coalesce(secret is not null and s.host_secret_hash=md5(secret),false);
 if host then update public.english_class_sessions set host_last_seen=now() where id=s.id;end if;
 if uid is null and not host then raise exception 'Sign in with LINE first';end if;
 if p_action='join' then
  if uid is null then raise exception 'Sign in with LINE first';end if;
  if exists(select 1 from public.english_class_members where session_id=s.id and learner_id=uid and not active) then raise exception 'Ask your teacher to add you back';end if;
  insert into public.english_class_members(session_id,learner_id) values(s.id,uid) on conflict(session_id,learner_id) do update set last_seen=now();
 end if;
 if not host and not exists(select 1 from public.english_class_members where session_id=s.id and learner_id=uid and active) then raise exception 'Join this class first';end if;
 if p_action in ('remove','restore','next') and not host then raise exception 'Teacher account required';end if;
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
  select candidate.* into q from public.english_word_questions candidate join public.english_classroom_question_catalogue taught on taught.question_id = candidate.id
  cross join lateral (
   select coalesce(avg(least(25,coalesce(w.correct,0))),0) familiarity,
    coalesce(avg(case when w.attempts>0 then 1.0-w.correct::numeric/w.attempts else 0 end),0) difficulty
   from (select distinct lower(m[1]) token from regexp_matches(candidate.sentence,'([A-Za-z]+)','g') m) words
   left join public.english_word_progress w on w.learner_id=target and w.word_id='en:'||words.token
  ) knowledge
  where candidate.id like (case when p_payload->>'lesson'='lesson-6' then 'identify-v1-%' when p_payload->>'lesson'='lesson-5' then 'l5-%-answer' else 'action-%' end) and candidate.version=1
    and exists(select 1 from public.english_classroom_question_catalogue catalogue where catalogue.question_id=candidate.id)
    and not exists(select 1 from public.english_class_turns old where old.session_id=s.id and old.learner_id=target and old.question_id=candidate.id)
  order by case mode when 0 then knowledge.familiarity when 1 then knowledge.difficulty*25 else -knowledge.familiarity end+random()*8 desc limit 1;
  if q.id is null then raise exception 'All available questions practised. Open a new class.';end if;
  choices:=q.choices;if random()<0.5 then choices:=array[q.choices[2],q.choices[1]];end if;
  insert into public.english_class_turns(session_id,learner_id,question_id,version,choices) values(s.id,target,q.id,q.version,choices) returning * into tr;
  update public.english_class_members set turns=turns+1 where session_id=s.id and learner_id=target;
  update public.english_class_sessions set current_turn=tr.id where id=s.id returning * into s;
 elsif p_action='answer' then
  if uid is null then raise exception 'Student account required';end if;
  select * into tr from public.english_class_turns where id=s.current_turn for update;
  if tr.id is distinct from (p_payload->>'turn')::uuid or tr.learner_id<>uid then raise exception 'This is not your current question';end if;
  if tr.id is not null and tr.word_scores is null then
   select coalesce(jsonb_object_agg('en:'||words.token,coalesce(w.correct,0)),'{}'::jsonb) into tr.word_scores
   from (select distinct lower(m[1]) token from public.english_word_questions source,
    lateral regexp_matches(source.sentence,'([A-Za-z]+)','g') m
    where source.id=tr.question_id and source.version=tr.version) words
   left join public.english_word_progress w on w.learner_id=tr.learner_id and w.word_id='en:'||words.token;
   update public.english_class_turns set word_scores=tr.word_scores where id=tr.id;
  end if;
  if tr.answer is null then
   if not ((p_payload->>'answer')=any(tr.choices)) then raise exception 'Choose one of the answers';end if;
   select * into q from public.english_word_questions where id=tr.question_id and version=tr.version;
   perform public.record_english_word_answer(tr.id,q.id,q.version,p_payload->>'answer',now(),(select case when bool_and(value::integer>=25) then 'audio' when bool_or(value::integer>5) then 'faded' else 'visible' end from jsonb_each_text(tr.word_scores)),0,1,uid);
   update public.english_class_turns set answer=p_payload->>'answer',correct=(p_payload->>'answer'=q.answer) where id=tr.id;
  end if;
 elsif p_action not in ('join','state','remove','restore','next') then raise exception 'Unknown classroom action';
 end if;
 update public.english_class_members set last_seen=now() where session_id=s.id and learner_id=uid;
 select * into tr from public.english_class_turns where id=s.current_turn;
  if tr.id is not null and tr.word_scores is null then
   select coalesce(jsonb_object_agg('en:'||words.token,coalesce(w.correct,0)),'{}'::jsonb) into tr.word_scores
   from (select distinct lower(m[1]) token from public.english_word_questions source,
    lateral regexp_matches(source.sentence,'([A-Za-z]+)','g') m
    where source.id=tr.question_id and source.version=tr.version) words
   left join public.english_word_progress w on w.learner_id=tr.learner_id and w.word_id='en:'||words.token;
   update public.english_class_turns set word_scores=tr.word_scores where id=tr.id;
  end if;
 select jsonb_build_object('id',s.id,'host',host,'me',uid,'members',coalesce((
  select jsonb_agg(jsonb_build_object('id',m.learner_id,'name',coalesce(nullif(p.display_name,''),'Student'),'avatar',p.avatar_url,'active',m.active,'turns',m.turns,'lastSeen',m.last_seen,
   'coins',(select count(*)*10 from public.english_class_turns a where a.session_id=s.id and a.learner_id=m.learner_id and a.correct)) order by m.joined_at)
  from public.english_class_members m join public.profiles p on p.id=m.learner_id where m.session_id=s.id and (host or m.active)
 ),'[]'::jsonb),'turn',case when tr.id is null then null else jsonb_build_object('id',tr.id,'learner',tr.learner_id,'questionId',tr.question_id,
 'english',(select sentence from public.english_word_questions where id=tr.question_id and version=tr.version),
 'choices',tr.choices,'answer',tr.answer,'correct',tr.correct,
 'scores',case when host or uid=tr.learner_id then tr.word_scores else '{}'::jsonb end) end) into result;
 return result;
end;$function$;

commit;
