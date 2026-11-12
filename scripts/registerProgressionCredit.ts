import {writeFileSync,appendFileSync} from 'node:fs'
import {allPracticeCandidates} from '../src/race/generatedPracticeContent'
import {wordTokens} from '../src/learning/wordProgress/model'
// Canonical validation records from the current construction engine. Existing question versions
// and learner history remain intact; the runtime hierarchy still chooses questions.
const questions=allPracticeCandidates()
const output=process.argv[2]??'/private/tmp/progression_credit_paths.sql'
const quote=(text:string)=>`'${text.replaceAll("'","''")}'`
const words=[...new Set(questions.flatMap(q=>wordTokens(q.credit??'')))]
writeFileSync(output,`-- Existing blueprint forms; word capabilities gate valid combinations.\nbegin;\ninsert into public.english_word_forms(id,form) values\n${words.map(word=>`(${quote('en:'+word)},${quote(word)})`).join(',\n')}\non conflict do nothing;\n`)
for(let index=0;index<questions.length;index+=300){
 const batch=questions.slice(index,index+300)
 appendFileSync(output,`insert into public.english_word_questions(id,version,sentence,choices,answer,credit_sentence) values\n${batch.map(q=>`(${quote(q.id)},${q.version},${quote(q.document.english)},array[${q.choices.map(quote).join(',')}],${quote(q.choices[q.correct])},${q.credit===null?'null':quote(q.credit)})`).join(',\n')}\non conflict(id,version) do nothing;\n`)
}
appendFileSync(output,'commit;\n')
writeFileSync('/private/tmp/progression-credit-registrations.json',JSON.stringify({words:words.map(word=>({id:'en:'+word,form:word})),questions:questions.map(q=>({id:q.id,version:q.version,sentence:q.document.english,choices:q.choices,answer:q.choices[q.correct],credit_sentence:q.credit}))}))
console.log(JSON.stringify({questions:questions.length,words:words.length,migration:output}))
