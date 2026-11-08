// Print the migration body to stdout so the author can save a new migration.
// Archived rows remain available for scoring earlier attempts.
import {actionPracticeQuestions} from '../src/race/actionPracticeContent'
const quote=(value:string)=>"'" + value.replaceAll("'","''") + "'"
const rows=actionPracticeQuestions.map(q=>
 `(${quote(q.id)},${quote(q.english)},array[${q.choices.map(quote).join(',')}],${quote(q.thai)})`
)
console.log('delete from public.english_classroom_question_catalogue;')
console.log('with taught(id,sentence,choices,answer) as (values\n'+rows.join(',\n')+'\n),')
console.log('registered as (insert into public.english_word_questions(id,version,sentence,choices,answer,credit_sentence)\n select id,1,sentence,choices,answer,sentence from taught on conflict(id,version) do nothing)\ninsert into public.english_classroom_question_catalogue(question_id) select id from taught;')
