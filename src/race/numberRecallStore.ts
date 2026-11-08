import {supabase} from '../lib/supabase'
import type {RecallAttempt} from './numberRecall'
import {isRejectedAnswer} from '../learning/wordProgress/uploadErrors'
import {submitAttempt} from '../learning/wordProgress/submitAttempt'
const key=(user?:string)=>`english:number-recall:v1:${user??'guest'}`
const outboxKey=(user:string)=>`${key(user)}:outbox`
function read(key:string):RecallAttempt[]{
 try{const rows=JSON.parse(localStorage.getItem(key)??'[]');return Array.isArray(rows)?rows.filter(row=>row&&typeof row.id==='string'&&typeof row.word==='string'&&[1,2,3].includes(row.module)&&[0,1].includes(row.answer)&&typeof row.correct==='boolean'&&Number.isFinite(row.at)&&typeof row.assisted==='boolean'&&typeof row.heard==='boolean'&&Number.isInteger(row.replays)&&row.replays>=0&&[0,1,2,3].includes(row.support)):[]}catch{return []}
}
export function readRecall(user?:string):RecallAttempt[]{return read(key(user))}
function pending(user:string):RecallAttempt[]{return read(outboxKey(user))}
const merge=(...sets:RecallAttempt[][])=>[...new Map(sets.flat().map(event=>[event.id,event])).values()].sort((a,b)=>a.at-b.at||a.id.localeCompare(b.id))
export function saveRecall(event:RecallAttempt,user?:string){
 // Queue before acknowledging the answer. A failed write leaves the UI retryable.
 if(user)localStorage.setItem(outboxKey(user),JSON.stringify(merge(pending(user),[event])))
 localStorage.setItem(key(user),JSON.stringify(merge(readRecall(user),[event])))
}
const flushing=new Map<string,Promise<void>>()
export function syncRecall(user:string):Promise<void>{
 const existing=flushing.get(user);if(existing)return existing
 const work=(async()=>{
  const {data}=await supabase.auth.getUser()
  if(data.user?.id!==user)throw new Error('Account changed')
  const attempted=new Set<string>()
  let rejected:unknown
  const flushPending=async()=>{
  while(pending(user).some(event=>!attempted.has(event.id))){
  for(const event of pending(user).filter(event=>!attempted.has(event.id))){
   attempted.add(event.id)
   try{await submitAttempt('number',{p_id:event.id,p_word:event.word,p_module:event.module,p_answer:event.answer,p_at:new Date(event.at).toISOString(),p_assisted:event.assisted,p_heard:event.heard,p_replays:event.replays,p_support:event.support,...(event.verb?{p_verb:event.verb}:{})})}
   catch(error){if(!isRejectedAnswer(error))throw error;rejected??=error;continue}
   localStorage.setItem(outboxKey(user),JSON.stringify(pending(user).filter(item=>item.id!==event.id)))
  }
  }
  }
  await flushPending()
  const rows:RecallAttempt[]=[]
  const settledLegacy=new Set<string>()
  const legacyKey=(id:string,module:number,at:number)=>JSON.stringify([id,module,at])
  for(let offset=0;;offset+=1000){
   const {data,error}=await supabase.from('english_number_attempts').select('id,legacy_id,word,module,answer,correct,occurred_at,assisted,heard,replays,support,presented_verb').eq('learner_id',user).order('occurred_at').order('id').range(offset,offset+999)
   if(error)throw error
   for(const row of data??[])if(row.legacy_id)settledLegacy.add(legacyKey(row.legacy_id,row.module,Date.parse(row.occurred_at)))
   rows.push(...(data??[]).map(row=>({...row,at:Date.parse(row.occurred_at),...(row.presented_verb?{verb:row.presented_verb}:{})})))
   if(!data||data.length<1000)break
  }
  // A saved receipt may still await scoring. Keep that local history until it
  // appears in scored history; server records override matching local records.
  const unscoredLocal=readRecall(user).filter(event=>!settledLegacy.has(legacyKey(event.id,event.module,event.at)))
  localStorage.setItem(key(user),JSON.stringify(merge(unscoredLocal,rows,pending(user))))
  // A final answer may arrive while history is loading; upload it in this run.
  await flushPending()
  if(rejected)throw rejected
 })().finally(()=>flushing.delete(user))
 flushing.set(user,work);return work
}
