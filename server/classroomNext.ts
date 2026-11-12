import {registerPracticeQuestion} from './registerPracticeQuestion'
import {createClient} from '@supabase/supabase-js'
import type {IncomingMessage,ServerResponse} from 'node:http'
import type {ListeningEvidence} from '../src/race/generatedPracticeProgress'
import {classroomWordQuestion} from '../src/classroom/wordServer'
import type {ClassSession} from '../src/classroom/session'
import {wordTokens,type WordProgress} from '../src/learning/wordProgress/model'
export default async function handler(req:IncomingMessage&{body?:unknown},res:ServerResponse){
 res.setHeader('Cache-Control','no-store')
 if(req.method!=='POST'){res.statusCode=405;res.end();return}
 try{
  let body=req.body
  if(body===undefined){let text='';for await(const chunk of req){text+=chunk;if(text.length>8192)throw new Error('Request too large')}body=JSON.parse(text)}
  const input=typeof body==='string'?JSON.parse(body):body as Record<string,unknown>
  if(!input||typeof input.session!=='string'||typeof input.hostSecret!=='string'||input.hostSecret.length!==64)throw new Error('Teacher key required')
  const url=process.env.SUPABASE_URL||process.env.VITE_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY||process.env.CITY_SUPABASE_SERVICE_KEY
  if(!url||!key)throw new Error('Classroom word service is unavailable')
  const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}})
  const {data,error}=await db.rpc('english_classroom',{p_action:'state',p_session:input.session,p_payload:{hostSecret:input.hostSecret}})
  if(error||!data?.host)throw new Error('Teacher key required')
  const state=data as ClassSession
  if((state.turn?.id??'')!==input.previous)throw new Error('The turn changed. Refresh and try again.')
  const online=state.members.filter(m=>m.active&&Date.parse(m.lastSeen)>Date.now()-20000)
  if(!online.length)throw new Error('No students online')
  const least=Math.min(...online.map(m=>m.turns)),candidates=online.filter(m=>m.turns===least)
  const learner=candidates[Math.floor(Math.random()*candidates.length)]
  const rows:WordProgress[]=[]
  for(let offset=0;;offset+=1000){const result=await db.from('english_word_progress').select('*').eq('learner_id',learner.id).order('word_id').range(offset,offset+999);if(result.error)throw result.error;rows.push(...result.data);if(result.data.length<1000)break}
  const recent=await db.from('english_word_attempts').select('id,question_id,question_version,correct,occurred_at,modality,replays,english_word_questions(sentence,credit_sentence)').eq('learner_id',learner.id).order('occurred_at',{ascending:false}).limit(180)
  if(recent.error)throw recent.error
  const history:ListeningEvidence[]=recent.data.reverse().map(attempt=>{const source=attempt.english_word_questions as unknown as {sentence:string;credit_sentence:string|null};return {id:attempt.id,questionId:attempt.question_id,level:1,sentence:source.sentence,targets:source.credit_sentence?[...new Set([source.credit_sentence,...wordTokens(source.credit_sentence)])]:[],vocabulary:[],correct:attempt.correct,at:attempt.occurred_at,hidden:attempt.modality==='audio',heard:true,assisted:false,plays:attempt.replays+1}})
  // Persisted lifecycle rows are authoritative across devices and activities.
  const {question,scores}=classroomWordQuestion(input.lesson,learner.id,rows,history,learner.turns,`${state.id}:${input.previous}`)
  await registerPracticeQuestion(db,question)
  const result=await db.rpc('english_classroom',{p_action:'adaptive-next',p_session:state.id,p_payload:{hostSecret:input.hostSecret,previous:input.previous,learner:learner.id,question,scores}})
  if(result.error)throw result.error
  res.setHeader('Content-Type','application/json');res.end(JSON.stringify(result.data))
 }catch(error){res.statusCode=400;res.setHeader('Content-Type','application/json');res.end(JSON.stringify({error:error instanceof Error?error.message:'Could not select a question'}))}
}
