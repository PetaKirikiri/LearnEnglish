begin;
do $$
declare learner uuid; state public.english_word_progress; base timestamptz:=now()-interval '40 days'; i integer;
begin
 select id into learner from public.profiles where lower(display_name)='peta' and is_admin limit 1;
 if learner is null then raise exception 'Missing teacher fixture';end if;
 perform set_config('request.jwt.claim.sub',learner::text,true);
 insert into public.english_word_forms(id,form) values('en:lifecycleproof','lifecycleproof'),('en:lifecyclelegacy','lifecyclelegacy');
 insert into public.english_word_questions(id,version,sentence,choices,answer,credit_sentence)
 values('__lifecycle_proof',1,'lifecycleproof',array['yes','no'],'yes','lifecycleproof'),('__lifecycle_legacy',1,'lifecyclelegacy',array['yes','no'],'yes','lifecyclelegacy');
 for i in 1..25 loop
  perform public.score_english_word_answer(gen_random_uuid(),'__lifecycle_proof',1,'yes',base+make_interval(secs=>i),'audio',0,1,learner);
 end loop;
 select * into state from public.english_word_progress where learner_id=learner and word_id='en:lifecycleproof';
 if state.fade_score<>25 or state.confirmation_count<>0 or state.proven_at is not null then raise exception 'Premature proof before full fading';end if;
 perform public.score_english_word_answer(gen_random_uuid(),'__lifecycle_proof',1,'yes',base+interval '26 seconds','audio',1,1,learner);
 for i in 27..29 loop perform public.score_english_word_answer(gen_random_uuid(),'__lifecycle_proof',1,'yes',base+make_interval(secs=>i),'audio',0,1,learner);end loop;
 select * into state from public.english_word_progress where learner_id=learner and word_id='en:lifecycleproof';
 if state.confirmation_count<>3 or state.proven_at<>base+interval '29 seconds' or state.review_due_at<>base+interval '1 day 29 seconds' then raise exception 'Initial proof/review date failed';end if;
 perform public.score_english_word_answer(gen_random_uuid(),'__lifecycle_proof',1,'yes',base+interval '1 day 29 seconds','audio',0,1,learner);
 select * into state from public.english_word_progress where learner_id=learner and word_id='en:lifecycleproof';
 if state.review_step<>1 or state.review_due_at<>base+interval '4 days 29 seconds' then raise exception 'Spaced review failed';end if;
 perform public.score_english_word_answer(gen_random_uuid(),'__lifecycle_proof',1,'no',base+interval '4 days 29 seconds','audio',0,1,learner);
 select * into state from public.english_word_progress where learner_id=learner and word_id='en:lifecycleproof';
 if state.proven_at is not null or state.confirmation_count<>0 or state.fade_score<>5 or state.review_due_at is not null then raise exception 'Failed review did not restore support';end if;
 -- Unsequenced legacy totals can backfill fading, not pretend earlier audio was hidden.
 insert into public.english_word_progress(learner_id,word_id,correct,attempts,last_practised)
 values(learner,'en:lifecyclelegacy',25,25,base);
 for i in 1..3 loop perform public.score_english_word_answer(gen_random_uuid(),'__lifecycle_legacy',1,'yes',base+make_interval(secs=>i),'audio',0,1,learner);end loop;
 select * into state from public.english_word_progress where learner_id=learner and word_id='en:lifecyclelegacy';
 if state.fade_score<>25 or state.proven_at is not null or state.confirmation_count<>0 then raise exception 'Legacy totals invented proof';end if;
 for i in 1..3 loop perform public.score_english_word_answer(gen_random_uuid(),'__lifecycle_legacy',1,'yes',now()+make_interval(secs=>i),'audio',0,1,learner);end loop;
 select * into state from public.english_word_progress where learner_id=learner and word_id='en:lifecyclelegacy';
 if state.proven_at is null then raise exception 'Fresh independent confirmation did not complete legacy word';end if;
end $$;
rollback;
