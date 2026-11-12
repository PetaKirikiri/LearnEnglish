begin;
create or replace function public.english_vocabulary_student_progress(p_learner uuid default null)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare viewer uuid:=auth.uid(); teacher boolean; target uuid; students jsonb; progress jsonb;
begin
 if viewer is null then raise exception 'Sign in required' using errcode='42501'; end if;
 teacher:=public.fifa_english_is_admin();
 target:=p_learner;
 if target is null then
  if teacher then
   select p.id into target from public.profiles p join public.english_success_members m on m.learner_id=p.id
    where lower(trim(p.display_name))='peta' order by p.is_admin desc,p.id limit 1;
  end if;
  target:=coalesce(target,viewer);
 end if;
 if target<>viewer and (not teacher or not exists(select 1 from public.english_success_members m where m.learner_id=target)) then
  raise exception 'Teacher access required for this learner' using errcode='42501';
 end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'name',coalesce(nullif(trim(p.display_name),''),'Learner')) order by lower(p.display_name),p.id),'[]'::jsonb)
 into students from public.profiles p where p.id=viewer or (teacher and exists(select 1 from public.english_success_members m where m.learner_id=p.id));
 select coalesce(jsonb_agg(to_jsonb(w) order by w.word_id),'[]'::jsonb) into progress from (
  select word_id,correct,attempts,listening_correct,direct_correct,last_practised,recent_results
  from public.english_word_progress where learner_id=target
 ) w;
 return jsonb_build_object('selected',target,'students',students,'rows',progress);
end $$;
revoke all on function public.english_vocabulary_student_progress(uuid) from public,anon,authenticated;
grant execute on function public.english_vocabulary_student_progress(uuid) to authenticated;
commit;
