begin;
create temporary table confidence_test_accounts as select id from public.profiles order by id limit 2;
grant select on confidence_test_accounts to authenticated;
select set_config('request.jwt.claims',json_build_object('sub',(select id from confidence_test_accounts order by id limit 1),'role','authenticated')::text,true);
set local role authenticated;
insert into public.fifa_english_word_confidence(learner_id,word,confidence) values (auth.uid(),'codexconfidencecheck',3) on conflict (learner_id,word) do update set confidence=3;
do $$ begin
 if (select confidence from public.fifa_english_word_confidence where learner_id=auth.uid() and word='codexconfidencecheck')<>3 then raise exception 'Own rating read failed';end if;
 begin
  insert into public.fifa_english_word_confidence(learner_id,word,confidence) select id,'codexconfidencecheck',4 from confidence_test_accounts where id<>auth.uid();
  raise exception 'Cross-user insert unexpectedly allowed';
 exception when insufficient_privilege then null;end;
 begin
  update public.fifa_english_word_confidence set confidence=6 where learner_id=auth.uid() and word='codexconfidencecheck';
  raise exception 'Invalid score unexpectedly allowed';
 exception when check_violation then null;end;
end $$;
update public.fifa_english_word_confidence set confidence=5 where learner_id=auth.uid() and word='codexconfidencecheck';
select set_config('request.jwt.claims',json_build_object('sub',(select id from confidence_test_accounts order by id desc limit 1),'role','authenticated')::text,true);
do $$ begin
 if exists(select 1 from public.fifa_english_word_confidence where word='codexconfidencecheck') then raise exception 'Cross-user read exposed a rating';end if;
 update public.fifa_english_word_confidence set confidence=1 where word='codexconfidencecheck';
 if found then raise exception 'Cross-user update allowed';end if;
end $$;
reset role;
select 'Own read/write, cross-user isolation, and 1–5 constraint passed' as verification;
rollback;
