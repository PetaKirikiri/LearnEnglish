import {canonicalWhiteboardSentence} from '../src/audio/whiteboardSentence'
import {timingFromAlignment,parseSentenceTiming} from '../src/audio/sentenceTiming'
import {registerPracticeQuestion} from './registerPracticeQuestion'
import {createHash,randomUUID} from 'node:crypto'
import type {IncomingMessage,ServerResponse} from 'node:http'
import {createClient} from '@supabase/supabase-js'
import {canonicalPracticeQuestion} from './practiceQuestionCatalogue'
import manifest from '../src/race/generatedPracticeAudio.json'
import {sentenceKey} from '../src/race/generatedPracticeContent'
export function audioIdentity(text:string,voice:string,model:string){return createHash('sha256').update(JSON.stringify({text:text.normalize('NFC').trim().replace(/\s+/g,' '),voice,model,language:'en',format:'mp3_44100_128',settings:{stability:.5,similarity_boost:.75,speed:1},timingVersion:1})).digest('hex')}
export default async function handler(req:IncomingMessage&{body?:unknown},res:ServerResponse,context?:{localDevelopment?:boolean}){
 const send=(status:number,body:unknown)=>{res.statusCode=status;res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(body))}
 if(req.method!=='POST')return send(405,{error:'POST required'})
 const url=process.env.VITE_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY||process.env.CITY_SUPABASE_SERVICE_KEY
 if(!url||!key)return send(503,{error:'Audio unavailable'})
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}})
 const token=req.headers.authorization?.replace(/^Bearer /,'')
 try{
  let body=req.body
  if(body===undefined){let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>8192)return send(413,{error:'Request too large'})}body=JSON.parse(raw)}
  if(typeof body==='string')body=JSON.parse(body)
  const whiteboard=canonicalWhiteboardSentence((body as {whiteboard?:unknown})?.whiteboard)
  if(!token&&(!whiteboard&&!context?.localDevelopment||(body as {registerOnly?:boolean})?.registerOnly))return send(401,{error:'Sign in required'})
  const auth=token?await db.auth.getUser(token):{data:{user:{id:'00000000-0000-4000-8000-000000000005'}},error:null}
  const user=auth.data
  if(auth.error||!user.user)return send(401,{error:'Sign in required'})
  const question=canonicalPracticeQuestion((body as {id?:string})?.id??'',(body as {recipe?:unknown})?.recipe)
  const document=question?.document??whiteboard
  if(!document)return send(400,{error:'Unknown lesson sentence'})
  const q={document,audioUrl:question?.audioUrl}
  if((body as {registerOnly?:boolean}).registerOnly===true){if(!question)return send(400,{error:'Unknown practice question'});await registerPracticeQuestion(db,question);return send(200,{registered:question.id})}
  const recording=q.audioUrl||(manifest as Record<string,string>)[sentenceKey(q.document.english)]
  const voice=process.env.ELEVENLABS_VOICE_ID,model=process.env.ELEVENLABS_MODEL_ID||'eleven_multilingual_v2',apiKey=process.env.ELEVENLABS_API_KEY
  if(!voice)return send(200,recording?{url:recording}:{status:'unavailable'})
  const hash=audioIdentity(q.document.english,voice,model),owner=randomUUID()
  const path=`${hash}.mp3`,publicUrl=db.storage.from('sentence-audio').getPublicUrl(path).data.publicUrl
  const timingPath=`${hash}.timing.json`,timingUrl=db.storage.from('sentence-audio').getPublicUrl(timingPath).data.publicUrl
  const bucket=db.storage.from('sentence-audio')
  if(!apiKey||!token&&!context?.localDevelopment){const cached=await db.from('english_sentence_audio').select('status').eq('key',hash).maybeSingle();return send(200,cached.data?.status==='ready'?{url:publicUrl,timingUrl}:{status:'unavailable'})}
  const {data:claim,error}=await db.rpc('claim_sentence_audio',{p_key:hash,p_text:q.document.english,p_owner:owner,p_learner:user.user.id})
  if(error)throw error
  if(claim==='ready')return send(200,{url:publicUrl,timingUrl})
  if(claim!=='claimed')return send(200,{status:'pending'})
  try{
   // Recover only a complete timed recording after an interrupted upload.
   const [found,savedTiming]=await Promise.all([bucket.download(path),bucket.download(timingPath)])
   if(!found.error&&found.data&&!savedTiming.error&&savedTiming.data){
    try{
     const metadata=JSON.parse(await savedTiming.data.text())
     if(parseSentenceTiming(metadata,q.document.english)&&metadata.audioSha256===createHash('sha256').update(Buffer.from(await found.data.arrayBuffer())).digest('hex')){
      const recovered=await db.rpc('finish_sentence_audio',{p_key:hash,p_owner:owner,p_success:true,p_quota:false})
      if(recovered.error)throw recovered.error
      return send(200,{url:publicUrl,timingUrl})
     }
    }catch{/* Incomplete or invalid timing requires a new ElevenLabs recording. */}
   }
   const response=await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice)}/with-timestamps?output_format=mp3_44100_128`,{method:'POST',headers:{'xi-api-key':apiKey,'Content-Type':'application/json'},body:JSON.stringify({text:q.document.english,model_id:model,language_code:'en',voice_settings:{stability:.5,similarity_boost:.75,speed:1}}),signal:AbortSignal.timeout(40000)})
   if(!response.ok){await db.rpc('finish_sentence_audio',{p_key:hash,p_owner:owner,p_success:false,p_quota:[401,402,403,429].includes(response.status)});return send(200,{status:'unavailable'})}
   const result=await response.json() as {audio_base64?:string;alignment?:unknown;normalized_alignment?:unknown}
   if(typeof result.audio_base64!=='string')throw new Error('Invalid audio')
   const bytes=Buffer.from(result.audio_base64,'base64');if(bytes.length<100)throw new Error('Empty audio')
   const timing=timingFromAlignment(q.document.english,result.alignment)??timingFromAlignment(q.document.english,result.normalized_alignment)
   if(!timing)throw new Error('Timing does not match the sentence')
   const saved=await bucket.upload(timingPath,Buffer.from(JSON.stringify({...timing,audioSha256:createHash('sha256').update(bytes).digest('hex')})),{contentType:'application/json',upsert:true,cacheControl:'0'});if(saved.error)throw saved.error
   const upload=await db.storage.from('sentence-audio').upload(path,bytes,{contentType:'audio/mpeg',upsert:true,cacheControl:'31536000'});if(upload.error)throw upload.error
   const done=await db.rpc('finish_sentence_audio',{p_key:hash,p_owner:owner,p_success:true,p_quota:false});if(done.error)throw done.error
   return send(200,{url:publicUrl,timingUrl})
  }catch{await db.rpc('finish_sentence_audio',{p_key:hash,p_owner:owner,p_success:false,p_quota:false});return send(200,{status:'unavailable'})}
 }catch{return send(503,{error:'Audio unavailable'})}
}
