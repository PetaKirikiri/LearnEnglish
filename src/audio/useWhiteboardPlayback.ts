import {useEffect,useRef,useState} from 'react'
import {playTimedSentence,prepareSentenceAudio,type AudioSentence} from './sentenceAudio'
import type {SpokenWord} from './sentenceTiming'
import type {LanguageDocument} from '../learning/sentenceMatrix/LanguageQuadrant'

/** Reuse the preview's exact timing, waveform, and player with the authored matrix. */
export function useWhiteboardPlayback(document:LanguageDocument|undefined){
 const [word,setWord]=useState<SpokenWord|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(false)
 const wave=useRef({level:0,time:0}),stop=useRef<(()=>void)|undefined>(undefined)
 const key=document?.english
 const sentence:AudioSentence|undefined=document?{id:'whiteboard-timed',document,whiteboard:document}:undefined
 useEffect(()=>{
  setWord(null);setError('');setLoading(false);wave.current.level=0;wave.current.time=0
  if(sentence)void prepareSentenceAudio([sentence])
  return()=>{stop.current?.();stop.current=undefined}
  // Sentence selection, not playback frames, owns preparation and cancellation.
  // eslint-disable-next-line react-hooks/exhaustive-deps
 },[key])
 function play(){
  if(!sentence)return
  stop.current?.();setError('');setLoading(true)
  stop.current=playTimedSentence(sentence,{
   word:setWord,waveform:(level,time)=>{wave.current.level=level;wave.current.time=time},
   started:()=>setLoading(false),ended:()=>setLoading(false),error:reason=>{setLoading(false);setError(reason==='sign-in'?'Sign in to play ElevenLabs audio.':'Audio unavailable. Tap Slow or Fast to retry.')},
  })
 }
 return {play,error,loading,spokenWord:word,audioWave:wave.current}
}
