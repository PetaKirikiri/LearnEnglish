import {silentPlaybackUrl,unlockAudio} from './unlockAudio'
import {getPlaybackMode,playbackRateFor,type PlaybackMode} from './usePlaybackMode'
import {loadAudioWaveform,waveformAtTime,type AudioWaveform} from './audioWaveform'
import {serverAudio} from './serverAudio'
import manifest from '../race/generatedPracticeAudio.json'
import {sentenceKey} from '../race/generatedPracticeContent'
import {parseSentenceTiming,wordAtTime,type SentenceTiming,type SpokenWord} from './sentenceTiming'
export type AudioSentence={whiteboard?:import('../learning/sentenceMatrix/LanguageQuadrant').LanguageDocument;recipe?:unknown;id:string;document:{english:string};audioUrl?:string;timingUrl?:string}
const spokenKey=(text:string)=>text.normalize('NFC').trim().replace(/\s+/g,' ')
const ready=new Map<string,{url:string;waveform:AudioWaveform|null;timing?:SentenceTiming;file?:Promise<void>;preparation?:Promise<void>}>()
const pending=new Map<string,Promise<void>>()
const existing=(q:AudioSentence)=>q.audioUrl||(manifest as Record<string,string>)[sentenceKey(q.document.english)]
/** Silently warm only the requested candidates; failures never affect the current turn. */
export async function prepareSentenceAudio(questions:readonly AudioSentence[]){
 const unique=[...new Map(questions.map(q=>[spokenKey(q.document.english),q])).values()]
 await Promise.allSettled(unique.map(async q=>{
  await prepareForPlayback(q)
  await ready.get(spokenKey(q.document.english))?.preparation
 }))
}
async function prepareForPlayback(q:AudioSentence,forceKokoro=false){
 const key=spokenKey(q.document.english)
 if(!forceKokoro&&ready.has(key))return
 const requestKey=(forceKokoro?'kokoro:':'')+key
 const old=pending.get(requestKey);if(old)return old
 const work=(async()=>{
  let recording:{url:string;timingUrl?:string}
  if(q.audioUrl&&q.timingUrl&&!forceKokoro)recording={url:q.audioUrl,timingUrl:q.timingUrl}
  else try{recording=await serverAudio(q)}catch(error){const fallback=!forceKokoro&&existing(q);if(!fallback)throw error;recording={url:fallback}}
  const {url,timingUrl}=recording
  const entry:{url:string;waveform:AudioWaveform|null;timing?:SentenceTiming;file?:Promise<void>;preparation?:Promise<void>}={url,waveform:null}
  ready.set(key,entry)
  // Audio starts independently. Optional animation preparation must never block it.
  entry.file=(async()=>{
   // Keep the actual prepared bytes: a later media request must not fetch the WAV again.
   try{
    const response=await fetch(url,{cache:'force-cache',signal:AbortSignal.timeout(15000)})
    if(response.ok)entry.url=URL.createObjectURL(await response.blob())
   }catch{/* Retain the saved URL if local file preparation is unavailable. */}
  })()
  entry.preparation=Promise.all([
   entry.file.then(async()=>{entry.waveform=await loadAudioWaveform(entry.url)}),
   (async()=>{
    if(!timingUrl)return
    try{
     const response=await fetch(timingUrl,{cache:'force-cache',signal:AbortSignal.timeout(5000)})
     if(response.ok)entry.timing=parseSentenceTiming(await response.json(),q.document.english)??undefined
    }catch{/* A missing sidecar does not prevent audio playback. */}
   })(),
  ]).then(()=>{if(entry.waveform)entry.waveform.timing=entry.timing}).catch(()=>{/* Audio playback remains independent of animation availability. */})
  // Bound retained phone memory while keeping the current and both next branches ready.
  while(ready.size>64){const oldest=ready.keys().next().value!;const evicted=ready.get(oldest);ready.delete(oldest);void evicted?.preparation?.finally(()=>{if(evicted.url.startsWith('blob:'))URL.revokeObjectURL(evicted.url)})}

 })()
 pending.set(requestKey,work)
 try{await work}finally{pending.delete(requestKey)}
}
export type PlaybackCallbacks={loading?:(loading:boolean,status?:string)=>void;started:()=>void;ended:()=>void;error:(reason?:'sign-in'|'unavailable'|'blocked')=>void;word?:(word:SpokenWord|null)=>void;waveform?:(level:number,time:number,progress?:number,recording?:AudioWaveform)=>void}
export function playSentenceAudio(q:AudioSentence,callbacks:PlaybackCallbacks,mode:PlaybackMode=getPlaybackMode(),unlockedPlayer?:HTMLAudioElement):()=>void{
 let stopped=false,player:HTMLAudioElement|undefined,frame:number|undefined
 let current:SpokenWord|null=null,started=false
 let startup:ReturnType<typeof setTimeout>|undefined
 const highlight=(word:SpokenWord|null)=>{
  if(word?.start===current?.start&&word?.end===current?.end)return
  current=word;callbacks.word?.(word)
 }
 const clearMotion=()=>{
  if(frame!==undefined){window.cancelAnimationFrame(frame);frame=undefined}
  highlight(null);callbacks.waveform?.(0,0)
 }
 const clear=()=>{
  clearTimeout(startup)
  clearMotion()
 }
 const completed=()=>{if(!stopped){clear();callbacks.ended()}}
 const failed=(reason?:'blocked')=>{if(!stopped){clear();callbacks.error(reason)}}
 const begin=()=>{clearTimeout(startup);if(!stopped&&!started){started=true;callbacks.started()}}
 const cached=ready.get(spokenKey(q.document.english))
 const url=cached?.url||existing(q)
 if(url){
  player=unlockedPlayer??new Audio(url)
  if(unlockedPlayer)player.src=url
  player.playbackRate=playbackRateFor(mode)
  player.preservesPitch=true
  const sync=()=>{
   if(stopped)return
   // Follow the media clock so pause, seeking and slow mode stay synchronized.
   const visualTime=player!.currentTime

   // Media position drives energy; measured word boundaries drive box selection.
   const progress=Number.isFinite(player!.duration)&&player!.duration>0?Math.min(.999999,visualTime/player!.duration):0
   callbacks.waveform?.(cached?.waveform?waveformAtTime(cached.waveform,visualTime):0,visualTime,progress,cached?.waveform??undefined)
   highlight(cached?.timing?wordAtTime(cached.timing,visualTime):null)
  }
  const resume=()=>{void player!.play().catch(error=>{if(!stopped)failed(error?.name==='NotAllowedError'?'blocked':undefined)})}
  const tick=()=>{
   sync()
   if(stopped||player!.paused||player!.ended)return
   frame=window.requestAnimationFrame(tick)
  }
  player.onplaying=()=>{if(stopped)return;begin();clear();tick()}
  player.ontimeupdate=sync;player.onseeked=sync
  player.onpause=clearMotion;player.onwaiting=clearMotion;player.onended=completed;player.onerror=()=>failed()
  startup=setTimeout(()=>{player?.pause();failed()},12000)
  resume()
 }else failed()
 return()=>{stopped=true;clear();player?.pause()}
}

