// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import {afterEach,expect,it,vi} from 'vitest'
vi.mock('../lib/supabase',()=>({supabase:{auth:{getSession:async()=>({data:{session:null}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})}}}))
vi.mock('../auth/homeworkLine',()=>({recogniseHomeworkAccount:async()=>null}))
import WordBattle from './WordBattle'
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true})
let dispose=()=>{}
afterEach(()=>{dispose();vi.useRealTimers();vi.restoreAllMocks();localStorage.clear()})
it('buys words directly into slots, scores on ticks, moves them and refreshes for one gold',async()=>{
 vi.useFakeTimers()
 const host=document.createElement('div');document.body.append(host);const root=createRoot(host)
 dispose=()=>{act(()=>root.unmount());host.remove()}
 await act(async()=>root.render(<WordBattle/>))
 function click(label:string){const el=host.querySelector(`[aria-label="${label}"]`) as HTMLButtonElement;expect(el,label).toBeTruthy();act(()=>el.click())}
 act(()=>[...host.querySelectorAll('button')].find(el=>el.textContent==='Play')!.click())
 click('Buy the for 1 gold');click('Slot 1');click('Buy dog for 1 gold');click('Slot 2')
 expect(host.querySelector('.wt-controls strong')?.textContent).toBe('● 6')
 expect(host.querySelectorAll('.wt-slot.good')).toHaveLength(2)
 act(()=>vi.advanceTimersByTime(10000))
 expect(host.querySelector('.wt-controls strong')?.textContent).toBe('● 8')
 const source=host.querySelector('[data-slot="1"]') as HTMLButtonElement
 const destination=host.querySelector('[data-slot="4"]') as HTMLButtonElement
 source.setPointerCapture=()=>{}
 document.elementFromPoint=()=>destination
 act(()=>{source.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:1,clientX:10,clientY:10}));source.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,pointerId:1,clientX:80,clientY:80}))})
 expect(host.querySelector('.wt-drag-ghost')?.textContent).toContain('dog')
 expect(destination.className).toContain('drop-target')
 act(()=>source.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:1,clientX:80,clientY:80})))
 expect(host.querySelector('.wt-drag-ghost')).toBeNull()
 expect(host.querySelectorAll('.wt-slot.bad')).toHaveLength(2)
 act(()=>[...host.querySelectorAll('button')].find(el=>el.textContent==='↻ 1')!.click())
 expect(host.querySelector('.wt-controls strong')?.textContent).toBe('● 7')
 expect(host.querySelectorAll('.wt-shop.you button:not(:disabled)')).toHaveLength(4)
 expect(host.textContent).not.toContain('Commit')
})
