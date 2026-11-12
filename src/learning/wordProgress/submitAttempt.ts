import {supabase} from '../../lib/supabase'

/** Only a durable database receipt permits removing an answer from the outbox. */
export async function submitAttempt(source:'word'|'number',payload:Record<string,unknown>){
 const first=await supabase.rpc('submit_english_attempt',{p_source:source,p_payload:payload})
 let data=first.data
 const error=first.error
 if(error)throw error
 if(data?.accepted!==true || typeof data.receipt_id!=='string' || !data.receipt_id
  || data.client_id!==payload.p_id || !['received','needs_review','scored'].includes(data.status)){
  throw new Error('Answer receipt not confirmed')
 }
 if(source==='word'&&data.status!=='scored'&&typeof payload.p_question==='string'&&/^(compose-v2-|identify-v2-)/.test(payload.p_question)){
  const session=await supabase.auth.getSession(),token=session.data.session?.access_token
  if(!token)throw new Error('Sign in to finish saving progress')
  const response=await fetch('/api/sentence-audio',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({id:payload.p_question,registerOnly:true}),signal:AbortSignal.timeout(55000)})
  if(!response.ok||(await response.json()).registered!==payload.p_question)throw new Error('Could not register the practice question')
  const scored=await supabase.rpc('submit_english_attempt',{p_source:source,p_payload:payload})
  if(scored.error)throw scored.error
  if(scored.data?.status!=='scored'||scored.data.accepted!==true||scored.data.client_id!==payload.p_id||scored.data.receipt_id!==data.receipt_id)throw new Error('Answer saved; progression is still being processed')
  data=scored.data
 }
 return data
}
