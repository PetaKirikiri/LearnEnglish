begin;
create or replace function public.english_blueprint_student_results(p_learner uuid default null)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare target uuid; result jsonb;
begin
 -- Reuse the student view's account/teacher membership checks.
 target:=((public.english_vocabulary_student_progress(p_learner))->>'selected')::uuid;
 select coalesce(jsonb_agg(to_jsonb(r)),'[]'::jsonb) into result from (
  select q.sentence,count(*) as attempts,count(*) filter(where a.correct) as correct_count,
   count(*) filter(where a.correct and a.modality='audio') as listening_correct
  from public.english_word_attempts a join public.english_word_questions q
   on q.id=a.question_id and q.version=a.question_version
  where a.learner_id=target group by q.sentence
 ) r;
 return result;
end $$;
revoke all on function public.english_blueprint_student_results(uuid) from public,anon,authenticated;
grant execute on function public.english_blueprint_student_results(uuid) to authenticated;
commit;
