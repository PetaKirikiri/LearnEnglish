begin;
alter table public.english_class_turns add column if not exists generated_question jsonb;
-- Preserve membership, presence, answer recording and historical turns.
alter function public.english_classroom(text,uuid,jsonb) rename to english_classroom_before_word_server;
revoke all on function public.english_classroom_before_word_server(text,uuid,jsonb) from public,anon,authenticated;
create function public.english_classroom(p_action text,p_session uuid default null,p_payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare s public.english_class_sessions; tr public.english_class_turns; result jsonb; q public.english_word_questions; target uuid; hidden boolean; modality text; replays integer;
begin
 if p_action='next' then raise exception 'Use the shared classroom word service'; end if;
 if p_action='adaptive-next' then
  -- Only the server selects and registers canonical questions. A teacher key alone cannot submit arbitrary content.
  if current_setting('request.jwt.claim.role',true) is distinct from 'service_role' and coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb->>'role' is distinct from 'service_role' then raise exception 'Word service required';end if;
  select * into s from public.english_class_sessions where id=p_session and created_at>now()-interval '18 hours' for update;
  if s.id is null or s.host_secret_hash is distinct from md5(p_payload->>'hostSecret') then raise exception 'Teacher key required';end if;
  if coalesce(p_payload->>'previous','')<>coalesce(s.current_turn::text,'') then raise exception 'The turn changed. Refresh and try again.';end if;
  target:=(p_payload->>'learner')::uuid;
  if not exists(select 1 from public.english_class_members where session_id=s.id and learner_id=target and active and public.english_class_member_online(last_seen)) then raise exception 'Student is offline';end if;
  select * into q from public.english_word_questions where id=p_payload->'question'->>'id' and version=(p_payload->'question'->>'version')::integer;
  if q.id is null then raise exception 'Question is not registered';end if;
  insert into public.english_class_turns(session_id,learner_id,question_id,version,choices,word_scores,generated_question)
   values(s.id,target,q.id,q.version,array(select jsonb_array_elements_text(p_payload->'question'->'choices')),p_payload->'scores',p_payload->'question') returning * into tr;
  update public.english_class_members set turns=turns+1 where session_id=s.id and learner_id=target;
  update public.english_class_sessions set current_turn=tr.id where id=s.id;
  p_action:='state';
 end if;
 if p_action='answer' then
  -- Authorise membership before inspecting the active turn; preserve the existing idempotent attempt ID.
  result:=public.english_classroom_before_word_server('state',p_session,p_payload);
  select * into s from public.english_class_sessions where id=p_session for update;
  select * into tr from public.english_class_turns where id=s.current_turn for update;
  if tr.generated_question is not null then
   if tr.id is distinct from (p_payload->>'turn')::uuid or tr.learner_id is distinct from auth.uid() then raise exception 'This is not your current question';end if;
   if tr.answer is null then
    if not coalesce((p_payload->>'answer')=any(tr.choices),false) then raise exception 'Choose one of the answers';end if;
    select * into q from public.english_word_questions where id=tr.question_id and version=tr.version;
    select count(*)>0 and bool_and(coalesce((tr.word_scores->>('en:'||lower(m[1])))::numeric,0)>=25) into hidden
     from jsonb_array_elements_text(tr.generated_question->'listeningWords') w,
      lateral regexp_matches(w,'([A-Za-z]+(?:''[A-Za-z]+)*)','g') m;
    replays:=greatest(0,coalesce((p_payload->'evidence'->>'plays')::integer,0)-1);
    modality:=case when hidden and coalesce((p_payload->'evidence'->>'heard')::boolean,false) and not coalesce((p_payload->'evidence'->>'assisted')::boolean,true) and (p_payload->'evidence'->>'plays')::integer=1 then 'audio' else 'visible' end;
    perform public.record_english_word_answer(tr.id,q.id,q.version,p_payload->>'answer',now(),modality,replays,1,auth.uid());
    update public.english_class_turns set answer=p_payload->>'answer',correct=(p_payload->>'answer'=q.answer) where id=tr.id;
   end if;
   p_action:='state';
  end if;
 end if;
 result:=public.english_classroom_before_word_server(p_action,p_session,p_payload);
 if result->'turn' is not null and result->'turn'<>'null'::jsonb then
  select * into tr from public.english_class_turns where id=(result->'turn'->>'id')::uuid;
  if tr.generated_question is not null and ((result->>'host')::boolean or auth.uid()=tr.learner_id) then
   result:=jsonb_set(result,'{turn,question}',tr.generated_question);
  end if;
 end if;
 return result;
end;$$;
grant execute on function public.english_classroom(text,uuid,jsonb) to anon,authenticated,service_role;
commit;
