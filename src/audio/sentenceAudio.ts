import {getPlaybackMode,type PlaybackMode} from './usePlaybackMode'
import {loadAudioWaveform,waveformAtTime,type AudioWaveform} from './audioWaveform'
import {supabase} from '../lib/supabase'
import manifest from '../race/generatedPracticeAudio.json'
import {sentenceKey} from '../race/generatedPracticeContent'
import {parseSentenceTiming,wordAtTime,type SentenceTiming,type SpokenWord} from './sentenceTiming'
export type AudioSentence={whiteboard?:import('../learning/sentenceMatrix/LanguageQuadrant').LanguageDocument;recipe?:unknown;id:string;document:{english:string};audioUrl?:string}
const localPreview=()=>import.meta.env.DEV&&import.meta.env.MODE!=='test'&&['localhost','127.0.0.1','[::1]'].includes(window.location.hostname)
const spokenKey=(text:string)=>text.normalize('NFC').trim().replace(/\s+/g,' ')
const ready=new Map<string,{url:string;timing:SentenceTiming;waveform:AudioWaveform|null}>(),pending=new Map<string,Promise<void>>(),retryAfter=new Map<string,number>()
let activeRequests=0
const waiting:Array<()=>void>=[]
async function acquire(){if(activeRequests>=2)await new Promise<void>(resolve=>waiting.push(resolve));else activeRequests++}
function release(){const next=waiting.shift();if(next)next();else activeRequests--}
const existing=(q:AudioSentence)=>q.audioUrl||(manifest as Record<string,string>)[sentenceKey(q.document.english)]
/** Background preparation replaces untimed recordings. Two workers bound spend/concurrency. */
export async function prepareSentenceAudio(questions:readonly AudioSentence[]){
 const queue=[...new Map(questions.slice(0,16).map(q=>[spokenKey(q.document.english),q])).values()]
 const {data}=await supabase.auth.getSession();const token=data.session?.access_token
 if(!token&&!localPreview())return
 async function worker(){for(let q;(q=queue.shift());){
  const key=spokenKey(q.document.english)
  if(ready.has(key)||(retryAfter.get(key)??0)>Date.now())continue
  const old=pending.get(key);if(old){await old;continue}
  const id=q.id
  const work=(async()=>{await acquire();try{
   const response=await fetch('/api/sentence-audio',{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify({id,...(q.recipe?{recipe:q.recipe}:{}),...(q.whiteboard?{whiteboard:q.whiteboard}:{})}),signal:AbortSignal.timeout(55000)})
   if(!response.ok)throw new Error('Audio unavailable')
   const result=await response.json() as {url?:string;timingUrl?:string}
   if(!result.url||!result.timingUrl)throw new Error('Timed audio unavailable')
   const timingResponse=await fetch(result.timingUrl,{signal:AbortSignal.timeout(10000),cache:'no-cache'})
   if(!timingResponse.ok)throw new Error('Timing unavailable')
   const timing=parseSentenceTiming(await timingResponse.json(),q.document.english)
   if(!timing)throw new Error('Timing does not match the sentence')
   ready.set(key,{url:result.url,timing,waveform:await loadAudioWaveform(result.url)})
  }catch{retryAfter.set(key,Date.now()+30000)}finally{pending.delete(key);release()}})()
  pending.set(key,work);await work
 }}
 await Promise.all([worker(),worker()])
}
export type PlaybackCallbacks={started:()=>void;ended:()=>void;error:(reason?:'sign-in'|'unavailable')=>void;word?:(word:SpokenWord|null)=>void;waveform?:(level:number,time:number)=>void}
export function playSentenceAudio(q:AudioSentence,callbacks:PlaybackCallbacks,mode:PlaybackMode=getPlaybackMode()):()=>void{
 let stopped=false,player:HTMLAudioElement|undefined,frame:number|undefined
 let current:SpokenWord|null=null,started=false
 const highlight=(word:SpokenWord|null)=>{
  if(word?.start===current?.start&&word?.end===current?.end)return
  current=word;callbacks.word?.(word)
 }
 const clearMotion=()=>{
  if(frame!==undefined){window.cancelAnimationFrame(frame);frame=undefined}
  highlight(null);callbacks.waveform?.(0,0)
 }
 const clear=()=>{
  clearMotion()
 }
 const completed=()=>{if(!stopped){clear();callbacks.ended()}}
 const failed=()=>{if(!stopped){clear();callbacks.error()}}
 const begin=()=>{if(!stopped&&!started){started=true;callbacks.started()}}
 const cached=ready.get(spokenKey(q.document.english))
 const url=cached?.url||existing(q)
 if(url){
  player=new Audio(url)
  player.playbackRate=mode==='slow'?.7:1
  player.preservesPitch=true
  const sync=()=>{
   if(stopped)return
   if(cached)highlight(wordAtTime(cached.timing,player!.currentTime))
   callbacks.waveform?.(cached?.waveform?waveformAtTime(cached.waveform,player!.currentTime):0,player!.currentTime)
  }
  const resume=()=>{void player!.play().catch(()=>{if(!stopped)failed()})}
  const tick=()=>{
   sync()
   if(stopped||player!.paused||player!.ended)return
   frame=window.requestAnimationFrame(tick)
  }
  player.onplaying=()=>{if(stopped)return;begin();clear();tick()}
  player.ontimeupdate=sync;player.onseeked=sync
  player.onpause=clearMotion;player.onwaiting=clearMotion;player.onended=completed;player.onerror=failed
  resume()
 }else failed()
 return()=>{stopped=true;clear();player?.pause()}
}

/** Prepare the same timed recording before playback; never substitute device speech. */
export function playTimedSentence(q:AudioSentence,callbacks:PlaybackCallbacks,mode:PlaybackMode=getPlaybackMode()){
 let stopped=false,stop:(()=>void)|undefined
 void supabase.auth.getSession().then(async({data})=>{
  if(stopped)return
  if(!data.session&&!localPreview()){callbacks.error('sign-in');return}
  await prepareSentenceAudio([q])
  if(stopped)return
  if(!ready.has(spokenKey(q.document.english))){callbacks.error();return}
  stop=playSentenceAudio(q,callbacks,mode)
 }).catch(()=>{if(!stopped)callbacks.error()})
 return()=>{stopped=true;stop?.()}
}