/** Unlock on the tap itself, before local model loading loses Safari's gesture. */
const silentWav=silentPlaybackUrl()
export function playTimedSentence(q:AudioSentence,callbacks:PlaybackCallbacks,mode:PlaybackMode=getPlaybackMode()){
 let stopped=false,stop:(()=>void)|undefined,retried=false,didStart=false
 callbacks.loading?.(true,'Loading audio…')
 const player=new Audio(silentWav)
 const unlocked=unlockAudio(player)
 const start=()=>{
  if(stopped)return
  stop=playSentenceAudio(q,{...callbacks,started:()=>{callbacks.loading?.(false);if(!didStart){didStart=true;callbacks.started()}},error:reason=>{
   if(stopped)return
   if(reason==='blocked'||retried||!existing(q)){callbacks.loading?.(false);callbacks.error(reason);return}
   retried=true;callbacks.loading?.(true);stop?.()
   void prepareForPlayback(q,true).then(start).catch(()=>{if(!stopped){callbacks.loading?.(false);callbacks.error('unavailable')}})
  }},mode,player)
 }
 void Promise.all([prepareForPlayback(q,false).then(()=>ready.get(spokenKey(q.document.english))?.file),unlocked]).then(start).catch(()=>{if(!stopped){callbacks.loading?.(false);callbacks.error('unavailable')}})
 return()=>{stopped=true;stop?.();player.pause();callbacks.loading?.(false)}
}
