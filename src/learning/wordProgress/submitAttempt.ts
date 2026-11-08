import {supabase} from '../../lib/supabase'

/** Only a durable database receipt permits removing an answer from the outbox. */
export async function submitAttempt(source:'word'|'number',payload:Record<string,unknown>){
 const {data,error}=await supabase.rpc('submit_english_attempt',{p_source:source,p_payload:payload})
 if(error)throw error
 if(data?.accepted!==true || typeof data.receipt_id!=='string' || !data.receipt_id
  || data.client_id!==payload.p_id || !['received','needs_review','scored'].includes(data.status)){
  throw new Error('Answer receipt not confirmed')
 }
 return data
}
