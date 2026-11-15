// @vitest-environment happy-dom
import {afterEach,expect,it,vi} from 'vitest'
vi.mock('../lib/supabase',()=>({supabase:{auth:{getSession:vi.fn().mockResolvedValue({data:{session:{access_token:'test'}}})}}}))
import {timingFromAlignment} from './sentenceTiming'
import {playSentenceAudio,playTimedSentence,prepareSentenceAudio} from './sentenceAudio'
afterEach(()=>vi.unstubAllGlobals())
const q={id:'test-q',document:{english:'A test sentence not in the recordings.'}}
it('uses recordings first and never requests generation during playback',()=>{
 const fetch=vi.fn();vi.stubGlobal('fetch',fetch);const speak=vi.fn();vi.stubGlobal('speechSynthesis',{getVoices:()=>[],speak,cancel:vi.fn()})
 let ended=()=>{};vi.stubGlobal('Audio',class{onended?:()=>void;onplaying?:()=>void;src:string;constructor(src:string){this.src=src}pause(){}play(){this.onplaying?.();ended=()=>this.onended?.();return Promise.resolve()}})
 const callbacks={started:vi.fn(),ended:vi.fn(),error:vi.fn()};playSentenceAudio({...q,audioUrl:'/audio/existing.wav'},callbacks);ended()
 expect(callbacks.started).toHaveBeenCalledOnce();expect(callbacks.ended).toHaveBeenCalledOnce();expect(speak).not.toHaveBeenCalled();expect(fetch).not.toHaveBeenCalled()
})
it('reports unavailable audio without substituting a browser robot voice',()=>{
 const speak=vi.fn();vi.stubGlobal('speechSynthesis',{getVoices:()=>[{lang:'en-GB',localService:true}],speak,cancel:vi.fn()})
 const callbacks={started:vi.fn(),ended:vi.fn(),error:vi.fn()}
 playSentenceAudio(q,callbacks)
 expect(callbacks.error).toHaveBeenCalledOnce();expect(speak).not.toHaveBeenCalled()
})
it('deduplicates concurrent preparation and reuses generated audio',async()=>{
 const timing=timingFromAlignment(q.document.english,{characters:[...q.document.english],character_start_times_seconds:[...q.document.english].map((_,i)=>i*.1),character_end_times_seconds:[...q.document.english].map((_,i)=>(i+1)*.1)})
 const fetch=vi.fn().mockResolvedValueOnce({ok:true,json:async()=>({url:'/cached/test.mp3',timingUrl:'/cached/test.timing.json'})}).mockResolvedValue({ok:true,json:async()=>timing});vi.stubGlobal('fetch',fetch)
 await Promise.all([prepareSentenceAudio([q,q]),prepareSentenceAudio([q])]);expect(fetch).toHaveBeenCalledTimes(2)
 await prepareSentenceAudio([q]);expect(fetch).toHaveBeenCalledTimes(2)
})

it('passes the ingredient recipe to background preparation without changing playback',async()=>{
 const recipe={version:1,ingredients:'reviewed fixture'},question={id:'recipe-audio',document:{english:'Recipe transport test.'},recipe}
 const fetch=vi.fn().mockResolvedValue({ok:true,json:async()=>({status:'unavailable'})});vi.stubGlobal('fetch',fetch)
 await prepareSentenceAudio([question])
 expect(fetch).toHaveBeenCalledWith('/api/sentence-audio',expect.objectContaining({body:JSON.stringify({id:question.id,recipe})}))
})

