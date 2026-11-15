// @vitest-environment happy-dom
import {afterEach,expect,it,vi} from 'vitest'
vi.mock('./kokoroAudio',()=>({kokoroAudio:vi.fn().mockResolvedValue('/kokoro.wav')}))
vi.mock('./audioWaveform',()=>({loadAudioWaveform:vi.fn().mockResolvedValue({interval:1,levels:[.5,.5]}),waveformAtTime:()=>.5}))
vi.mock('./alignAudio',()=>({alignAudio:vi.fn(async(_url:string,text:string)=>({version:1,text,words:[...text.matchAll(/[a-z]+/gi)].map((m,i)=>({text:m[0],start:m.index,end:m.index!+m[0].length,startTime:10+i,endTime:11+i}))}))}))
import {alignAudio} from './alignAudio'
import {kokoroAudio} from './kokoroAudio'
import {playTimedSentence,prepareSentenceAudio} from './sentenceAudio'
afterEach(()=>{vi.useRealTimers();vi.unstubAllGlobals();vi.clearAllMocks()})
const flush=async()=>{for(let i=0;i<12;i++)await Promise.resolve()}
it('does not generate or call paid APIs during background preparation',async()=>{
 const fetch=vi.fn();vi.stubGlobal('fetch',fetch)
 await prepareSentenceAudio([{id:'forecast',document:{english:'Unheard forecast sentence.'}}])
 expect(fetch).not.toHaveBeenCalled();expect(kokoroAudio).not.toHaveBeenCalled()
})
it('generates on demand, sweeps with media position, preserves slow pitch, and reuses audio',async()=>{
 let player:any
 vi.stubGlobal('Audio',class{
  currentTime=0;duration=4;paused=true;ended=false;playbackRate=1;preservesPitch=false
  onplaying?:()=>void;ontimeupdate?:()=>void;onpause?:()=>void
  constructor(public src:string){player=this}
  play(){this.paused=false;this.onplaying?.();return Promise.resolve()}
  pause(){this.paused=true;this.onpause?.()}
 })
 const q={id:'local',document:{english:'An uncached Kokoro integration sentence.'}}
 const callbacks={started:vi.fn(),ended:vi.fn(),error:vi.fn(),waveform:vi.fn(),word:vi.fn()}
 const stop=playTimedSentence(q,callbacks,'slow');await flush()
 expect(player.src).toBe('/kokoro.wav');expect(player.playbackRate).toBe(.55);expect(player.preservesPitch).toBe(true)
 player.currentTime=2;player.ontimeupdate()
 expect(callbacks.waveform).toHaveBeenLastCalledWith(.5,2,.5,expect.objectContaining({levels:[.5,.5]}))
 stop();expect(callbacks.word).not.toHaveBeenCalled()
 const replay=playTimedSentence(q,callbacks);await flush()
 expect(kokoroAudio).toHaveBeenCalledTimes(1);replay()
})
it('cancels playback while synthesis is still pending',async()=>{
 vi.mocked(kokoroAudio).mockImplementationOnce(()=>new Promise(()=>{}))
 const player={play:vi.fn().mockResolvedValue(undefined),pause:vi.fn()}
 const audio=vi.fn(function(){return player});vi.stubGlobal('Audio',audio)
 const stop=playTimedSentence({id:'cancel',document:{english:'Cancelled local synthesis.'}},{started:vi.fn(),ended:vi.fn(),error:vi.fn()})
 stop();await flush();expect(audio).toHaveBeenCalledOnce();expect(player.pause).toHaveBeenCalled()
})
it('uses automatic word boundaries rather than evenly dividing the recording',async()=>{
 const timing={version:1,text:'I am',words:[{text:'I',start:0,end:1,startTime:.1,endTime:.2},{text:'am',start:2,end:4,startTime:.22,endTime:.8}]}
 const fetch=vi.fn().mockResolvedValue({ok:true,json:async()=>timing});vi.stubGlobal('fetch',fetch)
 let player:any
 vi.stubGlobal('Audio',class{
  currentTime=0;duration=1;paused=true;ended=false;playbackRate=1;preservesPitch=true
  onplaying?:()=>void;ontimeupdate?:()=>void;onpause?:()=>void
  constructor(){player=this}play(){this.paused=false;this.onplaying?.();return Promise.resolve()}pause(){this.paused=true;this.onpause?.()}
 })
 const callbacks={started:vi.fn(),ended:vi.fn(),error:vi.fn(),word:vi.fn()}
 const stop=playTimedSentence({id:'aligned',document:{english:'I am'},audioUrl:'/aligned.wav',timingUrl:'/aligned.timing.json'},callbacks)
 await flush();player.currentTime=.24;player.ontimeupdate()
 expect(callbacks.word).toHaveBeenLastCalledWith({start:2,end:4})
 player.currentTime=.9;player.ontimeupdate();expect(callbacks.word).toHaveBeenLastCalledWith(null)
 stop()
})

