import {registerPracticeQuestion} from './registerPracticeQuestion'
import {createHash,randomUUID} from 'node:crypto'
import type {IncomingMessage,ServerResponse} from 'node:http'
import {createClient} from '@supabase/supabase-js'
import {canonicalPracticeQuestion} from './practiceQuestionCatalogue'
import manifest from '../src/race/generatedPracticeAudio.json'
import {sentenceKey} from '../src/race/generatedPracticeContent'
export function audioIdentity(text:string,voice:string,model:string){return createHash('sha256').update(JSON.stringify({text:text.normalize('NFC').trim().replace(/\s+/g,' '),voice,model,language:'en',format:'mp3_44100_128',settings:{stability:.5,similarity_boost:.75,speed:.9}})).digest('hex')}
export default async function handler(req:IncomingMessage&{body?:unknown},res:ServerResponse){
 const send=(status:number,body:unknown)=>{res.statusCode=status;res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(body))}
 if(req.method!=='POST')return send(405,{error:'POST required'})
 const url=process.env.VITE_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY||process.env.CITY_SUPABASE_SERVICE_KEY
 if(!url||!key)return send(503,{error:'Audio unavailable'})
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}})
 const token=req.headers.authorization?.replace(/^Bearer /,'')
 if(!token)return send(401,{error:'Sign in required'})
 const {data:user,error:authError}=await db.auth.getUser(token)
 if(authError||!user.user)return send(401,{error:'Sign in required'})
 try{
  let body=req.body
  if(body===undefined){let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>2048)return send(413,{error:'Request too large'})}body=JSON.parse(raw)}
  if(typeof body==='string')body=JSON.parse(body)
  const q=canonicalPracticeQuestion((body as {id?:string})?.id??'')
  if(!q)return send(400,{error:'Unknown lesson sentence'})
  if((body as {registerOnly?:boolean}).registerOnly===true){await registerPracticeQuestion(db,q);return send(200,{registered:q.id})}
  const recording=q.audioUrl||(manifest as Record<string,string>)[sentenceKey(q.document.english)]
  if(recording)return send(200,{url:recording})
  const voice=process.env.ELEVENLABS_VOICE_ID,model=process.env.ELEVENLABS_MODEL_ID||'eleven_multilingual_v2',apiKey=process.env.ELEVENLABS_API_KEY
  if(!voice)return send(200,{status:'unavailable'})
  const hash=audioIdentity(q.document.english,voice,model),owner=randomUUID()
  const path=`${hash}.mp3`,publicUrl=db.storage.from('sentence-audio').getPublicUrl(path).data.publicUrl
  if(!apiKey){const cached=await db.from('english_sentence_audio').select('status').eq('key',hash).maybeSingle();return send(200,cached.data?.status==='ready'?{url:publicUrl}:{status:'unavailable'})}
  const {data:claim,error}=await db.rpc('claim_sentence_audio',{p_key:hash,p_text:q.document.english,p_owner:owner,p_learner:user.user.id})
  if(error)throw error
  if(claim==='ready')return send(200,{url:publicUrl})
  if(claim!=='claimed')return send(200,{status:'pending'})
  try{
   // Recover an upload completed before a previous worker lost its response.
   const found=await db.storage.from('sentence-audio').download(path)
   if(!found.error&&found.data){await db.rpc('finish_sentence_audio',{p_key:hash,p_owner:owner,p_success:true,p_quota:false});return send(200,{url:publicUrl})}
   const response=await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice)}?output_format=mp3_44100_128`,{method:'POST',headers:{'xi-api-key':apiKey,'Content-Type':'application/json'},body:JSON.stringify({text:q.document.english,model_id:model,language_code:'en',voice_settings:{stability:.5,similarity_boost:.75,speed:.9}}),signal:AbortSignal.timeout(40000)})
   if(!response.ok){await db.rpc('finish_sentence_audio',{p_key:hash,p_owner:owner,p_success:false,p_quota:[401,402,403,429].includes(response.status)});return send(200,{status:'unavailable'})}
   if(!response.headers.get('content-type')?.startsWith('audio/'))throw new Error('Invalid audio')
   const bytes=Buffer.from(await response.arrayBuffer());if(bytes.length<100)throw new Error('Empty audio')
   const upload=await db.storage.from('sentence-audio').upload(path,bytes,{contentType:'audio/mpeg',upsert:true,cacheControl:'31536000'});if(upload.error)throw upload.error
   const done=await db.rpc('finish_sentence_audio',{p_key:hash,p_owner:owner,p_success:true,p_quota:false});if(done.error)throw done.error
   return send(200,{url:publicUrl})
  }catch{await db.rpc('finish_sentence_audio',{p_key:hash,p_owner:owner,p_success:false,p_quota:false});return send(200,{status:'unavailable'})}
 }catch{return send(503,{error:'Audio unavailable'})}
}
