// Emits additive seed SQL; run it only against the language database.
import { buildCurriculumSeed } from '../src/curriculum/seed'
import { curriculumSchema } from '../src/curriculum/schema'
const data=curriculumSchema.parse(buildCurriculumSeed())
const sql=(value:unknown)=>`'${JSON.stringify(value).replaceAll("'","''")}'::jsonb`
console.log(`-- TARGET: SubtitleDisplay gbsopnbovsxlstnmaaga. Stable IDs preserve learner history.
begin;
insert into public.englishsuccess_curriculum_meta(singleton,revision) values(true,'${data.revision}') on conflict(singleton) do nothing;
insert into public.englishsuccess_curriculum_sources(id,payload)
select v->>'id',v from jsonb_array_elements(${sql(data.sources)}) v on conflict(id) do nothing;
insert into public.englishsuccess_curriculum_skills(id,level,position,payload)
select v->>'id',v->>'level',(v->>'order')::integer,v from jsonb_array_elements(${sql(data.skills)}) v on conflict(id) do nothing;
insert into public.englishsuccess_course_skills(course,skill,node_id,position)
select v->>'course',v->>'skill',v->>'nodeId',(v->>'order')::integer from jsonb_array_elements(${sql(data.courseSkills)}) v on conflict(course,skill) do nothing;
insert into public.englishsuccess_course_questions(id,course,skill,position,payload)
select v->>'id','hotel',v->>'skill',ordinality::integer,v from jsonb_array_elements(${sql(data.questions)}) with ordinality as q(v,ordinality) on conflict(id) do nothing;
-- Link only words already present in the reviewed Thai dictionary. Never fill
-- missing words with machine guesses or overwrite established Thai meanings.
insert into public.englishsuccess_question_words(question_id,word,role)
select distinct q.id,w.word,case when q.payload->'grammar'->'targets' ? w.word then 'target' else 'context' end
from public.englishsuccess_course_questions q
cross join lateral regexp_matches(lower(q.payload->>'english'), '[a-z]+(?:''[a-z]+)*','g') token
join public.englishsuccess_words w on w.word=token[1]
on conflict(question_id,word) do nothing;
commit;`)
