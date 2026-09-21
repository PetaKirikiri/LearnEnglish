import { supabase } from '../../lib/supabase'
import { normalizeHelpWord } from '../helpPoints'
export type Confidence = {score:number; pending:boolean; revision:string}
const queues = new Map<string,Promise<unknown>>()
const keyFor=(id:string,word:string)=>`fifa:word-confidence:v1:${id}:${normalizeHelpWord(word)}`
const isAccount=(id:string)=>/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
export function cachedConfidence(id:string,word:string):Confidence|null {
  try { const value=JSON.parse(localStorage.getItem(keyFor(id,word))??'null');return value&&Number.isInteger(value.score)&&value.score>=1&&value.score<=5&&typeof value.revision==='string'?value:null }catch{return null}
}
function cache(id:string,word:string,value:Confidence) { try {localStorage.setItem(keyFor(id,word),JSON.stringify(value))}catch{/* Server save is still attempted. */} }
export async function saveConfidence(id:string,word:string,score:number):Promise<'saved'|'local'> {
  if(!Number.isInteger(score)||score<1||score>5)throw new Error('Invalid confidence')
  const normalized=normalizeHelpWord(word)
  if(!/^[a-z]+(?:'[a-z]+)*$/.test(normalized))throw new Error('Invalid word')
  const value={score,pending:isAccount(id),revision:crypto.randomUUID()}
  cache(id,normalized,value)
  if(!isAccount(id))return 'local'
  const key=keyFor(id,normalized)
  const task=(queues.get(key)??Promise.resolve()).catch(()=>{}).then(async()=>{
    const {error}=await supabase.from('fifa_english_word_confidence').upsert({learner_id:id,word:normalized,confidence:score},{onConflict:'learner_id,word'})
    if(error)throw error
    if(cachedConfidence(id,normalized)?.revision===value.revision)cache(id,normalized,{...value,pending:false})
    return 'saved' as const
  })
  queues.set(key,task)
  try{return await task}finally{if(queues.get(key)===task)queues.delete(key)}
}
export async function loadConfidence(id:string,word:string) {
  const normalized=normalizeHelpWord(word),cached=cachedConfidence(id,normalized)
  if(!isAccount(id))return {score:cached?.score??null,source:'local' as const}
  if(cached?.pending){await saveConfidence(id,normalized,cached.score);return {score:cached.score,source:'saved' as const}}
  const {data,error}=await supabase.from('fifa_english_word_confidence').select('confidence').eq('learner_id',id).eq('word',normalized).maybeSingle()
  if(error)throw error
  // A click while the read was pending owns the newer value.
  const latest=cachedConfidence(id,normalized)
  if(latest?.revision!==cached?.revision)return {score:latest?.score??null,source:latest?.pending?'pending' as const:'saved' as const}
  const score=data?.confidence??null
  if(score!==null){if(!Number.isInteger(score)||score<1||score>5)throw new Error('Invalid saved rating');cache(id,normalized,{score,pending:false,revision:crypto.randomUUID()})}
  return {score,source:'saved' as const}
}
