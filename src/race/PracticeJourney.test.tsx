// @vitest-environment happy-dom
import {act} from 'react'
import {createRoot} from 'react-dom/client'
import {beforeEach,expect,it,vi} from 'vitest'
vi.mock('./PracticeGold',()=>({default:()=>null}))
vi.mock('./NumberFoundationCourse',()=>({default:({initialLevel,onComplete,onExit}:{initialLevel:number;onComplete:(level:number,score:number,total:number,passed:boolean)=>void;onExit:()=>void})=><div><span>Run {initialLevel}</span><button onClick={()=>onComplete(initialLevel,30,30,true)}>Finish</button><button onClick={onExit}>Exit</button></div>}))
import PracticeJourney,{mergeRun,sample,levelPreview} from './PracticeJourney'
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true})
beforeEach(()=>{localStorage.clear();history.replaceState({},'','/english/practice');vi.stubGlobal('Audio',class{pause(){}play(){return Promise.resolve()}})})
it('opens the map, teaches the selected level, then records its result and keeps every level selectable',async()=>{
 const host=document.createElement('div'),root=createRoot(host)
 const click=async(text:string)=>act(async()=>[...host.querySelectorAll('button')].find(b=>b.textContent?.includes(text))!.click())
 try{
 await act(async()=>root.render(<PracticeJourney userId="test"/>))
 expect(host.querySelectorAll('.journey-node')).toHaveLength(5)
 expect(host.textContent).not.toContain('Run 1')
 await act(async()=>host.querySelector<HTMLButtonElement>('[aria-label^="Level 3:"]')!.click())
 expect(host.querySelector('.journey-tutorial')).not.toBeNull()
 expect(host.querySelectorAll('.example-source')).toHaveLength(4)
 await act(async()=>host.querySelectorAll<HTMLButtonElement>('.journey-demo-answers button')[1].click())
 expect(host.querySelector('[role="status"]')?.textContent).toBe('ลองอีกครั้ง')
 await click('เริ่มเล่น');expect(host.textContent).toContain('Run 3')
 await click('Finish');expect(host.textContent).toContain('ผ่านแล้ว!')
 await click('แผนที่');expect(host.querySelectorAll('.journey-node.cleared')).toHaveLength(1)
 expect(host.querySelectorAll('.journey-node:disabled')).toHaveLength(0)
 await act(async()=>root.render(<PracticeJourney userId="another"/>))
 expect(host.querySelectorAll('.journey-node.cleared')).toHaveLength(0)
 }finally{await act(async()=>root.unmount())}
})
it('keeps a cleared badge and the highest accuracy, without treating incomplete runs as clears',()=>{
 const old=mergeRun({}, {level:1,score:28,total:30,passed:true})
 expect(mergeRun(old,{level:1,score:2,total:30,passed:false})[1]).toEqual({best:28,total:30,cleared:true})
 expect(mergeRun({}, {level:2,score:0,total:0,passed:false})).toEqual({})
})
it('tutorial prompts and answers match each level task',()=>{
 expect(sample(1).document.english).toBe('the keys');expect(sample(1).correct).toBe(1)
 expect(sample(2).correct).toBe(1);expect(sample(3).correct).toBe(0)
 expect(sample(4).document.english).toBe('What are you doing?')
 expect(sample(5).document.english).toBe('I am eating an apple.')
})

it('previews the real question pools and run sizes rather than the clear target',()=>{
 expect(levelPreview(1)).toEqual({words:['hotel','phone','key','book','watch'],total:30})
 expect(levelPreview(2).words).toHaveLength(10)
 expect(levelPreview(3).total).toBe(30)
 expect(levelPreview(4).words).toContain('you')
 expect(levelPreview(4).total).toBe(7)
 expect(levelPreview(5).words).toContain('eating')
 expect(levelPreview(5).words).toContain('sleeping')
 expect(levelPreview(5).total).toBe(30)
})
