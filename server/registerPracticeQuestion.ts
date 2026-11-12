import type {SupabaseClient} from '@supabase/supabase-js'
import type {GeneratedQuestion} from '../src/race/generatedPracticeContent'
import {wordTokens} from '../src/learning/wordProgress/model'
/** Only server-owned canonical questions enter the scoring catalogue. Existing versions remain immutable. */
export async function registerPracticeQuestion(db:SupabaseClient,question:GeneratedQuestion){
 const forms=[...new Set(wordTokens(question.credit??''))].map(form=>({id:'en:'+form,form}))
 if(forms.length){const result=await db.from('english_word_forms').upsert(forms,{onConflict:'id',ignoreDuplicates:true});if(result.error)throw result.error}
 const result=await db.from('english_word_questions').upsert({id:question.id,version:question.version,sentence:question.document.english,choices:question.choices,answer:question.choices[question.correct],credit_sentence:question.credit},{onConflict:'id,version',ignoreDuplicates:true})
 if(result.error)throw result.error
}
