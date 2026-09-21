import { writeFileSync } from 'node:fs'
import { examPracticeQuestions, buildExamExplainers } from '../src/learning/examPracticeContent'
import { explainerSchema } from '../src/learning/explainers/types'
import { questionProgressKey } from '../src/learning/progressData'
const quote=(s:string)=>"'"+s.replaceAll("'","''")+"'"
const rows=explainerSchema.array().parse(buildExamExplainers())
const sql=`begin;
-- Additive exam preparation. Existing content, progress and awarded points are untouched.
insert into public.fifa_english_scoring_questions(question_id, answer, active) values
${examPracticeQuestions.map(q=>`(${quote(questionProgressKey(q))}, ${quote(q.answer)}, true)`).join(',\n')}
on conflict(question_id) do update set answer=excluded.answer, active=true;
insert into public.fifa_english_question_explainers (question_id,content_key,pattern_key,title_th,rule_th,clue_th,caution_th,contrasts,examples)
select question_id,content_key,pattern_key,title_th,rule_th,clue_th,caution_th,contrasts,examples
from jsonb_to_recordset($explainers$${JSON.stringify(rows)}$explainers$::jsonb) as r(question_id text,content_key text,pattern_key text,title_th text,rule_th text,clue_th text,caution_th text,contrasts jsonb,examples jsonb)
on conflict(question_id) do update set content_key=excluded.content_key, pattern_key=excluded.pattern_key, title_th=excluded.title_th, rule_th=excluded.rule_th, clue_th=excluded.clue_th, caution_th=excluded.caution_th, contrasts=excluded.contrasts, examples=excluded.examples;
commit;
`
writeFileSync(process.argv[2] ?? 'supabase/migrations/20260921180000_exam_audit.sql',sql)
console.log(`${rows.length} new answer keys and Thai explainers prepared`)
