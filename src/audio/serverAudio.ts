import {supabase} from '../lib/supabase'
import type {AudioSentence} from './sentenceAudio'
export async function serverAudio(q:AudioSentence):Promise<{url:string;timingUrl?:string}>{
 let timer:ReturnType<typeof setTimeout>|undefined
 const session=await Promise.race([supabase.auth.getSession(),new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new Error('Session unavailable')),5000)})]).finally(()=>clearTimeout(timer))
 const token=session.data.session?.access_token
 const response=await fetch('/api/sentence-audio',{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify({id:q.id,recipe:q.recipe,whiteboard:q.whiteboard}),signal:AbortSignal.timeout(60000)})
 if(!response.ok)throw new Error('Server audio unavailable')
 const value=await response.json() as {url?:string;timingUrl?:string}
 if(!value.url)throw new Error('Server returned no audio')
 return {url:value.url,timingUrl:value.timingUrl}
}
