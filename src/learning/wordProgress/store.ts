import { supabase } from '../../lib/supabase'
import type { WordAttempt, WordProgress } from './model'
import {isRejectedAnswer} from './uploadErrors'
import {submitAttempt} from './submitAttempt'
const key=(userId:string)=>`english-word-outbox:v1:${userId}`
export function pendingAttempts(userId:string):WordAttempt[]{try{const rows=JSON.parse(localStorage.getItem(key(userId))??'[]');return Array.isArray(rows)?rows:[]}catch{return []}}
export function queueAttempt(userId:string,attempt:WordAttempt){
 const pending=pendingAttempts(userId)
 if(!pending.some(item=>item.id===attempt.id&&(item.event??'answered')===(attempt.event??'answered')))localStorage.setItem(key(userId),JSON.stringify([...pending,attempt]))
}
const flushing=new Map<string,Promise<void>>()
export async function loadWordProgress(userId:string):Promise<WordProgress[]>{
 const rows:WordProgress[]=[]
 for(let offset=0;;offset+=1000){
  const {data,error}=await supabase.from('english_word_progress').select('word_id,exposure_count,last_exposed_at,correct,attempts,listening_correct,direct_correct,last_practised,recent_results,fade_score,confirmation_count,proven_at,review_due_at,review_step,reviewed_at,lapsed_at,learning_updated_at,learning_version').eq('learner_id',userId).order('word_id').range(offset,offset+999)
  if(error)throw error
  rows.push(...(data??[]))
  if(!data || data.length<1000)return rows
 }
}
export function flushWordAttempts(userId:string):Promise<void>{
 const previous=flushing.get(userId);if(previous)return previous
 const work=(async()=>{
  const {data}=await supabase.auth.getUser()
  if(data.user?.id!==userId)throw new Error('Account changed')
  let rejected:unknown
  for(const attempt of pendingAttempts(userId)){
   try{await submitAttempt('word',{p_id:attempt.id,p_question:attempt.questionId,p_version:attempt.version,p_answer:attempt.answer,p_occurred:attempt.occurredAt,p_modality:attempt.modality,p_replays:attempt.replays,p_rule:attempt.ruleVersion,...(attempt.event?{p_event:attempt.event}:{})},attempt.recipe)}
   catch(error){if(!isRejectedAnswer(error))throw error;rejected??=error;continue}
   // Re-read, so answers queued while this request was in flight are preserved.
   localStorage.setItem(key(userId),JSON.stringify(pendingAttempts(userId).filter(item=>item.id!==attempt.id||(item.event??'answered')!==(attempt.event??'answered'))))
  }
  if(rejected)throw rejected
 })().finally(()=>flushing.delete(userId))
 flushing.set(userId,work);return work
}
