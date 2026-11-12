-- Run against an isolated database with classroom migrations installed.
begin;
do $$
declare learner uuid:=gen_random_uuid(); other_learner uuid:=gen_random_uuid(); room uuid; turn_id uuid; result jsonb; rejected boolean; question jsonb; key text:=repeat('a',64);
begin
 insert into auth.users(id) values(learner),(other_learner);
 insert into public.profiles(id,display_name) values(learner,'Word server test'),(other_learner,'Other student');
 insert into public.english_class_sessions(host_secret_hash) values(md5(key)) returning id into room;
 insert into public.english_class_members(session_id,learner_id) values(room,learner),(room,other_learner);
 insert into public.english_word_questions(id,version,sentence,choices,answer,credit_sentence) values('word-server-test',1,'the man',array['the man','the woman'],'the man','man');
 question:=jsonb_build_object('id','word-server-test','version',1,'choices',jsonb_build_array('the man','the woman'),'listeningWords',jsonb_build_array('man'));
 perform set_config('request.jwt.claims','{"role":"authenticated"}',true);
 rejected:=false;
 begin perform public.english_classroom('adaptive-next',room,jsonb_build_object('hostSecret',key,'previous','','learner',learner,'question',question,'scores','{"en:man":25}'::jsonb));exception when others then rejected:=true;end;
 if not rejected then raise exception 'Client bypassed server selection';end if;
 rejected:=false;
 begin perform public.english_classroom('next',room,jsonb_build_object('hostSecret',key));exception when others then rejected:=true;end;
 if not rejected then raise exception 'Legacy random selector is still active';end if;
 perform set_config('request.jwt.claims','{"role":"service_role"}',true);
 result:=public.english_classroom('adaptive-next',room,jsonb_build_object('hostSecret',key,'previous','','learner',learner,'question',question,'scores','{"en:man":25}'::jsonb));
 turn_id:=(result->'turn'->>'id')::uuid;
 if result->'turn'->'question' is distinct from question then raise exception 'Host did not receive canonical question';end if;
 rejected:=false;
 begin perform public.english_classroom('adaptive-next',room,jsonb_build_object('hostSecret',key,'previous','','learner',learner,'question',question));exception when others then rejected:=true;end;
 if not rejected then raise exception 'Duplicate GO created a second turn';end if;
 perform set_config('request.jwt.claims','{"role":"authenticated"}',true);
 perform set_config('test.uid',learner::text,true);
 -- This line is used only by the isolated fixture's auth.uid implementation.
 perform set_config('request.jwt.claim.sub',learner::text,true);
 result:=public.english_classroom('state',room,'{}');
 if result->'turn'->'question' is distinct from question then raise exception 'Phone did not receive host question';end if;
 result:=public.english_classroom('answer',room,jsonb_build_object('turn',turn_id,'answer','the man','evidence',jsonb_build_object('heard',true,'plays',1,'assisted',false)));
 if (result->'turn'->>'correct')::boolean is not true then raise exception 'Answer failed';end if;
 perform public.english_classroom('answer',room,jsonb_build_object('turn',turn_id,'answer','the man'));
 if (select count(*) from public.english_word_attempts where learner_id=learner and id=turn_id)<>1 then raise exception 'Duplicate answer awarded twice';end if;
 if not exists(select 1 from public.english_word_attempts where learner_id=learner and id=turn_id and modality='audio') then raise exception 'Hidden first-play proof was not recorded';end if;
 perform set_config('test.uid',other_learner::text,true);
 perform set_config('request.jwt.claim.sub',other_learner::text,true);
 result:=public.english_classroom('state',room,'{}');
 if result->'turn' ? 'question' then raise exception 'Another student received the private question';end if;
 raise notice 'PASS: server-only selection, legacy rejection, host/phone parity, duplicate GO, account answer recording, duplicate credit and privacy';
end $$;
rollback;
