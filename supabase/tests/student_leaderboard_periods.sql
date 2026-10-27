begin;
do $$
declare
 learner uuid; q public.english_word_questions; event_id uuid:=gen_random_uuid();
 before_scores jsonb:='{}'; result jsonb; item jsonb; period text; score bigint;
 local_now timestamp:=now() at time zone 'Asia/Bangkok';
 day_start timestamptz:=date_trunc('day',local_now) at time zone 'Asia/Bangkok';
 week_start timestamptz:=date_trunc('week',local_now) at time zone 'Asia/Bangkok';
 month_start timestamptz:=date_trunc('month',local_now) at time zone 'Asia/Bangkok';
 inserted_times timestamptz[]; expected bigint; roster_count integer;
begin
 select learner_id into learner from public.fifa_english_events where learner_id<>'7bdc33ac-7f21-4ebf-bfbf-343080724890'::uuid limit 1;
 if learner is null then raise exception 'Existing English learner required for rollback test'; end if;
 perform set_config('request.jwt.claim.sub','',true);
 begin perform public.english_success_leaderboard('all');raise exception 'Anonymous access accepted';exception when insufficient_privilege then null;end;
 perform set_config('request.jwt.claim.sub',learner::text,true);
 begin perform public.english_success_leaderboard('year');raise exception 'Bad period accepted';exception when invalid_parameter_value then null;end;
 foreach period in array array['today','week','month','all'] loop
  result:=public.english_success_leaderboard(period);
  select r into item from jsonb_array_elements(result->'rows')r where r->>'id'=learner::text;
  before_scores:=before_scores||jsonb_build_object(period,(item->>'points')::bigint);
  if not exists(select 1 from jsonb_array_elements(result->'rows')r where r->>'name'='Fifa') then raise exception 'Legacy student missing';end if;
  if exists(select 1 from jsonb_array_elements(result->'rows')r where r->>'id'='7bdc33ac-7f21-4ebf-bfbf-343080724890') then raise exception 'Teacher included';end if;
  if exists(select 1 from jsonb_array_elements(result->'rows')r where (r->>'points')::bigint=0 and r->>'rank' is not null) then raise exception 'Zero score shown as winning rank';end if;
  if roster_count is not null and jsonb_array_length(result->'rows')<>roster_count then raise exception 'Roster changes with period';end if;
  roster_count:=jsonb_array_length(result->'rows');
 end loop;
 select * into q from public.english_word_questions limit 1;
 inserted_times:=array[day_start,day_start-interval '1 microsecond',week_start,week_start-interval '1 microsecond',month_start,month_start-interval '1 microsecond'];
 foreach day_start in array inserted_times loop
  perform public.record_english_word_answer(gen_random_uuid(),q.id,q.version,q.answer,day_start,'visible',0,1,learner);
 end loop;
 perform public.record_english_word_answer(event_id,q.id,q.version,q.answer,now(),'visible',0,1,learner);
 perform public.record_english_word_answer(event_id,q.id,q.version,q.answer,now(),'visible',0,1,learner);
 perform public.record_english_word_answer(gen_random_uuid(),q.id,q.version,case when q.choices[1]=q.answer then q.choices[2] else q.choices[1] end,now(),'visible',0,1,learner);
 foreach period in array array['today','week','month','all'] loop
  result:=public.english_success_leaderboard(period);
  select (r->>'points')::bigint into score from jsonb_array_elements(result->'rows')r where r->>'id'=learner::text;
  select count(*)*10+10 into expected from unnest(inserted_times) stamp where period='all' or stamp>=(date_trunc(case when period='today' then 'day' else period end,local_now) at time zone 'Asia/Bangkok');
  if score<>(before_scores->>period)::bigint+expected then raise exception 'Period %, expected extra %, got %',period,expected,score-(before_scores->>period)::bigint;end if;
 end loop;
 if has_function_privilege('anon','public.english_success_leaderboard(text)','execute') then raise exception 'Anonymous execution allowed';end if;
 if public.english_success_leaderboard() is distinct from public.english_success_leaderboard('all')->'rows' then raise exception 'Old client compatibility broken';end if;
end $$;
rollback;
select 'Periods, full roster, zero points, duplicates, and permissions passed; test answers rolled back' as result;
