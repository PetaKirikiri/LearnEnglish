import {readFileSync,writeFileSync} from 'node:fs'
import {allPracticeCandidates} from '../src/race/generatedPracticeContent'
import {wordTokens} from '../src/learning/wordProgress/model'
const existing: {id:string;version:number}[]=JSON.parse(readFileSync(process.argv[2],'utf8'))
const ids=new Set(existing.map(q=>q.id)),questions=allPracticeCandidates().filter(q=>!ids.has(q.id)),quote=(s:string)=>`'${s.replaceAll("'","''")}'`
const words=[...new Set(questions.flatMap(q=>wordTokens(q.credit??'')))]
const header=`-- Reviewed subject and object semantics; learner progress controls selection.\nbegin;\ninsert into public.english_word_forms(id,form) values\n${words.map(w=>`(${quote('en:'+w)},${quote(w)})`).join(',\n')}\non conflict do nothing;\n`
const chunks=[]
for(let i=0;i<questions.length;i+=300){
 const batch=questions.slice(i,i+300)
 chunks.push(`insert into public.english_word_questions(id,version,sentence,choices,answer,credit_sentence) values\n${batch.map(q=>`(${quote(q.id)},1,${quote(q.document.english)},array[${q.choices.map(quote).join(',')}],${quote(q.choices[q.correct])},${q.credit===null?'null':quote(q.credit)})`).join(',\n')}\non conflict(id,version) do nothing;\n`)
}
writeFileSync(process.argv[3]??'supabase/migrations/20261111070000_reviewed_action_semantics.sql',header+chunks.join('')+'commit;\n')
console.log(JSON.stringify({existing:ids.size,added:questions.length,words:words.length,batches:chunks.length}))
