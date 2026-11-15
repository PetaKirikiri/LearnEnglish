import {getPlaybackMode,playbackRateFor,type PlaybackMode} from './usePlaybackMode'
import {loadAudioWaveform,waveformAtTime,type AudioWaveform} from './audioWaveform'
import {alignAudio} from './alignAudio'
import {kokoroAudio} from './kokoroAudio'
import manifest from '../race/generatedPracticeAudio.json'
import {sentenceKey} from '../race/generatedPracticeContent'
import {parseSentenceTiming,wordAtTime,type SentenceTiming,type SpokenWord} from './sentenceTiming'
export type AudioSentence={whiteboard?:import('../learning/sentenceMatrix/LanguageQuadrant').LanguageDocument;recipe?:unknown;id:string;document:{english:string};audioUrl?:string;timingUrl?:string}
const spokenKey=(text:string)=>text.normalize('NFC').trim().replace(/\s+/g,' ')
const ready=new Map<string,{url:string;waveform:AudioWaveform|null;timing?:SentenceTiming}>()
const pending=new Map<string,Promise<void>>()
const existing=(q:AudioSentence)=>q.audioUrl||(manifest as Record<string,string>)[sentenceKey(q.document.english)]
/** Background calls deliberately do no synthesis or paid provider requests. */
export async function prepareSentenceAudio(_questions:readonly AudioSentence[]){void _questions}
async function prepareForPlayback(q:AudioSentence){
 const key=spokenKey(q.document.english)
 if(ready.has(key)&&(!q.timingUrl||ready.get(key)?.timing))return
 const old=pending.get(key);if(old)return old
 const work=(async()=>{
  const url=existing(q)||await kokoroAudio(key)
  const waveform=await loadAudioWaveform(url)
  let timing:SentenceTiming|undefined
  if(q.timingUrl){
   const response=await fetch(q.timingUrl)
   if(!response.ok)throw new Error('Alignment unavailable')
   timing=parseSentenceTiming(await response.json(),q.document.english)??undefined
   if(!timing)throw new Error('Alignment does not match sentence')
   if(waveform)waveform.timing=timing
  }
  timing??=await alignAudio(url,q.document.english).catch(()=>undefined)
  if(waveform)waveform.timing=timing
  ready.set(key,{url,waveform,timing})
 })()
 pending.set(key,work)
 try{await work}finally{pending.delete(key)}
}
export type PlaybackCallbacks={started:()=>void;ended:()=>void;error:(reason?:'sign-in'|'unavailable')=>void;word?:(word:SpokenWord|null)=>void;waveform?:(level:number,time:number,progress?:number,recording?:AudioWaveform)=>void}
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

/** Generate only the sentence the learner explicitly plays; no device speech. */
export function playTimedSentence(q:AudioSentence,callbacks:PlaybackCallbacks,mode:PlaybackMode=getPlaybackMode()){
 let stopped=false,stop:(()=>void)|undefined
 void prepareForPlayback(q).then(()=>{
  if(!stopped)stop=playSentenceAudio(q,callbacks,mode)
 }).catch(()=>{if(!stopped)callbacks.error('unavailable')})
 return()=>{stopped=true;stop?.()}
}
