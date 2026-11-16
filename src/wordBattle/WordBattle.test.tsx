// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import {afterEach,expect,it,vi} from 'vitest'
vi.mock('../lib/supabase',()=>({supabase:{auth:{getSession:async()=>({data:{session:null}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})}}}))
vi.mock('../auth/homeworkLine',()=>({recogniseHomeworkAccount:async()=>null}))
import WordBattle from './WordBattle'
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true})
let dispose=()=>{}
afterEach(()=>{dispose();vi.useRealTimers();localStorage.clear()})
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
 click('Slot 2: dog');click('Slot 5')
 expect(host.querySelectorAll('.wt-slot.bad')).toHaveLength(2)
 act(()=>[...host.querySelectorAll('button')].find(el=>el.textContent==='↻ 1')!.click())
 expect(host.querySelector('.wt-controls strong')?.textContent).toBe('● 7')
 expect(host.querySelectorAll('.wt-shop.you button:not(:disabled)')).toHaveLength(3)
 expect(host.textContent).not.toContain('Commit')
})
