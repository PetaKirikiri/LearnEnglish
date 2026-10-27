begin;
do $$
declare learner uuid; q public.english_word_questions; attempt uuid:=gen_random_uuid(); board jsonb; score bigint;
begin
 select id into learner from public.profiles where id<>'7bdc33ac-7f21-4ebf-bfbf-343080724890'::uuid limit 1;
 if learner is null then raise exception 'No test account available'; end if;
 perform set_config('request.jwt.claim.sub',learner::text,true);
 begin
  perform public.english_success_leaderboard();
  raise exception 'Nonmember should be rejected';
 exception when insufficient_privilege then null; end;
 perform public.join_english_success();
 select * into q from public.english_word_questions where id like 'l2-%' limit 1;
 perform public.record_english_word_answer(attempt,q.id,q.version,q.answer,now(),'visible',0,1,learner);
 perform public.record_english_word_answer(attempt,q.id,q.version,q.answer,now(),'visible',0,1,learner);
 perform public.record_english_word_answer(gen_random_uuid(),q.id,q.version,case when q.choices[1]=q.answer then q.choices[2] else q.choices[1] end,now(),'visible',0,1,learner);
 board:=public.english_success_leaderboard();
 select (r->>'points')::bigint into score from jsonb_array_elements(board) r where r->>'id'=learner::text;
 if score<>10 then raise exception 'Expected ten points after correct, duplicate retry, and wrong answer; got %',score; end if;
 if exists(select 1 from jsonb_array_elements(board) r where r->>'id'='7bdc33ac-7f21-4ebf-bfbf-343080724890') then raise exception 'Teacher included'; end if;
end $$;
rollback;
select 'Leaderboard checks passed; test answers rolled back' as result;
