-- Shared accounts DB: Class 1 assignment and server-side answer validation.
-- Does not modify prior scores or documents. Deploy alongside Class 1 assets.
begin;
insert into public.englishsuccess_class_lessons(id,number,title,date,skills,published)
values('9a1254a8-f3d7-4b85-a312-337ffd4df090',1,'Class 1','2026-10-26',array['class-one-everyday-questions'],true)
on conflict(id) do update set title=excluded.title,date=excluded.date,skills=excluded.skills,published=excluded.published
where englishsuccess_class_lessons.title in ('Lesson 1','Class 1')
  and (cardinality(englishsuccess_class_lessons.skills)=0 or englishsuccess_class_lessons.skills=array['class-one-everyday-questions']);

insert into public.englishsuccess_hotel_questions(id,answer,active)
select 'hotel-g3-general-class-one-word-'||n,(n-1)%2,true from generate_series(1,12) n
union all
select 'hotel-g3-general-class-one-question-word-'||n,(n-1)%2,true from generate_series(1,7) n
union all
select 'hotel-g3-general-class-one-identity-'||n,n-1,true from generate_series(1,2) n
on conflict(id) do update set answer=excluded.answer;
-- Retire only the superseded complex Class 1 items; keep their score history.
update public.englishsuccess_hotel_questions set active=false
where id ~ '^hotel-g3-general-class-one-question-([1-9]|1[0-4])-[12]$';
commit;
