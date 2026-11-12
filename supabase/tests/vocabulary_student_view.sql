begin;
do $$
declare teacher uuid; student uuid; result jsonb; blocked boolean:=false;
begin
 select p.id into teacher from public.profiles p join public.english_success_members m on m.learner_id=p.id where p.is_admin and lower(trim(p.display_name))='peta' order by p.id limit 1;
 select p.id into student from public.profiles p join public.english_success_members m on m.learner_id=p.id where not coalesce(p.is_admin,false) order by p.id limit 1;
 if teacher is null or student is null then raise exception 'Missing teacher/student test accounts';end if;
 perform set_config('request.jwt.claim.sub',teacher::text,true);
 result:=public.english_vocabulary_student_progress();
 if (result->>'selected')::uuid<>teacher or jsonb_array_length(result->'students')<2 then raise exception 'Peta default or teacher roster failed';end if;
 if jsonb_array_length(result->'rows')<>(select count(*) from public.english_word_progress where learner_id=teacher) then raise exception 'Teacher progress mismatch';end if;
 result:=public.english_vocabulary_student_progress(student);
 if (result->>'selected')::uuid<>student then raise exception 'Student switch failed';end if;
 if jsonb_array_length(result->'rows')<>(select count(*) from public.english_word_progress where learner_id=student) then raise exception 'Student progress mismatch';end if;
 perform set_config('request.jwt.claim.sub',student::text,true);
 result:=public.english_vocabulary_student_progress();
 if (result->>'selected')::uuid<>student or jsonb_array_length(result->'students')<>1 then raise exception 'Student own-only scope failed';end if;
 begin perform public.english_vocabulary_student_progress(teacher);exception when insufficient_privilege then blocked:=true;end;
 if not blocked then raise exception 'Student can read another account';end if;
 if has_function_privilege('anon','public.english_vocabulary_student_progress(uuid)','execute') then raise exception 'Anonymous roster access';end if;
end $$;
rollback;
