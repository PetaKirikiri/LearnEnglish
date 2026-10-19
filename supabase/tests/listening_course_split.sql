-- Execute inside BEGIN/ROLLBACK. No test scores or enrolments are retained.
do $$
declare uid uuid := '7bdc33ac-7f21-4ebf-bfbf-343080724890'; eid uuid := gen_random_uuid();
  english_q text := 'hotel-g3-general-test-'||gen_random_uuid(); hotel_q text := 'hotel-split-test-'||gen_random_uuid();
  before_h bigint; before_e bigint; after_h bigint; after_e bigint; r jsonb; period text;
begin
  perform set_config('request.jwt.claim.sub',uid::text,true);
  select coalesce(sum((x->>'points')::bigint),0) into before_h from jsonb_array_elements(public.hotel_scoreboard('all')) x;
  select coalesce(sum((x->>'points')::bigint),0) into before_e from jsonb_array_elements(public.english_scoreboard('all')) x;
  insert into public.englishsuccess_hotel_questions(id,answer) values(english_q,0),(hotel_q,1);
  r := public.english_record_answer(eid,english_q,0,false);
  if (r->>'points')::integer<>10 then raise exception 'English award failed'; end if;
  perform public.english_record_answer(eid,english_q,0,false);
  if (select count(*) from public.englishsuccess_hotel_answers where event_id=eid)<>1 then raise exception 'Duplicated English award'; end if;
  select coalesce(sum((x->>'points')::bigint),0) into after_h from jsonb_array_elements(public.hotel_scoreboard('all')) x;
  select coalesce(sum((x->>'points')::bigint),0) into after_e from jsonb_array_elements(public.english_scoreboard('all')) x;
  if after_h<>before_h or after_e<>before_e+10 then raise exception 'English points leaked into Hotel'; end if;
  perform public.hotel_record_answer(gen_random_uuid(),hotel_q,1,false);
  select coalesce(sum((x->>'points')::bigint),0) into after_h from jsonb_array_elements(public.hotel_scoreboard('all')) x;
  select coalesce(sum((x->>'points')::bigint),0) into after_e from jsonb_array_elements(public.english_scoreboard('all')) x;
  if after_h<>before_h+10 or after_e<>before_e+10 then raise exception 'Hotel points leaked into English'; end if;
  -- A queued general answer from the old app remains idempotent and correctly attributed.
  r := public.hotel_record_answer(eid,english_q,0,false);
  if (r->>'points')::integer<>10 then raise exception 'Legacy retry failed'; end if;
  begin perform public.english_record_answer(gen_random_uuid(),hotel_q,1,false); raise exception 'Hotel item accepted by English';
    exception when sqlstate '22023' then null; end;
  begin perform public.english_record_answer(gen_random_uuid(),'hotel-g3-general-does-not-exist',0,false); raise exception 'Unknown item accepted';
    exception when sqlstate '22023' then null; end;
  foreach period in array array['today','week','month','all'] loop
    if not exists(select 1 from jsonb_array_elements(public.english_scoreboard(period)) x where x->>'id'=uid::text) then raise exception 'English member missing'; end if;
    if not exists(select 1 from jsonb_array_elements(public.hotel_scoreboard(period)) x where x->>'id'=uid::text) then raise exception 'Hotel member missing'; end if;
  end loop;
  if has_table_privilege('authenticated','public.englishsuccess_listening_members','INSERT') then raise exception 'Direct enrolment allowed'; end if;
  if has_function_privilege('authenticated','public.listening_scoreboard(text,text)','EXECUTE') then raise exception 'Internal scoreboard exposed'; end if;
  if has_function_privilege('anon','public.english_record_answer(uuid,text,integer,boolean)','EXECUTE') then raise exception 'Anonymous scoring allowed'; end if;
  perform set_config('request.jwt.claim.sub','',true);
  begin perform public.english_join(); raise exception 'Anonymous joined'; exception when sqlstate '42501' then null; end;
  begin perform public.english_scoreboard('all'); raise exception 'Anonymous read members'; exception when sqlstate '42501' then null; end;
end $$;
