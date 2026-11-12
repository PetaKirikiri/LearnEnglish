-- Run against an isolated database after applying migrations. Real receipt/scorer path; all test records roll back.
begin;
select set_config('request.jwt.claim.sub',gen_random_uuid()::text,true);
insert into auth.users(id) values(auth.uid());
insert into public.profiles(id,display_name) values(auth.uid(),'Tracking fixture');
insert into public.english_word_questions(id,version,sentence,choices,answer,credit_sentence,evidence) values
('tracking-context',1,'She is drinking the water.',array['yes','no'],'yes','drinking','sentence'),
('tracking-water',1,'She is drinking the water.',array['yes','no'],'yes','water','sentence'),
('tracking-legacy',1,'legacyword',array['yes','no'],'yes','legacyword','sentence'),
('tracking-invalid',1,'She are drinking the water.',array['yes','no'],'no',null,'sentence');
do $$declare i integer; p jsonb; r jsonb; w public.english_word_progress; uid uuid:=auth.uid(); c integer; begin
 for i in 1..200 loop
  p:=jsonb_build_object('p_id',gen_random_uuid(),'p_question','tracking-context','p_version',1,'p_answer','yes','p_occurred',now()-interval '1 hour'+i*interval '1 second','p_modality','audio','p_replays',0,'p_rule',1);
  r:=public.submit_english_attempt('word',p);
  if r->>'status'<>'scored' then raise exception 'Receipt not scored: %, %',r,(select row_to_json(x) from (select error_code,error_message from public.english_attempt_inbox where id=(r->>'receipt_id')::uuid)x);end if;
  if public.submit_english_attempt('word',p)<>r then raise exception 'Receipt retry changed';end if;
  if i=7 then
   if (select fade_score from public.english_word_progress where learner_id=uid and word_id='en:drinking')<>21 or
      (select fade_score from public.english_word_progress where learner_id=uid and word_id='en:water')<>7 then raise exception '+3 focus / +1 context failed';end if;
  end if;
  if i=9 and (select proven_at from public.english_word_progress where learner_id=uid and word_id='en:drinking') is null then raise exception 'Full fade was not Learnt';end if;
  if i=25 and (select proven_at from public.english_word_progress where learner_id=uid and word_id='en:water') is null then raise exception 'Context full fade was not Learnt';end if;
 end loop;
 select * into w from public.english_word_progress where learner_id=uid and word_id='en:water';
 if w.correct<>200 or w.attempts<>200 or w.fade_score<>25 or w.confirmation_count<>0 or w.proven_at is null or w.review_due_at is null or w.listening_correct<>0 then raise exception 'Context accounting failed: %',row_to_json(w);end if;
 select count(*) into c from public.english_word_attempts where learner_id=uid;
 if c<>200 then raise exception 'Duplicate receipts created attempts: %',c;end if;
 for i in 1..4 loop
  p:=jsonb_build_object('p_id',gen_random_uuid(),'p_question','tracking-water','p_version',1,'p_answer','yes','p_occurred',now()-interval '10 minutes'+i*interval '1 second','p_modality','audio','p_replays',case when i=1 then 1 else 0 end,'p_rule',1);
  r:=public.submit_english_attempt('word',p);
  if r->>'status'<>'scored' then raise exception 'Target receipt not scored';end if;
 end loop;
 select * into w from public.english_word_progress where learner_id=uid and word_id='en:water';
 if w.confirmation_count<>0 or w.proven_at is null or w.review_due_at is null then raise exception 'Learnt/review state failed: %',row_to_json(w);end if;
 p:=jsonb_build_object('p_id',gen_random_uuid(),'p_question','tracking-context','p_version',1,'p_answer','no','p_occurred',now()-interval '5 minutes','p_modality','audio','p_replays',0,'p_rule',1);
 perform public.submit_english_attempt('word',p);
 if (select correct from public.english_word_progress where learner_id=uid and word_id='en:water')<>204 then raise exception 'Unrelated error changed water';end if;
 if (select attempts from public.english_word_progress where learner_id=uid and word_id='en:water')<>205 then raise exception 'Incorrect sentence exposure was not recorded';end if;
 perform public.rebuild_english_word_learning(uid,'en:water');
 if (select proven_at from public.english_word_progress where learner_id=uid and word_id='en:water') is distinct from w.proven_at then raise exception 'History replay lost mastery';end if;
 p:=jsonb_set(jsonb_set(p,'{p_id}',to_jsonb(gen_random_uuid())),'{p_question}','"tracking-water"');
 r:=public.submit_english_attempt('word',p);
 select * into w from public.english_word_progress where learner_id=uid and word_id='en:water';
 if w.proven_at is not null or w.fade_score<>5 or w.lapsed_at is null then raise exception 'Target failure did not trigger relearning: %',row_to_json(w);end if;
 insert into public.english_word_forms(id,form) values('en:legacyword','legacyword') on conflict do nothing;
 insert into public.english_word_progress(learner_id,word_id,correct,attempts,last_practised) values(uid,'en:legacyword',25,25,now());
 p:=jsonb_build_object('p_id',gen_random_uuid(),'p_question','tracking-legacy','p_version',1,'p_answer','no','p_occurred',now(),'p_modality','audio','p_replays',0,'p_rule',1);
 r:=public.submit_english_attempt('word',p);
 if r->>'status'<>'scored' or (select fade_score from public.english_word_progress where learner_id=uid and word_id='en:legacyword')<>5 then raise exception 'Legacy full-fade lapse differs from client';end if;
 raise notice 'PASS: 200 full-sentence encounters, retry deduplication, +3 contrasted/+1 context, Learnt exactly at full fade, persisted history, review schedule and isolated failure';
end $$;
rollback;
