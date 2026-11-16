import {createHash} from 'node:crypto'
import type {SupabaseClient} from '@supabase/supabase-js'
import {parseSentenceTiming} from '../src/audio/sentenceTiming'
import {synthesizeKokoro} from './kokoroVoice'
export function kokoroIdentity(text:string){return createHash('sha256').update(JSON.stringify({text,voice:'af_heart',model:'Kokoro-82M-v1.0-q8',format:'pcm16',alignment:1})).digest('hex')}
const pending=new Map<string,Promise<{url:string;timingUrl?:string;cached:boolean}>>()
export async function cachedKokoro(db:SupabaseClient,text:string){
 const hash=kokoroIdentity(text),prefix=`kokoro-v1/${hash}`,pointer=`${prefix}.json`,bucket=db.storage.from('sentence-audio')
 const old=pending.get(hash);if(old)return old
 const task=(async()=>{
  const saved=await bucket.download(pointer)
  if(!saved.error&&saved.data){try{
   const value=JSON.parse(await saved.data.text()) as {text:string;audioPath:string;timingPath?:string}
   const valid=(path:string)=>new RegExp(`^${prefix}/[a-f0-9]{64}\\.(wav|timing\\.json)$`).test(path)
   if(value.text===text&&valid(value.audioPath)&&(!value.timingPath||valid(value.timingPath)))return {url:bucket.getPublicUrl(value.audioPath).data.publicUrl,timingUrl:value.timingPath?bucket.getPublicUrl(value.timingPath).data.publicUrl:undefined,cached:true}
  }catch{/* An incomplete cache is regenerated from the canonical sentence. */}}
  const {bytes,timing}=await synthesizeKokoro(text),audioHash=createHash('sha256').update(bytes).digest('hex'),audioPath=`${prefix}/${audioHash}.wav`,timingPath=timing?`${prefix}/${audioHash}.timing.json`:undefined
  const audio=await bucket.upload(audioPath,bytes,{contentType:'audio/wav',cacheControl:'31536000',upsert:true});if(audio.error)throw audio.error
  if(timingPath&&parseSentenceTiming(timing,text)){
   const savedTiming=await bucket.upload(timingPath,Buffer.from(JSON.stringify({...timing,audioSha256:audioHash})),{contentType:'application/json',cacheControl:'31536000',upsert:true});if(savedTiming.error)throw savedTiming.error
  }
  const metadata=await bucket.upload(pointer,Buffer.from(JSON.stringify({text,audioPath,timingPath})),{contentType:'application/json',cacheControl:'0',upsert:true});if(metadata.error)throw metadata.error
  return {url:bucket.getPublicUrl(audioPath).data.publicUrl,timingUrl:timingPath?bucket.getPublicUrl(timingPath).data.publicUrl:undefined,cached:false}
 })()
 pending.set(hash,task)
 try{return await task}finally{pending.delete(hash)}
}
