// @vitest-environment happy-dom
import {afterEach,expect,it,vi} from 'vitest'
vi.mock('../lib/supabase',()=>({supabase:{auth:{getSession:vi.fn().mockResolvedValue({data:{session:{access_token:'test'}}})}}}))
import {playSentenceAudio,prepareSentenceAudio} from './sentenceAudio'
afterEach(()=>vi.unstubAllGlobals())
const q={id:'test-q',document:{english:'A test sentence not in the recordings.'}}
it('uses recordings first and never requests generation during playback',()=>{
 const fetch=vi.fn();vi.stubGlobal('fetch',fetch);const speak=vi.fn();vi.stubGlobal('speechSynthesis',{getVoices:()=>[],speak,cancel:vi.fn()})
 let ended=()=>{};vi.stubGlobal('Audio',class{onended?:()=>void;onplaying?:()=>void;constructor(public src:string){}pause(){}play(){this.onplaying?.();ended=()=>this.onended?.();return Promise.resolve()}})
 const callbacks={started:vi.fn(),ended:vi.fn(),error:vi.fn()};playSentenceAudio({...q,audioUrl:'/audio/existing.wav'},callbacks);ended()
 expect(callbacks.started).toHaveBeenCalledOnce();expect(callbacks.ended).toHaveBeenCalledOnce();expect(speak).not.toHaveBeenCalled();expect(fetch).not.toHaveBeenCalled()
})
it('uses only a local English voice and cancels when leaving the question',()=>{
 const local={lang:'en-GB',localService:true},speak=vi.fn(),cancel=vi.fn()
 vi.stubGlobal('speechSynthesis',{getVoices:()=>[{lang:'en-US',localService:false},local],speak,cancel});vi.stubGlobal('SpeechSynthesisUtterance',class{constructor(public text:string){}})
 const stop=playSentenceAudio(q,{started:vi.fn(),ended:vi.fn(),error:vi.fn()});expect(speak.mock.calls[0][0].voice).toBe(local);stop();expect(cancel).toHaveBeenCalledTimes(2)
})
it('deduplicates concurrent preparation and reuses generated audio',async()=>{
 const fetch=vi.fn().mockResolvedValue({ok:true,json:async()=>({url:'/cached/test.mp3'})});vi.stubGlobal('fetch',fetch)
 await Promise.all([prepareSentenceAudio([q,q]),prepareSentenceAudio([q])]);expect(fetch).toHaveBeenCalledTimes(1)
 await prepareSentenceAudio([q]);expect(fetch).toHaveBeenCalledTimes(1)
})

it('passes the ingredient recipe to background preparation without changing playback',async()=>{
 const recipe={version:1,ingredients:'reviewed fixture'},question={id:'recipe-audio',document:{english:'Recipe transport test.'},recipe}
 const fetch=vi.fn().mockResolvedValue({ok:true,json:async()=>({status:'unavailable'})});vi.stubGlobal('fetch',fetch)
 await prepareSentenceAudio([question])
 expect(fetch).toHaveBeenCalledWith('/api/sentence-audio',expect.objectContaining({body:JSON.stringify({id:question.id,recipe})}))
})
