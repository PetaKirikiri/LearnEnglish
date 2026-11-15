import {act} from 'react'
import {createRoot} from 'react-dom/client'
import {expect,it,vi} from 'vitest'
vi.mock('../lib/supabase',()=>({supabase:{auth:{getSession:async()=>({data:{session:{access_token:'test'}}})}}}))
vi.mock('./audioWaveform',()=>({loadAudioWaveform:async()=>({interval:1,levels:[.8,.8,.8,.8]}),waveformAtTime:()=>.8}))
import {quadrantLayout} from '../learning/sentenceMatrix/LanguageQuadrant'
import ExampleView from '../learning/sentenceMatrix/ExampleView'
import {timingFromAlignment} from './sentenceTiming'
it('plays whiteboard audio through the timed provider and activates THE and HOTEL separately',async()=>{
 Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true})
 const text='I am going to the hotel.'
 const units=[{english:'I',thai:'',role:'person' as const},{english:'am',thai:'',role:'be' as const},{english:'going',thai:'',role:'action' as const},{english:'to',thai:'',role:'preposition' as const},{english:'the',thai:'',role:'determiner' as const},{english:'hotel.',thai:'',role:'object' as const}]
 const timing=timingFromAlignment(text,{characters:[...text],character_start_times_seconds:[...text].map((_,i)=>i*.1),character_end_times_seconds:[...text].map((_,i)=>(i+1)*.1)})!
 const fetch=vi.fn().mockResolvedValueOnce({ok:true,json:async()=>({url:'/elevenlabs.mp3',timingUrl:'/elevenlabs.json'})}).mockResolvedValue({ok:true,json:async()=>timing})
 vi.stubGlobal('fetch',fetch);vi.stubGlobal('requestAnimationFrame',()=>1);vi.stubGlobal('cancelAnimationFrame',()=>{})
 const robot=vi.fn();vi.stubGlobal('speechSynthesis',{speak:robot})
 let player:any
 vi.stubGlobal('Audio',class{
  src:string;currentTime=0;paused=false;ended=false;onplaying?:()=>void;ontimeupdate?:()=>void
  constructor(src:string){this.src=src;player=this}pause(){}play(){this.onplaying?.();return Promise.resolve()}
 })
 const host=document.createElement('div'),root=createRoot(host)
 try{
  await act(async()=>root.render(<ExampleView matrix english={text} thai="" units={units} layout={quadrantLayout({english:text,thai:'',units,construction:'action-answer'})} translationControl={<button onClick={robot}>old speaker</button>}/>))
  await act(async()=>host.querySelector<HTMLButtonElement>('[aria-label="Fast speaking speed"]')!.click())
  expect(player.src).toBe('/elevenlabs.mp3');expect(robot).not.toHaveBeenCalled()
  expect(JSON.parse(fetch.mock.calls[0][1].body).whiteboard.english).toBe(text)
  for(const index of [4,5]){
   await act(async()=>{player.currentTime=timing.words[index].startTime+.01;player.ontimeupdate()})
   expect(host.querySelectorAll('.tonight-slot[data-speaking="true"]')).toHaveLength(1)
   expect(host.querySelector('.tonight-slot[data-speaking="true"]')?.getAttribute('data-unit-index')).toBe(String(index))
  }
 }finally{await act(async()=>root.unmount());vi.unstubAllGlobals()}
})
