vi.mock('./alignAudio',()=>({alignAudio:vi.fn(async(_url:string,text:string)=>({version:1,text,words:[]}))}))
import {act} from 'react'
import {createRoot} from 'react-dom/client'
import {expect,it,vi} from 'vitest'
vi.mock('../lib/supabase',()=>({supabase:{auth:{getSession:async()=>({data:{session:null}})}}}))
vi.mock('./audioWaveform',()=>({loadAudioWaveform:async()=>({interval:1,levels:[.8,.8,.8,.8]}),waveformAtTime:()=>.8}))
import {quadrantLayout} from '../learning/sentenceMatrix/LanguageQuadrant'
import ExampleView from '../learning/sentenceMatrix/ExampleView'
vi.mock('./serverAudio',()=>({serverAudio:vi.fn().mockResolvedValue({url:'/kokoro.wav'})}))
it('plays local whiteboard audio without pretending unaligned words have timings',async()=>{
 Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true})
 const text='I am going to the hotel.'
 const units=[{english:'I',thai:'',role:'person' as const},{english:'am',thai:'',role:'be' as const},{english:'going',thai:'',role:'action' as const},{english:'to',thai:'',role:'preposition' as const},{english:'the',thai:'',role:'determiner' as const},{english:'hotel.',thai:'',role:'object' as const}]
 const fetch=vi.fn()
 vi.stubGlobal('fetch',fetch);vi.stubGlobal('requestAnimationFrame',()=>1);vi.stubGlobal('cancelAnimationFrame',()=>{})
 const robot=vi.fn();vi.stubGlobal('speechSynthesis',{speak:robot})
 let player:any
 vi.stubGlobal('Audio',class{
  src:string;currentTime=0;duration=4;paused=false;ended=false;onplaying?:()=>void;ontimeupdate?:()=>void
  constructor(src:string){this.src=src;player=this}pause(){}play(){this.onplaying?.();return Promise.resolve()}
 })
 const host=document.createElement('div'),root=createRoot(host)
 try{
  await act(async()=>root.render(<ExampleView matrix english={text} thai="" units={units} layout={quadrantLayout({english:text,thai:'',units,construction:'action-answer'})} translationControl={<button onClick={robot}>old speaker</button>}/>))
  await act(async()=>host.querySelector<HTMLButtonElement>('[aria-label="Fast speaking speed"]')!.click())
  expect(player.src).toBe('/kokoro.wav');expect(robot).not.toHaveBeenCalled()
  expect(fetch).toHaveBeenCalledWith('/kokoro.wav',expect.objectContaining({cache:'force-cache'}))
  await act(async()=>{player.currentTime=2;player.ontimeupdate()})
  expect(host.querySelectorAll('.tonight-slot[data-speaking="true"]')).toHaveLength(0)

 }finally{await act(async()=>root.unmount());vi.unstubAllGlobals()}
})
