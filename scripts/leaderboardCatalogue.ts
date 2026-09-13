import { getQuizCatalogue } from '../src/learning/quizContent'
import { questionProgressKey } from '../src/learning/progressData'

// Run after changes to the quiz catalogue, through the database migration channel.
const catalogue = getQuizCatalogue()
const quote = (text: string) => `'${text.replaceAll("'", "''")}'`
const values = [...catalogue.vocabulary, ...catalogue.sentences].map(q => `(${quote(questionProgressKey(q))},${quote(q.answer)},true)`)
console.log(`begin;\nupdate public.fifa_english_scoring_questions set active=false;\ninsert into public.fifa_english_scoring_questions(question_id,answer,active) values\n${values.join(',\n')}\non conflict(question_id) do update set answer=excluded.answer,active=true;\ncommit;`)
