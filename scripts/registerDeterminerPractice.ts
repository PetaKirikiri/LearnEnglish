import {writeFileSync} from 'node:fs'
import {determinerCandidates} from '../src/race/generatedPracticeContent'
import {wordTokens} from '../src/learning/wordProgress/model'
const questions=determinerCandidates(),quote=(s:string)=>`'${s.replaceAll("'","''")}'`
const words=[...new Set(questions.flatMap(q=>wordTokens(q.credit??'')))]
writeFileSync('supabase/migrations/20261111050000_determiner_practice.sql',`-- Shared grammatical combinations; the learner hierarchy chooses which are served.\nbegin;\ninsert into public.english_word_forms(id,form) values\n${words.map(w=>`(${quote('en:'+w)},${quote(w)})`).join(',\n')}\non conflict do nothing;\ninsert into public.english_word_questions(id,version,sentence,choices,answer,credit_sentence) values\n${questions.map(q=>`(${quote(q.id)},1,${quote(q.document.english)},array[${q.choices.map(quote).join(',')}],${quote(q.choices[q.correct])},${q.credit===null?'null':quote(q.credit)})`).join(',\n')}\non conflict(id,version) do nothing;\ncommit;\n`)
console.log(`Registered ${questions.length} valid determiner combinations`)
