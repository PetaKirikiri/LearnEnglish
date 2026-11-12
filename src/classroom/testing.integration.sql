begin;
do $$
declare sid uuid; uid uuid; other_uid uuid; g jsonb; phone jsonb; t jsonb; answer text; secret text:=repeat('b',64);
begin
 select id into uid from public.profiles order by id limit 1;
 select id into other_uid from public.profiles where id<>uid order by id limit 1;
 g:=public.english_classroom('create',null,jsonb_build_object('hostSecret',secret));sid:=(g->>'id')::uuid;
 insert into public.english_class_members(session_id,learner_id) values(sid,uid);
 perform public.english_class_activity(sid,jsonb_build_object('hostSecret',secret,'activity','test','lesson',6));
 g:=public.english_classroom('next',sid,jsonb_build_object('hostSecret',secret,'previous','','lesson','lesson-6'));t:=g->'turn';
 if t->>'questionId' not like 'identify-v1-%' then raise exception 'Lesson 6 selected the wrong question bank';end if;
 perform set_config('request.jwt.claim.sub',uid::text,true);
 phone:=public.english_classroom('state',sid);
 if phone->'turn'<>t then raise exception 'Host and phone turns differ';end if;
 select q.answer into answer from public.english_word_questions q where q.id=t->>'questionId' and q.version=1;
 g:=public.english_classroom('answer',sid,jsonb_build_object('turn',t->>'id','answer',answer));
 if not (g->'turn'->>'correct')::boolean then raise exception 'Answer not credited';end if;
 g:=public.english_classroom('state',sid,jsonb_build_object('hostSecret',secret));
 if g->'turn'->>'answer'<>answer then raise exception 'Computer did not receive answer';end if;
 g:=public.english_classroom('next',sid,jsonb_build_object('hostSecret',secret,'previous',t->>'id','lesson','lesson-6'));
 if g->'turn'->>'id'=t->>'id' or g->'turn'->>'questionId' not like 'identify-v1-%' then raise exception 'Next question failed';end if;
end $$;
rollback;
select 'PASS: Lesson 6 teacher-controlled turn, identical computer/phone question and choices, student answer, host result and next question' result;
