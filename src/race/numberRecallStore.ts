import {supabase} from '../lib/supabase'
import type {RecallAttempt} from './numberRecall'
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
  const flushPending=async()=>{
  while(pending(user).length){
  for(const event of pending(user)){
   const {error}=await supabase.rpc('record_english_number_answer',{p_id:event.id,p_word:event.word,p_module:event.module,p_answer:event.answer,p_at:new Date(event.at).toISOString(),p_assisted:event.assisted,p_heard:event.heard,p_replays:event.replays,p_support:event.support,...(event.verb?{p_verb:event.verb}:{})})
   if(error)throw error
   localStorage.setItem(outboxKey(user),JSON.stringify(pending(user).filter(item=>item.id!==event.id)))
  }
  }
  }
  await flushPending()
  const rows:RecallAttempt[]=[]
  for(let offset=0;;offset+=1000){
   const {data,error}=await supabase.from('english_number_attempts').select('id,word,module,answer,correct,occurred_at,assisted,heard,replays,support,presented_verb').eq('learner_id',user).order('occurred_at').order('id').range(offset,offset+999)
   if(error)throw error
   rows.push(...(data??[]).map(row=>({...row,at:Date.parse(row.occurred_at),...(row.presented_verb?{verb:row.presented_verb}:{})})))
   if(!data||data.length<1000)break
  }
  localStorage.setItem(key(user),JSON.stringify(merge(rows,pending(user))))
  // A final answer may arrive while history is loading; upload it in this run.
  await flushPending()
 })().finally(()=>flushing.delete(user))
 flushing.set(user,work);return work
}
