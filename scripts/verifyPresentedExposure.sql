-- Isolated database only; this transaction leaves no learner or answer fixtures.
begin;
select set_config('request.jwt.claim.sub',gen_random_uuid()::text,true);
insert into auth.users(id) values(auth.uid());
insert into public.profiles(id,display_name) values(auth.uid(),'Presented exposure fixture');
insert into public.english_word_questions(id,version,sentence,choices,answer,credit_sentence,evidence) values
 ('presentation-fixture',1,'She is drinking the water.',array['correct','wrong'],'correct','drinking','sentence');
do $$declare uid uuid:=auth.uid();aid uuid:=gen_random_uuid();v jsonb;a jsonb;r jsonb;i integer;w public.english_word_progress;begin
 v:=jsonb_build_object('p_event','presented','p_id',aid,'p_question','presentation-fixture','p_version',1,'p_occurred',now()-interval '1 minute','p_answer','');
 r:=public.submit_english_attempt('word',v);
 if r->>'status'<>'scored' then raise exception 'Presentation not saved: %',r;end if;
 perform public.submit_english_attempt('word',v);
 select * into w from public.english_word_progress where learner_id=uid and word_id='en:water';
 if w.exposure_count<>1 or w.attempts<>0 or w.correct<>0 or w.fade_score<>1 then raise exception 'Unanswered exposure failed: %',row_to_json(w);end if;
 a:=v-'p_event'||jsonb_build_object('p_answer','correct','p_occurred',now()-interval '59 seconds','p_modality','audio','p_replays',0,'p_rule',1);
 r:=public.submit_english_attempt('word',a);perform public.submit_english_attempt('word',a);
 if r->>'status'<>'scored' then raise exception 'Answer not scored';end if;
 if (select fade_score from public.english_word_progress where learner_id=uid and word_id='en:drinking')<>3 then raise exception 'Answer did not add exactly two bonus points';end if;
 select * into w from public.english_word_progress where learner_id=uid and word_id='en:water';
 if w.fade_score<>1 or w.exposure_count<>1 or w.attempts<>1 or w.correct<>1 then raise exception 'Answer duplicated context exposure';end if;
 -- An abandoned second question stays exposed without an invented answer.
 v:=v||jsonb_build_object('p_id',gen_random_uuid(),'p_occurred',now()-interval '58 seconds');perform public.submit_english_attempt('word',v);
 if (select count(*) from public.english_word_attempts where learner_id=uid)<>1 then raise exception 'An exposure invented an answer';end if;
 -- A late presentation converts the answer's implicit exposure, never adds a second one.
 aid:=gen_random_uuid();a:=a||jsonb_build_object('p_id',aid,'p_occurred',now()-interval '56 seconds');perform public.submit_english_attempt('word',a);
 v:=v||jsonb_build_object('p_id',aid,'p_occurred',now()-interval '57 seconds');perform public.submit_english_attempt('word',v);
 select * into w from public.english_word_progress where learner_id=uid and word_id='en:water';
 if w.fade_score<>3 or w.exposure_count<>3 or w.correct<>2 then raise exception 'Late exposure double-counted: %',row_to_json(w);end if;
 if (select fade_score from public.english_word_progress where learner_id=uid and word_id='en:drinking')<>7 then raise exception 'Late exposure changed target score';end if;
 -- Wrong answers affect only the contrasted word; the other words keep their exposure.
 aid:=gen_random_uuid();v:=v||jsonb_build_object('p_id',aid,'p_occurred',now()-interval '55 seconds');perform public.submit_english_attempt('word',v);
 a:=a||jsonb_build_object('p_id',aid,'p_answer','wrong','p_occurred',now()-interval '54 seconds');perform public.submit_english_attempt('word',a);
 if (select fade_score from public.english_word_progress where learner_id=uid and word_id='en:water')<>4 then raise exception 'Wrong answer penalised context';end if;
 if (select fade_score from public.english_word_progress where learner_id=uid and word_id='en:drinking')<>6 then raise exception 'Wrong target was not adjusted';end if;
 for i in 5..25 loop
  v:=v||jsonb_build_object('p_id',gen_random_uuid(),'p_occurred',now()-interval '50 seconds'+i*interval '1 second');
  r:=public.submit_english_attempt('word',v);if r->>'status'<>'scored' then raise exception 'Exposure failed';end if;
 end loop;
 select * into w from public.english_word_progress where learner_id=uid and word_id='en:water';
 if w.exposure_count<>25 or w.fade_score<>25 or w.proven_at is null or w.attempts<>3 or w.correct<>2 then raise exception 'Exposure-only learning failed: %',row_to_json(w);end if;
 raise notice 'PASS: unanswered exposures, answer bonus, refresh/retry deduplication, late delivery, isolated errors, full-fade learning';
end $$;
rollback;
