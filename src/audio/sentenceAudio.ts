import {supabase} from '../lib/supabase'
import manifest from '../race/generatedPracticeAudio.json'
import {sentenceKey} from '../race/generatedPracticeContent'
export type AudioSentence={recipe?:unknown;id:string;document:{english:string};audioUrl?:string}
const spokenKey=(text:string)=>text.normalize('NFC').trim().replace(/\s+/g,' ')
const ready=new Map<string,string>(),pending=new Map<string,Promise<void>>(),retryAfter=new Map<string,number>()
let activeRequests=0
const waiting:Array<()=>void>=[]
async function acquire(){if(activeRequests>=2)await new Promise<void>(resolve=>waiting.push(resolve));else activeRequests++}
function release(){const next=waiting.shift();if(next)next();else activeRequests--}
const existing=(q:AudioSentence)=>q.audioUrl||(manifest as Record<string,string>)[sentenceKey(q.document.english)]
/** Background work only. Playback never waits for generation. Two workers bound spend/concurrency. */
export async function prepareSentenceAudio(questions:readonly AudioSentence[]){
 const queue=[...new Map(questions.slice(0,16).map(q=>[spokenKey(q.document.english),q])).values()]
 const {data}=await supabase.auth.getSession();const token=data.session?.access_token
 if(!token)return
 async function worker(){for(let q;(q=queue.shift());){
  const key=spokenKey(q.document.english)
  if(existing(q)||ready.has(key)||(retryAfter.get(key)??0)>Date.now())continue
  const old=pending.get(key);if(old){await old;continue}
  const id=q.id
  const work=(async()=>{await acquire();try{
   const response=await fetch('/api/sentence-audio',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({id,...(q.recipe?{recipe:q.recipe}:{})}),signal:AbortSignal.timeout(55000)})
   if(!response.ok)throw new Error('Audio unavailable')
   const result=await response.json() as {url?:string}
   if(result.url)ready.set(key,result.url);else retryAfter.set(key,Date.now()+30000)
  }catch{retryAfter.set(key,Date.now()+60000)}finally{pending.delete(key);release()}})()
  pending.set(key,work);await work
 }}
 await Promise.all([worker(),worker()])
}
export type PlaybackCallbacks={started:()=>void;ended:()=>void;error:()=>void}
export function playSentenceAudio(q:AudioSentence,callbacks:PlaybackCallbacks):()=>void{
 let stopped=false,player:HTMLAudioElement|undefined,utterance:SpeechSynthesisUtterance|undefined,fallingBack=false
 const local=()=>{
  if(stopped||fallingBack)return;fallingBack=true
  if(!('speechSynthesis' in window)){callbacks.error();return}
  const voices=window.speechSynthesis.getVoices().filter(v=>v.localService&&/^en(?:-|$)/i.test(v.lang))
  // Do not silently choose a remote voice when the fallback promises on-device speech.
  const voice=voices.find(v=>/^en-GB$/i.test(v.lang))??voices[0]
  if(!voice){callbacks.error();return}
  utterance=new SpeechSynthesisUtterance(q.document.english);utterance.voice=voice;utterance.lang=voice.lang;utterance.rate=.9
  utterance.onstart=()=>{if(!stopped)callbacks.started()};utterance.onend=()=>{if(!stopped)callbacks.ended()};utterance.onerror=()=>{if(!stopped)callbacks.error()}
  window.speechSynthesis.cancel();window.speechSynthesis.speak(utterance)
 }
 const url=existing(q)||ready.get(spokenKey(q.document.english))
 if(url){player=new Audio(url);player.onplaying=()=>{if(!stopped)callbacks.started()};player.onended=()=>{if(!stopped)callbacks.ended()};player.onerror=local;void player.play().catch(error=>{if(stopped)return;if(error?.name==='NotAllowedError')callbacks.error();else local()})}else local()
 return()=>{stopped=true;player?.pause();if(utterance)window.speechSynthesis.cancel()}
}