it('replaces untimed recordings and follows playback time, seeking, pause, replay and stop',async()=>{
 const question={id:'karaoke',document:{english:"I see my dog and my dog."},audioUrl:'/old.wav'}
 const text=question.document.english
 const timing=timingFromAlignment(text,{characters:[...text],character_start_times_seconds:[...text].map((_,i)=>i*.1),character_end_times_seconds:[...text].map((_,i)=>(i+1)*.1)})!
 const fetch=vi.fn().mockResolvedValueOnce({ok:true,json:async()=>({url:'/new.mp3',timingUrl:'/new.timing.json'})}).mockResolvedValueOnce({ok:true,json:async()=>timing})
 vi.stubGlobal('fetch',fetch)
 await prepareSentenceAudio([question])
 let player:any
 vi.stubGlobal('Audio',class{
  currentTime=0;paused=false;ended=false;onplaying?:()=>void;ontimeupdate?:()=>void;onseeked?:()=>void;onpause?:()=>void;onended?:()=>void
  src:string;constructor(src:string){this.src=src;player=this}
  pause(){this.paused=true;this.onpause?.()}
  play(){this.paused=false;this.onplaying?.();return Promise.resolve()}
 })
 const callbacks={started:vi.fn(),ended:vi.fn(),error:vi.fn(),word:vi.fn()}
 const stop=playSentenceAudio(question,callbacks)
 expect(player.src).toBe('/new.mp3')
 const repeated=timing.words[5]
 player.currentTime=repeated.startTime-.06;player.ontimeupdate()
 expect(callbacks.word).toHaveBeenLastCalledWith({start:repeated.start,end:repeated.end})
 player.currentTime=0;player.onseeked()
 expect(callbacks.word).toHaveBeenLastCalledWith({start:0,end:1})
 player.pause();expect(callbacks.word).toHaveBeenLastCalledWith(null)
 player.play();expect(callbacks.started).toHaveBeenCalledTimes(1)
 player.onended();expect(callbacks.ended).toHaveBeenCalledOnce()
 stop()
 expect(fetch).toHaveBeenCalledTimes(2)
})
it('plays the full slow sentence continuously without inserting pauses or changing pitch',async()=>{
 const question={id:'slow-playback',document:{english:'I am going to the hotel.'}}
 const text=question.document.english
 const timing=timingFromAlignment(text,{characters:[...text],character_start_times_seconds:[...text].map((_,i)=>i*.1),character_end_times_seconds:[...text].map((_,i)=>(i+1)*.1)})!
 vi.stubGlobal('fetch',vi.fn().mockResolvedValueOnce({ok:true,json:async()=>({url:'/slow.mp3',timingUrl:'/slow.json'})}).mockResolvedValueOnce({ok:true,json:async()=>timing}))
 await prepareSentenceAudio([question])
 let player:any
 vi.stubGlobal('Audio',class{
  src:string;currentTime=0;paused=false;ended=false;playbackRate=1;preservesPitch=false
  onplaying?:()=>void;onpause?:()=>void
  constructor(src:string){this.src=src;player=this}
  pause(){this.paused=true;setTimeout(()=>this.onpause?.(),0)}
  play(){this.paused=false;this.onplaying?.();return Promise.resolve()}
 })
 vi.useFakeTimers()
 const callbacks={started:vi.fn(),ended:vi.fn(),error:vi.fn()}
 try{
  const stop=playSentenceAudio(question,callbacks,'slow')
  expect(player.playbackRate).toBe(.7)
  expect(player.preservesPitch).toBe(true)
  for(const word of timing.words.slice(0,-1)){
   player.currentTime=word.endTime+.001;player.onplaying()
   expect(player.paused).toBe(false)
   vi.advanceTimersByTime(180);expect(player.paused).toBe(false)
  }
  expect(callbacks.started).toHaveBeenCalledOnce()
  stop();vi.advanceTimersByTime(1000)
  expect(player.paused).toBe(true)
  expect(callbacks.ended).not.toHaveBeenCalled()
 }finally{vi.useRealTimers()}
})

it('waits for timed audio and cancels a pending playback without speaking',async()=>{
 const speak=vi.fn();vi.stubGlobal('speechSynthesis',{speak})
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({status:'unavailable'})}))
 const callbacks={started:vi.fn(),ended:vi.fn(),error:vi.fn()}
 const stop=playTimedSentence({id:'waiting',document:{english:'Waiting for a timed file.'}},callbacks)
 stop();await new Promise(resolve=>setTimeout(resolve,0))
 expect(speak).not.toHaveBeenCalled();expect(callbacks.started).not.toHaveBeenCalled();expect(callbacks.error).not.toHaveBeenCalled()
})