it('starts audio even while alignment is pending',async()=>{
 vi.mocked(alignAudio).mockImplementationOnce(()=>new Promise(()=>{}))
 let player:any
 vi.stubGlobal('Audio',class{
  currentTime=0;duration=2;paused=true;ended=false
  onplaying?:()=>void;onpause?:()=>void
  constructor(public src:string){player=this}pause(){this.paused=true;this.onpause?.()}play(){this.paused=false;this.onplaying?.();return Promise.resolve()}
 })
 const callbacks={started:vi.fn(),ended:vi.fn(),error:vi.fn()}
 const stop=playTimedSentence({id:'pending-alignment',document:{english:'Audio must not wait for alignment.'},audioUrl:'/working.wav'},callbacks)
 await flush();expect(player.src).toBe('/working.wav');expect(callbacks.started).toHaveBeenCalledOnce();stop()
})
it('retries a failed existing recording with Kokoro on the same unlocked player',async()=>{
 const sources:string[]=[]
 vi.stubGlobal('Audio',class{
  currentTime=0;duration=2;paused=true;ended=false
  onplaying?:()=>void;onpause?:()=>void
  constructor(public src:string){}pause(){this.paused=true;this.onpause?.()}
  play(){sources.push(this.src);if(this.src==='/missing.wav')return Promise.reject(new Error('Media unavailable'));this.paused=false;this.onplaying?.();return Promise.resolve()}
 })
 const callbacks={started:vi.fn(),ended:vi.fn(),error:vi.fn()}
 const stop=playTimedSentence({id:'fallback',document:{english:'Broken recording falls back to Kokoro.'},audioUrl:'/missing.wav'},callbacks)
 await flush();await flush()
 expect(sources[0]).toMatch(/^data:audio\/wav/)
 expect(sources).toContain('/missing.wav');expect(sources.at(-1)).toBe('/kokoro.wav')
 expect(kokoroAudio).toHaveBeenCalledWith('Broken recording falls back to Kokoro.',expect.any(Function))
 expect(callbacks.started).toHaveBeenCalledOnce();expect(callbacks.error).not.toHaveBeenCalled();stop()
})

it('clears loading and reports failure when the media element never starts',async()=>{
 vi.useFakeTimers()
 vi.stubGlobal('Audio',class{
  currentTime=0;duration=2;paused=true;ended=false
  constructor(public src:string){}pause(){}play(){return Promise.resolve()}
 })
 const callbacks={loading:vi.fn(),started:vi.fn(),ended:vi.fn(),error:vi.fn()}
 const stop=playTimedSentence({id:'stalled-media',document:{english:'Media startup must settle.'},audioUrl:'/stalled.wav'},callbacks)
 await vi.advanceTimersByTimeAsync(25000)
 expect(callbacks.started).not.toHaveBeenCalled()
 expect(callbacks.loading).toHaveBeenLastCalledWith(false)
 expect(callbacks.error).toHaveBeenCalledOnce()
 stop()
})

it('waits for successful media unlocking before changing the audio source',async()=>{
 let player:any,finishUnlock=()=>{},unlocked=false
 vi.stubGlobal('Audio',class{
  currentTime=0;duration=2;paused=true;ended=false;onplaying?:()=>void;onpause?:()=>void
  constructor(public src:string){player=this}pause(){this.paused=true;this.onpause?.()}
  play(){
   if(this.src.startsWith('data:'))return new Promise<void>(resolve=>{finishUnlock=()=>{unlocked=true;resolve()}})
   if(!unlocked)return Promise.reject(Object.assign(new Error('Gesture lost'),{name:'NotAllowedError'}))
   this.paused=false;this.onplaying?.();return Promise.resolve()
  }
 })
 const callbacks={started:vi.fn(),ended:vi.fn(),error:vi.fn()}
 const stop=playTimedSentence({id:'ordered-unlock',document:{english:'Wait for the unlock clip.'},audioUrl:'/unlocked.wav'},callbacks)
 await flush();expect(player.src).toMatch(/^data:/);expect(callbacks.started).not.toHaveBeenCalled()
 finishUnlock();await flush()
 expect(player.src).toBe('/unlocked.wav');expect(callbacks.started).toHaveBeenCalledOnce();expect(callbacks.error).not.toHaveBeenCalled();stop()
})
