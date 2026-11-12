import type {IncomingMessage,ServerResponse} from 'node:http'
import {createClient} from '@supabase/supabase-js'
/** Private, read-only diagnostic. Never bundled into a deployed API route. */
export function localDiagnosticRequest(req:IncomingMessage){
 const host=req.headers.host??'',address=req.socket.remoteAddress??''
 if(!/^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host)||!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(address))return false
 if(req.headers['sec-fetch-site']==='cross-site')return false
 if(req.headers.origin){try{if(new URL(req.headers.origin).host!==host)return false}catch{return false}}
 return true
}
export default async function vocabularyDiagnostics(req:IncomingMessage,res:ServerResponse){
 const send=(status:number,body:unknown)=>{res.statusCode=status;res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(body))}
 if(!localDiagnosticRequest(req))return send(403,{error:'Local diagnostic only'})
 if(req.method!=='POST')return send(405,{error:'POST required'})
 const url=process.env.VITE_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY||process.env.CITY_SUPABASE_SERVICE_KEY
 if(!url||!key)return send(503,{error:'Progress connection unavailable'})
 let learner:unknown
 try{let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>2048)return send(413,{error:'Request too large'})}learner=JSON.parse(raw).learner??null}catch{return send(400,{error:'Invalid request'})}
 try{
  const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}})
  const members=await db.from('english_success_members').select('learner_id');if(members.error)throw members.error
  const ids=members.data.map(m=>m.learner_id)
  const profiles=await db.from('profiles').select('id,display_name,is_admin').in('id',ids);if(profiles.error)throw profiles.error
  const students=profiles.data.map(p=>({id:p.id,name:p.display_name?.trim()||'Learner',teacher:!!p.is_admin})).sort((a,b)=>a.name.localeCompare(b.name))
  const selected=learner??students.find(s=>s.teacher&&s.name.toLowerCase()==='peta')?.id??students.find(s=>s.name.toLowerCase()==='peta')?.id
  if(typeof selected!=='string'||!students.some(s=>s.id===selected))return send(400,{error:'Unknown student'})
  const rows=[]
  for(let offset=0;;offset+=1000){
   const result=await db.from('english_word_progress').select('word_id,correct,attempts,listening_correct,direct_correct,last_practised,recent_results,fade_score,confirmation_count,proven_at,review_due_at,review_step,reviewed_at,lapsed_at,learning_updated_at,learning_version').eq('learner_id',selected).order('word_id').range(offset,offset+999)
   if(result.error)throw result.error
   rows.push(...result.data);if(result.data.length<1000)break
  }
  return send(200,{selected,students:students.map(({id,name})=>({id,name})),rows})
 }catch{return send(502,{error:'Could not load student progress'})}
}
