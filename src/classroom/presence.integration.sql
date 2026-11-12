begin;
do $$
declare sid uuid; online_id uuid; offline_id uuid; j jsonb; before_seen timestamptz; secret text:=repeat('p',64);
begin
 select id into online_id from public.profiles order by id limit 1;
 select id into offline_id from public.profiles order by id offset 1 limit 1;
 if offline_id is null then raise exception 'Test requires two learner fixtures';end if;
 j:=public.english_classroom('create',null,jsonb_build_object('hostSecret',secret));sid:=(j->>'id')::uuid;
 perform set_config('request.jwt.claim.sub',online_id::text,true);
 perform public.english_classroom('join',sid);
 perform set_config('request.jwt.claim.sub',offline_id::text,true);
 perform public.english_classroom('join',sid);
 insert into public.english_class_turns(session_id,learner_id,question_id,version,choices,answer,correct)
 select sid,offline_id,id,version,choices,answer,true from public.english_word_questions where id='action-presence-test' and version=1;
 update public.english_class_members set last_seen=now()-interval '21 seconds',turns=3 where session_id=sid and learner_id=offline_id;
 select last_seen into before_seen from public.english_class_members where session_id=sid and learner_id=offline_id;
 -- A signed-in teacher looking at the same account must not renew the phone's presence.
 j:=public.english_classroom('state',sid,jsonb_build_object('hostSecret',secret));
 if (select last_seen from public.english_class_members where session_id=sid and learner_id=offline_id)<>before_seen then raise exception 'Teacher polling renewed offline student';end if;
 if j->>'serverNow' is null or jsonb_array_length(j->'members')<>2 then raise exception 'Missing clock or roster';end if;
 if public.english_class_member_online(before_seen) or public.english_class_member_online(now()-interval '20 seconds') or not public.english_class_member_online(now()-interval '19 seconds') then raise exception 'Presence expiry incorrect';end if;
 j:=public.english_classroom('next',sid,jsonb_build_object('hostSecret',secret,'previous','','lesson','lesson-3'));
 if j->'turn'->>'learner'<>online_id::text then raise exception 'Offline student selected';end if;
 -- New drawing rounds use the same online roster, and historical scores remain.
 perform public.english_drawing_game('start',sid,jsonb_build_object('hostSecret',secret,'round',0,'seconds',60));
 if (select count(*) from public.english_drawings where session_id=sid)<>1 or exists(select 1 from public.english_drawings where session_id=sid and artist=offline_id) then raise exception 'Offline student entered new drawing round';end if;
 -- Recovering phones keep membership, progress and turn counts.
 j:=public.english_classroom('state',sid);
 if (select (m->>'coins')::integer from jsonb_array_elements(j->'members') m where m->>'id'=offline_id::text)<>10 then raise exception 'Reconnect lost earned points';end if;
 if not (select active and turns=3 and public.english_class_member_online(last_seen) from public.english_class_members where session_id=sid and learner_id=offline_id) then raise exception 'Reconnect lost membership or progress';end if;
 -- The teacher removing someone is different from going offline.
 perform public.english_classroom('remove',sid,jsonb_build_object('hostSecret',secret,'learner',offline_id));
 begin perform public.english_classroom('join',sid);raise exception 'Removed learner rejoined';
 exception when others then if sqlerrm<>'Ask your teacher to add you back' then raise;end if;end;
 update public.english_class_members set last_seen=now()-interval '21 seconds' where session_id=sid;
 begin perform public.english_classroom('next',sid,jsonb_build_object('hostSecret',secret,'previous',j->'turn'->>'id'));raise exception 'Selected a student when everyone was offline';
 exception when others then if sqlerrm<>'Wait for a student to come online' then raise;end if;end;
 update public.english_drawing_games set phase='results' where session_id=sid;
 begin perform public.english_drawing_game('start',sid,jsonb_build_object('hostSecret',secret,'round',1));raise exception 'Started an empty drawing round';
 exception when others then if sqlerrm<>'At least one student must be online' then raise;end if;end;
end $$;
rollback;
select 'PASS: expiry, host polling, online-only turns/rounds, reconnect, removal and empty roster' result;
