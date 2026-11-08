-- All fixtures, scoring and repairs are rolled back.
begin;
insert into auth.users(id) values('00000000-0000-4000-8000-000000000871');
insert into public.profiles(id,display_name)
 values('00000000-0000-4000-8000-000000000871','Inbox rollback verification') on conflict(id) do nothing;
insert into public.english_success_members(learner_id) values('00000000-0000-4000-8000-000000000871');
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000871","role":"authenticated"}',true);
set local role authenticated;
do $$
declare p jsonb; a jsonb; b jsonb;
begin
 p:=jsonb_build_object('p_id','00000000-0000-4000-8000-000000000872',
 'p_question','inbox-rollback-question','p_version',1,'p_answer','yes',
 'p_occurred',now()-interval '1 day','p_modality','audio','p_replays',1,'p_rule',1,
 'p_learner','00000000-0000-4000-8000-000000000999');
 a:=public.submit_english_attempt('word',p);
 b:=public.submit_english_attempt('word',p);
 if a->>'status'<>'needs_review' or a->>'accepted'<>'true' or a->>'receipt_id'<>b->>'receipt_id' then
  raise exception 'Missing catalogue answer was lost or duplicated: % / %',a,b; end if;
 if (select count(*) from public.english_attempt_inbox)<>1 then raise exception 'Receipt deduplication failed'; end if;
 if (select count(*) from public.english_word_attempts where learner_id=auth.uid())<>0 then
  raise exception 'Unresolved receipt earned credit'; end if;
 -- Invalid typed fields also survive intake; valid answers behind them still score.
 p:=jsonb_build_object('p_id','00000000-0000-4000-8000-000000000873','p_word','hotel',
 'p_module','broken','p_answer',0,'p_at',now(),'p_assisted',false,'p_heard',true,'p_replays',1,'p_support',3);
 a:=public.submit_english_attempt('number',p);
 if a->>'status'<>'needs_review' then raise exception 'Malformed metadata was not retained'; end if;
 p:=p||jsonb_build_object('p_id','00000000-0000-4000-8000-000000000874','p_module',1);
 a:=public.submit_english_attempt('number',p);
 b:=public.submit_english_attempt('number',p);
 if a->>'status'<>'scored' or a->>'receipt_id'<>b->>'receipt_id' then raise exception 'Valid sibling did not score'; end if;
 if (public.english_practice_gold(array[]::text[])->>'earned')::int<>10 then raise exception 'Incorrect immediate coins'; end if;
 -- The payload cannot impersonate a different learner, and intake restores auth.
 if auth.uid()<>'00000000-0000-4000-8000-000000000871'::uuid then raise exception 'Worker leaked auth context'; end if;
 if exists(select 1 from public.english_attempt_inbox where learner_id<>auth.uid()) then raise exception 'Payload identity accepted'; end if;
 if has_function_privilege('authenticated','public.retry_english_attempts(integer)','EXECUTE')
  or has_function_privilege('authenticated','public.repair_english_attempt(uuid,jsonb,text)','EXECUTE')
  or has_function_privilege('authenticated','public.process_english_attempt(uuid)','EXECUTE')
  or has_function_privilege('anon','public.submit_english_attempt(text,jsonb)','EXECUTE') then
  raise exception 'Private inbox operations exposed'; end if;
 perform set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000879","role":"authenticated"}',true);
 if exists(select 1 from public.english_attempt_inbox) then raise exception 'Cross-account receipts exposed'; end if;
end;$$;
reset role;
-- Repair the missing catalogue, then run exactly the same worker used by cron.
insert into public.english_word_questions(id,version,sentence,choices,answer,credit_sentence)
 values('inbox-rollback-question',1,'I am reading.',array['yes','no'],'yes','I am reading.');
update public.english_attempt_inbox set next_retry_at=now() where learner_id='00000000-0000-4000-8000-000000000871';
select public.retry_english_attempts(100);
do $$
declare r public.english_attempt_inbox; n int;
begin
 select * into r from public.english_attempt_inbox where client_id='00000000-0000-4000-8000-000000000873';
 perform public.repair_english_attempt(r.id,r.payload||'{"p_module":1}'::jsonb,'Repair malformed module');
 if not exists(select 1 from public.english_attempt_inbox where id=r.id and status='scored'
  and payload->>'p_module'='broken' and resolution_payload->>'p_module'='1') then
  raise exception 'Repair lost the original or failed'; end if;
 if not exists(select 1 from public.english_attempt_repairs where receipt_id=r.id and reason='Repair malformed module') then
  raise exception 'Repair audit missing'; end if;
 perform public.process_english_attempt(r.id);
 select count(*) into n from public.english_attempt_inbox where learner_id=r.learner_id and status='scored';
 if n<>3 then raise exception 'Pending answers did not recover: %',n; end if;
 if not exists(select 1 from public.english_word_progress where learner_id=r.learner_id and word_id='en:reading' and correct=1 and attempts=1) then
  raise exception 'Recovered word credit incorrect'; end if;
 if not exists(select 1 from public.english_word_progress where learner_id=r.learner_id and word_id='en:hotel' and correct=2 and attempts=2) then
  raise exception 'Number repair or retry double-counted'; end if;
 if not exists(select 1 from public.english_word_attempts where learner_id=r.learner_id and occurred_at=now()-interval '1 day') then
  raise exception 'Recovery changed original answer date'; end if;
 if not exists(select 1 from cron.job where jobname='english-attempt-inbox-retry' and active and schedule='* * * * *') then
  raise exception 'Automatic recovery worker not scheduled'; end if;
end;$$;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000871","role":"authenticated"}',true);
set local role authenticated;
do $$
declare g jsonb; b jsonb; p int;
begin
 g:=public.english_practice_gold(array['00000000-0000-4000-8000-000000000872','00000000-0000-4000-8000-000000000873','00000000-0000-4000-8000-000000000874']);
 if (g->>'earned')::int<>30 or jsonb_array_length(g->'settled')<>3 then raise exception 'Recovered coin settlement wrong: %',g; end if;
 b:=public.english_success_leaderboard('today');
 select (r->>'points')::int into p from jsonb_array_elements(b->'rows') r where r->>'id'=auth.uid()::text;
 if p is distinct from 20 then raise exception 'Recovery credited the wrong day: %',p; end if;
end;$$;
reset role;
rollback;
