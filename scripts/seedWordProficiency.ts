import { writeFileSync } from 'node:fs'
import { tonightMeaningQuestions,tonightJudgementQuestions } from '../src/race/tonightQuestions'
import { lessonTwoReviewQuestions,lessonTwoNumberQuestions } from '../src/race/lessonTwoQuestions'
import { lessonTwoPairs,lessonTwoWords } from '../src/classroom/lessonTwoContent'
const questions=[...tonightMeaningQuestions,...lessonTwoReviewQuestions,...tonightJudgementQuestions,...lessonTwoNumberQuestions]
const unique=[...new Map(questions.map(q=>[q.id,q])).values()]
const quote=(s:string)=>`'${s.replaceAll("'","''")}'`
const rows=unique.map(q=>`(${quote(q.id)},1,${quote(q.english)},array[${q.answers.map(a=>quote(a.map(x=>x.text).join(' '))).join(',')}],${quote(q.answers[q.correct].map(x=>x.text).join(' '))},${q.answers[q.correct][0].text==='Wrong'?'null':quote(q.english)})`)
const forms=[...new Set(unique.flatMap(q=>q.english.toLowerCase().match(/[a-z]+(?:'[a-z]+)*/g)??[]))]
const lemmas=new Map<string,string>([['is','be'],['are','be'],...([...lessonTwoWords,...lessonTwoPairs].flatMap(w=>w.singular?[[w.singular,w.singular],[w.plural,w.singular]]:[]) as [string,string][])])
writeFileSync('supabase/migrations/20261028000100_word_proficiency_catalogue.sql',`begin;\ninsert into public.english_word_questions(id,version,sentence,choices,answer,credit_sentence) values\n${rows.join(',\n')}\non conflict(id,version) do nothing;\ninsert into public.english_word_forms(id,form,lemma_id) values\n${forms.map(w=>`(${quote('en:'+w)},${quote(w)},${quote('en:'+(lemmas.get(w)??w))})`).join(',\n')}\non conflict(id) do update set lemma_id=excluded.lemma_id;\ncommit;\n`)
console.log(`Prepared ${unique.length} questions and ${forms.length} word forms`)
