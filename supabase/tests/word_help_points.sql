-- Run after the migration inside a transaction and ROLLBACK. No test scores persist.
do $$
declare learner uuid := '7bdc33ac-7f21-4ebf-bfbf-343080724890';
  q text := 'word-help-test-' || gen_random_uuid()::text;
  event_count bigint;
begin
  if public.fifa_english_answer_points(null) <> 10
    or public.fifa_english_answer_points('[]') <> 10
    or public.fifa_english_answer_points('["train"]') <> 8
    or public.fifa_english_answer_points('["Train", " train ", "city"]') <> 6
    or public.fifa_english_answer_points('["a","b","c","d","e","f"]') <> 0
    or public.fifa_english_answer_points('"invalid"') <> 0
    or public.fifa_english_answer_points('[null]') <> 0 then
    raise exception 'Hint arithmetic failed';
  end if;
  if has_table_privilege('authenticated','public.fifa_english_weekly_points','INSERT') then
    raise exception 'Clients must not write scores';
  end if;
  insert into public.fifa_english_scoring_questions(question_id,answer,active) values(q,'right',true);
  select count(*) into event_count from public.fifa_english_events;
  insert into public.fifa_english_events(id,learner_id,kind,payload)
    values(gen_random_uuid(),learner,'answer',jsonb_build_object('questionId',q,'choice','wrong','correct',true,'points',1000));
  if exists(select 1 from public.fifa_english_weekly_points where question_id=q) then
    raise exception 'Wrong answer awarded points';
  end if;
  insert into public.fifa_english_events(id,learner_id,kind,payload)
    values(gen_random_uuid(),learner,'answer',jsonb_build_object('questionId',q,'choice','right','helpWords','["train","TRAIN","city"]'::jsonb,'points',1000));
  if (select points from public.fifa_english_weekly_points where question_id=q) <> 6 then
    raise exception 'Award did not deduct hints';
  end if;
  insert into public.fifa_english_events(id,learner_id,kind,payload)
    values(gen_random_uuid(),learner,'answer',jsonb_build_object('questionId',q,'choice','right','helpWords','[]'::jsonb));
  if (select count(*) from public.fifa_english_weekly_points where question_id=q) <> 2
    or (select sum(points) from public.fifa_english_weekly_points where question_id=q) <> 16 then
    raise exception 'A second correct repetition did not earn its own points';
  end if;
  if (select count(*) from public.fifa_english_events) <> event_count+3 then raise exception 'Missing test events'; end if;
  perform set_config('request.jwt.claim.sub', learner::text, true);
  if exists (
    select 1 from unnest(array['today','week','month']) period
    cross join lateral (select public.fifa_english_leaderboard_period(period) data) b
    cross join lateral jsonb_to_recordset(b.data->'rows') r(id uuid,points bigint)
    where r.points <> (select coalesce(sum(w.points),0) from public.fifa_english_weekly_points w
      where w.learner_id=r.id
        and w.awarded_at >= (b.data->>'periodStart')::date::timestamp at time zone 'Asia/Bangkok'
        and w.awarded_at < (b.data->>'periodEnd')::date::timestamp at time zone 'Asia/Bangkok')
  ) then raise exception 'Leaderboard did not sum reduced awards'; end if;
end $$;
