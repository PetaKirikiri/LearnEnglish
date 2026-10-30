// @vitest-environment happy-dom
import {act} from 'react'
import {createRoot,type Root} from 'react-dom/client'
import {afterEach,beforeEach,expect,it,vi} from 'vitest'
const load=vi.hoisted(()=>vi.fn())
vi.mock('./numberRecallStore',()=>({syncRecall:vi.fn().mockResolvedValue(undefined)}))
vi.mock('./practicePlacement',()=>({loadPracticeStartingRound:load}))
vi.mock('./NumberFoundationCourse',()=>({default:({minimumModule=1}:{minimumModule?:number})=><div>Round {minimumModule}</div>}))
import PhonePractice from './PhonePractice'
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true})
let host:HTMLDivElement,root:Root
beforeEach(()=>{load.mockReset();history.replaceState({},'', '/english/practice?lesson=1');host=document.createElement('div');root=createRoot(host)})
afterEach(async()=>{await act(async()=>root.unmount())})
it('waits for the incoming account score and opens the selected round',async()=>{
 let resolve!:(value:1|3)=>void
 load.mockReturnValue(new Promise<1|3>(done=>{resolve=done}))
 await act(async()=>root.render(<PhonePractice userId="returning"/>))
 expect(host.textContent).not.toContain('Round 1')
 expect(host.querySelector('[role="status"]')).not.toBeNull()
 await act(async()=>resolve(3))
 expect(host.textContent).toContain('Round 3')
 expect(load).toHaveBeenCalledWith('returning')
})
it('loads placement again when the signed-in account changes',async()=>{
 load.mockResolvedValueOnce(3).mockResolvedValueOnce(1)
 await act(async()=>root.render(<PhonePractice userId="experienced"/>))
 expect(host.textContent).toContain('Round 3')
 await act(async()=>root.render(<PhonePractice userId="new-student"/>))
 expect(host.textContent).toContain('Round 1')
 expect(load).toHaveBeenLastCalledWith('new-student')
})
it('retries score failures without starting a beginner attempt',async()=>{
 load.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(3)
 await act(async()=>root.render(<PhonePractice userId="returning"/>))
 expect(host.querySelector('[role="alert"]')).not.toBeNull()
 expect(host.textContent).not.toContain('Round 1')
 await act(async()=>host.querySelector('button')!.click())
 expect(host.textContent).toContain('Round 3')
 expect(load).toHaveBeenCalledTimes(2)
})
it('keeps local design previews available without a score request',async()=>{
 history.replaceState({},'', '/english/practice?preview=question&module=2')
 await act(async()=>root.render(<PhonePractice userId="designer"/>))
 expect(load).not.toHaveBeenCalled()
})
