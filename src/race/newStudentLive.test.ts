// @vitest-environment happy-dom
// Explicit opt-in: creates and removes one temporary Auth account against the
// configured service. Uses the real client, outbox, RPC, progress loader and audio handler.
import {expect,it} from 'vitest'
import {config} from 'dotenv'
import {readFileSync} from 'node:fs'
import {resolve} from 'node:path'
import recordings from './generatedPracticeAudio.json'
import {sentenceKey} from './generatedPracticeContent'
import {createClient} from '@supabase/supabase-js'
import type {IncomingMessage,ServerResponse} from 'node:http'
import {supabase} from '../lib/supabase'
import {queueAttempt,flushWordAttempts,loadWordProgress,pendingAttempts} from '../learning/wordProgress/store'
import {WORD_RULE_VERSION} from '../learning/wordProgress/model'
import {lessonPracticeTemplate} from './lessonPracticeTemplate'
import {nextPersonalQuestion} from './practiceForecast'
import {curriculumBaseline,loadEvidence,saveEvidence,evidenceScores} from './generatedPracticeProgress'

it.skipIf(process.env.RUN_LIVE_STUDENT_SMOKE!=='1')('signs a fresh student in, saves real action answers, reloads progress and requests authenticated audio',async()=>{
 config({path:'.env.local',quiet:true})
 const url=import.meta.env.VITE_SUPABASE_URL,anon=import.meta.env.VITE_SUPABASE_ANON_KEY,key=process.env.SUPABASE_SERVICE_ROLE_KEY
 expect(Boolean(url&&anon&&key),'required server configuration').toBe(true)
 const admin=createClient(url,key!,{auth:{persistSession:false,autoRefreshToken:false,storageKey:'readiness-admin'}})
 const email=`readiness-${crypto.randomUUID()}@example.com`,password=crypto.randomUUID()+'Aa1!'
 const created=await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{name:'Temporary readiness verification'}})
 if(created.error)throw new Error('Temporary account creation failed: '+created.error.message)
 const user=created.data.user!
 try{
  const signed=await supabase.auth.signInWithPassword({email,password})
  expect(signed.error).toBeNull();expect(signed.data.user?.id).toBe(user.id)
  expect(await loadWordProgress(user.id)).toEqual([])
  const template=lessonPracticeTemplate(4)
  let first:ReturnType<typeof nextPersonalQuestion>|undefined
  for(let index=0;index<12;index++){
   const rows=await loadWordProgress(user.id),events=loadEvidence(user.id)
   const q=nextPersonalQuestion(template.level,rows,events,'live-new-student',index,{...template.options,familiar:curriculumBaseline(rows,events,user.id)})
   if(!first||(!q.audioUrl&&!(recordings as Record<string,string>)[sentenceKey(q.document.english)]))first=q
   expect(q.document.units.some(u=>u.role==='action')).toBe(true)
   expect(q.document.units.some(u=>u.role==='object')).toBe(true)
   const id=crypto.randomUUID(),at=new Date().toISOString()
   queueAttempt(user.id,{id,questionId:q.id,version:q.version,answer:q.choices[q.correct],occurredAt:at,modality:'visible',replays:0,ruleVersion:WORD_RULE_VERSION})
   saveEvidence({id,questionId:q.id,level:template.level,sentence:q.document.english,targets:q.credit===null?[]:q.targetWords,vocabulary:q.vocabulary,correct:true,heard:true,hidden:false,assisted:false,plays:1,at},user.id)
   await flushWordAttempts(user.id)
   expect(pendingAttempts(user.id)).toEqual([])
  }
  const receipts=await supabase.from('english_attempt_inbox').select('status,error_message').eq('learner_id',user.id)
  expect(receipts.error).toBeNull();expect(receipts.data).toHaveLength(12)
  expect(receipts.data?.every(r=>r.status==='scored'),JSON.stringify(receipts.data)).toBe(true)
  const earned=await loadWordProgress(user.id)
  expect(earned.some(r=>['en:holding','en:opening','en:using'].includes(r.word_id)&&r.correct>0)).toBe(true)
  expect(earned.some(r=>['en:phone','en:phones','en:bag','en:bags'].includes(r.word_id)&&r.correct>0)).toBe(true)
  await supabase.auth.signOut()
  expect((await supabase.auth.signInWithPassword({email,password})).error).toBeNull()
  const reloaded=await loadWordProgress(user.id)
  expect(reloaded).toEqual(earned)
  for(const lesson of [1,6,4]){
   const next=lessonPracticeTemplate(lesson),events=loadEvidence(user.id)
   const q=nextPersonalQuestion(next.level,reloaded,events,'live-return',0,{...next.options,familiar:curriculumBaseline(reloaded,events,user.id)})
   expect(q.document.english.length).toBeGreaterThan(0)
   expect(evidenceScores(reloaded,events)).toEqual(evidenceScores(earned,events))
  }
  const {default:handler}=await import('../../server/sentenceAudio')
  const token=(await supabase.auth.getSession()).data.session!.access_token
  async function audio(){
   let status=0,body:{url?:string;status?:string}={}
   const res={set statusCode(value:number){status=value},setHeader(){},end(value:string){body=JSON.parse(value)}} as unknown as ServerResponse
   await handler({method:'POST',headers:{authorization:`Bearer ${token}`},body:{id:first!.id}} as IncomingMessage&{body:unknown},res)
   expect(status).toBe(200);expect(Boolean(body.url||body.status==='unavailable'||body.status==='pending')).toBe(true)
   return body
  }
  const audioResult=await audio()
  if(audioResult.url){
   if(audioResult.url.startsWith('/'))expect(readFileSync(resolve('public',audioResult.url.slice(1))).byteLength).toBeGreaterThan(100)
   else {
    const media=await fetch(audioResult.url);expect(media.ok).toBe(true)
    expect(media.headers.get('content-type')).toMatch(/audio\//)
    expect((await media.arrayBuffer()).byteLength).toBeGreaterThan(100)
   }
   expect((await audio()).url).toBe(audioResult.url)
  }
  console.log(JSON.stringify({verified:'real fresh account',savedAnswers:receipts.data?.length,allScored:true,reloadedProgress:true,lessonSwitches:[1,6,4],audio:audioResult.url?'playable recording and repeat cache hit':audioResult.status}))
 }finally{
  await supabase.auth.signOut()
  const deleted=await admin.auth.admin.deleteUser(user.id)
  expect(deleted.error,'temporary account cleanup').toBeNull()
  localStorage.clear()
 }
},120000)
