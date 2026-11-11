-- Run against a database with the classroom fade migration; all test changes roll back.
begin;
do $$
declare sid uuid; learner uuid; other uuid; j jsonb; phone jsonb; before_scores jsonb; tid uuid; secret text:=repeat('c',64); correct_answer text;
begin
 select id into learner from public.profiles order by id limit 1;
 select id into other from public.profiles where id<>learner order by id limit 1;
 insert into public.english_word_progress(learner_id,word_id,correct,attempts,last_practised)
 select learner,id,25,25,now() from public.english_word_forms
 on conflict(learner_id,word_id) do update set correct=25,attempts=greatest(25,english_word_progress.attempts);
 j:=public.english_classroom('create',null,jsonb_build_object('hostSecret',secret));sid:=(j->>'id')::uuid;
 insert into public.english_class_members(session_id,learner_id) values(sid,learner);
 j:=public.english_classroom('next',sid,jsonb_build_object('hostSecret',secret));
 before_scores:=j#>'{turn,scores}';tid:=(j#>>'{turn,id}')::uuid;
 if before_scores='{}' or exists(select 1 from jsonb_each_text(before_scores) where value::int<>25) then raise exception 'Missing learner scores';end if;
 if not exists(select 1 from public.english_classroom_question_catalogue where question_id=j#>>'{turn,questionId}') then raise exception 'Untaught question';end if;
 perform set_config('request.jwt.claim.sub',learner::text,true);
 phone:=public.english_classroom('state',sid);
 if phone#>'{turn,scores}'<>before_scores then raise exception 'Host and phone differ';end if;
 insert into public.english_class_members(session_id,learner_id) values(sid,other);
 perform set_config('request.jwt.claim.sub',other::text,true);
 phone:=public.english_classroom('state',sid);
 if phone#>'{turn,scores}'<>'{}' then raise exception 'Other student saw scores';end if;
 perform set_config('request.jwt.claim.sub',learner::text,true);
 select answer into correct_answer from public.english_word_questions where id=j#>>'{turn,questionId}' and version=1;
 phone:=public.english_classroom('answer',sid,jsonb_build_object('turn',tid,'answer',correct_answer));
 if (select modality from public.english_word_attempts where learner_id=learner and id=tid)<>'audio' then raise exception 'Wrong fade scoring modality';end if;
 if phone#>'{turn,scores}'<>before_scores then raise exception 'Scores changed mid-turn';end if;
end $$;
rollback;
