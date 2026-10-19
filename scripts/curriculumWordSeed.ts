// Initial import of existing Hotel meanings, not machine-generated translations.
import { hotelQuestions } from '../src/hotel/course'
import { hotelWordGlosses } from '../src/hotel/wordGlosses'
import { hotelWordProfiles } from '../src/hotel/wordProfiles'
import { wordProfileSchema } from '../src/learning/wordInfo/types'
const words=[...new Set(hotelQuestions.flatMap(q=>q.english.toLowerCase().match(/[a-z]+(?:'[a-z]+)*/g)??[]))]
const rows=words.filter(word=>hotelWordGlosses[word]).map(word=>({word,thai_gloss:hotelWordGlosses[word],word_profile:wordProfileSchema.parse(hotelWordProfiles[word])}))
console.log(`-- TARGET: SubtitleDisplay gbsopnbovsxlstnmaaga ONLY.
-- Reuse existing Hotel glosses/profiles for missing words. Existing rows and
-- story frequency rankings stay untouched; no new FIFA lesson vocabulary.
begin;
insert into public.englishsuccess_words(word,thai_gloss,lesson_thai_gloss,corpus_count,corpus_rank,word_profile)
select v->>'word',v->>'thai_gloss',null,0,null,v->'word_profile'
from jsonb_array_elements('${JSON.stringify(rows).replaceAll("'","''")}'::jsonb) v
on conflict(word) do nothing;
insert into public.englishsuccess_question_words(question_id,word,role)
select distinct q.id,w.word,case when q.payload->'grammar'->'targets' ? w.word then 'target' else 'context' end
from public.englishsuccess_course_questions q
cross join lateral regexp_matches(lower(q.payload->>'english'), '[a-z]+(?:''[a-z]+)*','g') token
join public.englishsuccess_words w on w.word=token[1]
on conflict(question_id,word) do nothing;
commit;`)
