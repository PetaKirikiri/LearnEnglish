begin;
create temporary table wp_test as select id,row_number()over(order by id) n from public.profiles where not coalesce(is_admin,false) order by id limit 2;
grant select on wp_test to authenticated;
do $$begin if (select count(*) from wp_test)<>2 then raise exception 'Need two learner accounts for isolation test';end if;end$$;
select set_config('request.jwt.claims',json_build_object('sub',(select id from wp_test where n=1),'role','authenticated')::text,true);
set local role authenticated;
create temporary table wp_before as select coalesce((select correct from public.english_word_progress where learner_id=auth.uid() and word_id='en:where'),0) n;
create temporary table wp_all_before as select w.word_id,coalesce(p.correct,0) correct from (values('en:are'),('en:my'),('en:shoes'),('en:keys')) w(word_id) left join public.english_word_progress p on p.word_id=w.word_id and p.learner_id=auth.uid();
select public.record_english_word_answer('10000000-0000-4000-8000-000000000001','l2-translation-shoes-my',1,(select answer from public.english_word_questions where id='l2-translation-shoes-my' and version=1),now(),'faded',2,1,auth.uid());
select public.record_english_word_answer('10000000-0000-4000-8000-000000000001','l2-translation-shoes-my',1,(select answer from public.english_word_questions where id='l2-translation-shoes-my' and version=1),now(),'faded',2,1,auth.uid());
select public.record_english_word_answer('10000000-0000-4000-8000-000000000002','l2-translation-keys-my',1,(select answer from public.english_word_questions where id='l2-translation-keys-my' and version=1),now(),'audio',0,1,auth.uid());
select public.record_english_word_answer('10000000-0000-4000-8000-000000000003','l2-shoes-my-is',1,'Wrong',now(),'audio',0,1,auth.uid());
do $$begin
 if (select correct from public.english_word_progress where learner_id=auth.uid() and word_id='en:where')<>(select n+2 from wp_before) then raise exception 'Credit or deduplication failed';end if;
 if (select count(*) from public.english_word_attempts where id in ('10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000003'))<>3 then raise exception 'Attempt deduplication failed';end if;
 if exists(select 1 from wp_all_before b left join public.english_word_progress p on p.word_id=b.word_id and p.learner_id=auth.uid() where coalesce(p.correct,0)<>b.correct+case when b.word_id in ('en:are','en:my') then 2 else 1 end) then raise exception 'Sentence words did not receive independent credit';end if;
 if has_table_privilege('authenticated','public.english_word_progress','INSERT') then raise exception 'Scores can be forged directly';end if;
 if has_function_privilege('anon','public.record_english_word_answer(uuid,text,integer,text,timestamptz,text,integer,integer,uuid)','execute') then raise exception 'Anonymous write allowed';end if;
end$$;
select set_config('request.jwt.claims',json_build_object('sub',(select id from wp_test where n=2),'role','authenticated')::text,true);
do $$begin
 if exists(select 1 from public.english_word_attempts where learner_id=(select id from wp_test where n=1)) then raise exception 'Cross-account attempts exposed';end if;
 if exists(select 1 from public.english_word_progress where learner_id=(select id from wp_test where n=1)) then raise exception 'Cross-account scores exposed';end if;
end$$;
reset role;
select 'PASS: word credit, retries, bad grammar, account isolation and permissions' as verification;
rollback;
