// Prepare a release; do not connect to either live database.
import {readFileSync, writeFileSync} from 'node:fs'
import {buildSyllabus} from '../src/curriculum/syllabus'
const previous=JSON.parse(readFileSync('src/curriculum/syllabus.snapshot.json','utf8'))
const data=buildSyllabus(Object.fromEntries(previous.vocabulary.map((w:{word:string;thai:string})=>[w.word,w.thai])))
writeFileSync('src/curriculum/syllabus.snapshot.json',JSON.stringify(data,null,2)+'\n')
const sql=(value:unknown)=>`'${JSON.stringify(value).replaceAll("'","''")}'::jsonb`
writeFileSync('supabase/language/20261025160000_english_alignment.sql',`-- Requires the introductions release. English-only metadata; Hotel and question IDs unchanged.
begin;
update public.englishsuccess_curriculum_skills s set payload=v
from jsonb_array_elements(${sql(data.skills)}) v where s.id=v->>'id';
update public.englishsuccess_sentence_structures s set payload=v
from jsonb_array_elements(${sql(data.structures)}) v where s.id=v->>'id';
update public.englishsuccess_curriculum_meta set revision='${data.revision}' where singleton;
commit;
`)
console.log('Prepared English alignment release. No database changes applied.')
