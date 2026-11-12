import {act} from 'react'
import {createRoot} from 'react-dom/client'
import {expect,it,vi} from 'vitest'
import DrawingHost from './DrawingGame'
import type {Game} from './game'
const hook=vi.hoisted(()=>({useDrawingGame:vi.fn()}))
vi.mock('./game',()=>hook)
vi.mock('./DrawingJoin',()=>({default:()=>null}))
const base:Game={active:true,round:0,phase:'lobby',deadline:null,serverNow:new Date().toISOString(),artist:null,revealed:false,vote:null,voteCount:0,drawings:['a','b','c'].map((id)=>({artist:id,name:id,thai:null,english:null,picture:'data:image/png;base64,AA',submitted:true,awarded:null,winner:false})),scores:[]}
it('runs teacher start, individual question and answer, then a complete Thai voting gallery',async()=>{
 const el=document.createElement('div'),root=createRoot(el),action=vi.fn().mockResolvedValue(true)
 async function show(game:Game){hook.useDrawingGame.mockReturnValue({game,error:'',busy:false,act:action,offset:{current:0}});await act(async()=>root.render(<DrawingHost sessionId="class"/>))}
 const button=(text:string)=>[...el.querySelectorAll<HTMLButtonElement>('button')].find(b=>b.textContent?.replace(/→$/,'').trim()===text.replace(/→$/,'').trim())!
 await show(base);expect(el.textContent).not.toMatch(/Join the class|class QR|Drawing time|players online/);expect(el.querySelector('.dg-duration')).toBeNull();await act(async()=>button('Start drawing').click());expect(action).toHaveBeenCalledWith('start',{round:0,seconds:60})
 for(const artist of ['a','b','c']){
  const game={...base,phase:'guessing' as const,round:1,artist}
  await show(game);expect(el.querySelector('.dg-question .dg-sentence-boxes')?.getAttribute('aria-label')).toBe('What is this?');expect(el.querySelectorAll('.dg-picture')).toHaveLength(1);expect(el.querySelector('.dg-picture')?.getAttribute('alt')).toBe(`Drawing by ${artist}`);expect(el.querySelector('.dg-answer .dg-sentence-boxes')?.getAttribute('aria-label')).toBe('That is a / an …')
  await show({...game,revealed:true,drawings:game.drawings.map(d=>d.artist===artist?{...d,english:'a book',awarded:'b'}:d)});expect(el.querySelector('.dg-answer .dg-sentence-boxes')?.getAttribute('aria-label')).toBe('That is a book.')
  await act(async()=>button('Next →').click());expect(action).toHaveBeenLastCalledWith('next',{round:1,artist})
 }
 await show({...base,round:1,phase:'voting'});expect(el.textContent).toContain('ใครวาดภาพได้ดีที่สุด?');expect(el.querySelectorAll('.dg-gallery .dg-picture')).toHaveLength(3)
 await act(async()=>button('Finish voting').click());expect(action).toHaveBeenLastCalledWith('finish',{round:1})
 await act(async()=>root.unmount())
})
it('shows finish order from recorded ranks and marks Last only when everyone finishes',async()=>{
 const el=document.createElement('div'),root=createRoot(el)
 const game={...base,phase:'guessing' as const,round:1,artist:'a',drawings:base.drawings.map((d,i)=>({...d,finishRank:[3,1,2][i]}))}
 hook.useDrawingGame.mockReturnValue({game,error:'',busy:false,act:vi.fn(),offset:{current:0}})
 await act(async()=>root.render(<DrawingHost sessionId="class"/>))
 expect([...el.querySelectorAll('.dg-finish-order strong')].map(e=>e.textContent)).toEqual(['b','c','a'])
 expect(el.querySelector('[data-last=true] strong')?.textContent).toBe('a')
 expect(el.querySelector('.dg-game-header')).toBeNull()
 expect(el.querySelectorAll('.dg-question .tonight-slot')).toHaveLength(3)
 hook.useDrawingGame.mockReturnValue({game:{...game,drawings:game.drawings.map(d=>d.artist==='a'?{...d,finishRank:undefined}:d)},error:'',busy:false,act:vi.fn(),offset:{current:0}})
 await act(async()=>root.render(<DrawingHost sessionId="class"/>))
 expect(el.querySelector('[data-last=true]')).toBeNull()
 await act(async()=>root.unmount())
})
