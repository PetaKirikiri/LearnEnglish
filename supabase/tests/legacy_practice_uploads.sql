-- Run after the migration. All verification data is rolled back.
begin;
insert into auth.users(id) values('00000000-0000-4000-8000-000000000861');
insert into public.profiles(id,display_name)
 values('00000000-0000-4000-8000-000000000861','Rollback verification')
 on conflict(id) do update set display_name=excluded.display_name;
insert into public.english_success_members(learner_id) values('00000000-0000-4000-8000-000000000861');
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000861","role":"authenticated"}',true);
set local role authenticated;
do $$
declare
 uid uuid:='00000000-0000-4000-8000-000000000861';
 modern text:='00000000-0000-4000-8000-000000000862';
 today timestamptz:=now(); g jsonb; b jsonb; p bigint;
begin
 perform public.record_english_number_answer('0-hotel','hotel',1,0,today,false,true,1,3);
 perform public.record_english_number_answer('0-hotel','hotel',1,0,today,false,true,1,3);
 if (select count(*) from public.english_number_attempts where learner_id=uid)<>1 then
  raise exception 'Legacy retry was not idempotent'; end if;
 perform public.record_english_number_answer('0-hotel','hotel',1,0,today-interval '1 second',false,true,1,3);
 perform public.record_english_number_answer(modern,'hotel',1,0,today,false,true,1,3);
 perform public.record_english_number_answer(modern,'hotel',1,0,today,false,true,1,3);
 -- Incorrect answers settle too, without earning coins or correct-word credit.
 perform public.record_english_number_answer('1-hotel','hotel',1,1,today,false,true,1,3);
 -- Uploading yesterday's answer must not put it in today's leaderboard.
 perform public.record_english_number_answer('2-hotel','hotel',1,0,today-interval '1 day',false,true,1,3);
 g:=public.english_practice_gold(array['0-hotel',modern,'1-hotel','2-hotel','0-keys']);
 if (g->>'earned')::int<>40 or jsonb_array_length(g->'settled')<>4
  or not (g->'settled' ? '0-hotel') or g->'settled' ? '0-keys' then
  raise exception 'Incorrect coin settlement: %',g; end if;
 if not exists(select 1 from public.english_number_attempts where learner_id=uid and id=modern::uuid) then
  raise exception 'Modern UUID changed'; end if;
 if not exists(select 1 from public.english_word_progress where learner_id=uid and word_id='en:hotel' and attempts=5 and correct=4) then
  raise exception 'Word progress did not receive exactly one credit per answer'; end if;
 b:=public.english_success_leaderboard('today');
 select (r->>'points')::bigint into p from jsonb_array_elements(b->'rows') r where r->>'id'=uid::text;
 if p is distinct from 30::bigint then raise exception 'Daily leaderboard mismatch: %',b; end if;
 if has_function_privilege('authenticated','public.record_english_number_answer_uuid(uuid,text,integer,integer,timestamptz,boolean,boolean,integer,integer,text,text)','EXECUTE') then
  raise exception 'Internal RPC exposed'; end if;
 -- A different learner cannot settle these IDs or read their earnings.
 perform set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000863","role":"authenticated"}',true);
 g:=public.english_practice_gold(array['0-hotel',modern]);
 if (g->>'earned')::int<>0 or jsonb_array_length(g->'settled')<>0 then
  raise exception 'Cross-account data leak'; end if;
 perform set_config('request.jwt.claims','{}',true);
 begin
  perform public.record_english_number_answer('0-hotel','hotel',1,0,today,false,true,1,3);
  raise exception 'Unauthenticated write accepted';
 exception when others then
  if sqlerrm<>'Sign in required' then raise; end if;
 end;
end;$$;
reset role;
rollback;
