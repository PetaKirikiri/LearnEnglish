-- Run inside a transaction and roll back; never retain test points.
do $$
declare uid uuid := '7bdc33ac-7f21-4ebf-bfbf-343080724890'; eid uuid := gen_random_uuid(); other uuid;
  q text := 'hotel-score-test-'||gen_random_uuid(); r jsonb; baseline bigint; board jsonb; period text;
begin
  select count(*) into baseline from public.fifa_english_weekly_points;
  perform set_config('request.jwt.claim.sub',uid::text,true);
  insert into public.englishsuccess_hotel_questions(id,answer) values(q,0);
  perform public.hotel_join();
  r := public.hotel_record_answer(eid,q,0,true);
  if (r->>'points')::int<>5 then raise exception 'Assisted award failed'; end if;
  perform public.hotel_record_answer(eid,q,0,true);
  if (select count(*) from public.englishsuccess_hotel_answers where event_id=eid)<>1 then raise exception 'Duplicate retry'; end if;
  r := public.hotel_record_answer(gen_random_uuid(),q,0,false);
  if (r->>'points')::int<>5 then raise exception 'Unassisted top-up failed'; end if;
  r := public.hotel_record_answer(gen_random_uuid(),q,0,false);
  if (r->>'points')::int<>0 then raise exception 'Daily cap failed'; end if;
  r := public.hotel_record_answer(gen_random_uuid(),q,1,false);
  if (r->>'correct')::boolean or (r->>'points')::int<>0 then raise exception 'Wrong answer credited'; end if;
  begin perform public.hotel_record_answer(gen_random_uuid(),'not-a-question',0,false); raise exception 'Unknown question accepted';
    exception when sqlstate '22023' then null; end;
  begin perform public.hotel_record_answer(eid,q,1,true); raise exception 'Changed retry accepted';
    exception when sqlstate '22023' then null; end;
  foreach period in array array['today','week','month','all'] loop
    board := public.hotel_scoreboard(period);
    if not exists(select 1 from jsonb_array_elements(board) x where x->>'id'=uid::text and (x->>'points')::int>=10 and (x->>'answers')::int>=4) then
      raise exception 'Missing score in %',period; end if;
  end loop;
  select id into other from public.profiles where id<>uid limit 1;
  if other is not null then
    insert into public.englishsuccess_hotel_members(learner_id) values(other) on conflict do nothing;
    if not exists(select 1 from jsonb_array_elements(public.hotel_scoreboard('all')) x where x->>'id'=other::text) then raise exception 'Missing zero-score member'; end if;
    perform set_config('request.jwt.claim.sub',other::text,true);
    begin perform public.hotel_scoreboard('all'); raise exception 'Nonadmin accessed scoreboard'; exception when sqlstate '42501' then null; end;
  end if;
  perform set_config('request.jwt.claim.sub','',true);
  begin perform public.hotel_join(); raise exception 'Anonymous joined'; exception when sqlstate '42501' then null; end;
  begin perform public.hotel_record_answer(gen_random_uuid(),q,0,false); raise exception 'Anonymous scored'; exception when sqlstate '42501' then null; end;
  if has_table_privilege('authenticated','public.englishsuccess_hotel_answers','INSERT') then raise exception 'Direct score writes allowed'; end if;
  if has_function_privilege('anon','public.hotel_scoreboard(text)','EXECUTE') then raise exception 'Anonymous scoreboard allowed'; end if;
  if (select count(*) from public.fifa_english_weekly_points)<>baseline then raise exception 'FIFA leaderboard affected'; end if;
end $$;
