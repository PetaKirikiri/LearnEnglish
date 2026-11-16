import {cachedKokoro} from './kokoroCache'
import {canonicalWhiteboardSentence} from '../src/audio/whiteboardSentence'
import {registerPracticeQuestion} from './registerPracticeQuestion'
import type {IncomingMessage,ServerResponse} from 'node:http'
import {createClient} from '@supabase/supabase-js'
import {canonicalPracticeQuestion} from './practiceQuestionCatalogue'

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
  if(!token&&!context?.localDevelopment)return send(401,{error:'Sign in required'})
  const auth=token?await db.auth.getUser(token):{data:{user:{id:'00000000-0000-4000-8000-000000000005'}},error:null}
  const user=auth.data
  if(auth.error||!user.user)return send(401,{error:'Sign in required'})
  const question=canonicalPracticeQuestion((body as {id?:string})?.id??'',(body as {recipe?:unknown})?.recipe)
  const document=question?.document??whiteboard
  if(!document)return send(400,{error:'Unknown lesson sentence'})
  const q={document,audioUrl:question?.audioUrl}
  if((body as {registerOnly?:boolean}).registerOnly===true){if(!question)return send(400,{error:'Unknown practice question'});await registerPracticeQuestion(db,question);return send(200,{registered:question.id})}
  const result=await cachedKokoro(db,q.document.english)
  return send(200,{...result,provider:'kokoro'})
 }catch(error){console.warn('Server sentence audio failed',error instanceof Error?error.message:'unknown');return send(503,{error:'Audio unavailable'})}
}
