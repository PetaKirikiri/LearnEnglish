import {writeFileSync} from 'node:fs'
import {structureCandidates} from '../src/race/generatedPracticeContent'
const bank=(['identify','location','destination'] as const).flatMap(structureCandidates)
const quote=(s:string)=>`'${s.replaceAll("'","''")}'`
const tokens=new Set(bank.flatMap(q=>(q.credit??'').toLowerCase().match(/[a-z]+(?:'[a-z]+)*/g)??[]))
writeFileSync('supabase/migrations/20261111020000_shared_practice_structures.sql',`-- Shared engine validation catalogue, generated from constructions and the global lexicon.\n-- These are valid combinations, never lesson assignments or learner decks.\nbegin;\ninsert into public.english_word_forms(id,form) values\n${[...tokens].sort().map(t=>`(${quote('en:'+t)},${quote(t)})`).join(',\n')}\non conflict do nothing;\ninsert into public.english_word_questions(id,version,sentence,choices,answer,credit_sentence) values\n${bank.map(q=>`(${quote(q.id)},1,${quote(q.document.english)},array[${q.choices.map(quote).join(',')}],${quote(q.choices[q.correct])},${q.credit===null?'null':quote(q.credit)})`).join(',\n')}\non conflict(id,version) do nothing;\ncommit;\n`)
console.log(`Registered ${bank.length} valid engine combinations`)
