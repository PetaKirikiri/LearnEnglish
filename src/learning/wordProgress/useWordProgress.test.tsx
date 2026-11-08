// @vitest-environment happy-dom
import {act} from 'react'
import {createRoot} from 'react-dom/client'
import {afterEach,beforeEach,expect,it,vi} from 'vitest'
import {useWordProgress} from './useWordProgress'
import {wordOpacity,type WordProgress} from './model'
const store=vi.hoisted(()=>({flushWordAttempts:vi.fn(),loadWordProgress:vi.fn(),queueAttempt:vi.fn()}))
vi.mock('./store',()=>store)
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true})
const row:WordProgress={word_id:'en:hotel',correct:25,attempts:25,listening_correct:25,direct_correct:0,last_practised:'2026-11-08T00:00:00Z',recent_results:[true]}
let output:ReturnType<typeof useWordProgress>
function Probe({userId}:{userId:string}){output=useWordProgress(userId);return null}
const roots:Array<ReturnType<typeof createRoot>>=[]
function mount(){const root=createRoot(document.createElement('div'));roots.push(root);return root}
beforeEach(()=>{store.flushWordAttempts.mockReset().mockResolvedValue(undefined);store.loadWordProgress.mockReset().mockResolvedValue([row]);store.queueAttempt.mockReset()})
afterEach(async()=>{for(const root of roots.splice(0))await act(async()=>root.unmount())})
it('loads saved proficiency and full fade even when a queued answer cannot upload',async()=>{
 store.flushWordAttempts.mockRejectedValue(new Error('offline upload'))
 const root=mount()
 await act(async()=>root.render(<Probe userId="student"/>))
 expect(store.loadWordProgress).toHaveBeenCalledWith('student')
 expect(output.ready).toBe(true)
 expect(wordOpacity('hotel',output.scores,{fadeMode:true})).toBe(0)
 expect(output.error).not.toBe('')
})
it('does not replace a new account with a late response from the previous account',async()=>{
 let finishOld!:(rows:WordProgress[])=>void
 store.loadWordProgress.mockImplementation((userId:string)=>userId==='old'?new Promise(resolve=>{finishOld=resolve}):Promise.resolve([{...row,word_id:'en:book',correct:8}]))
 const root=mount()
 await act(async()=>root.render(<Probe userId="old"/>))
 await act(async()=>root.render(<Probe userId="new"/>))
 await act(async()=>finishOld([row]))
 expect(output.scores).toEqual({'en:book':8})
})
it('retains confirmed scores during a later failed refresh',async()=>{
 const root=mount()
 await act(async()=>root.render(<Probe userId="student"/>))
 store.loadWordProgress.mockRejectedValue(new Error('network'))
 await act(async()=>output.retry())
 expect(output.ready).toBe(true)
 expect(output.scores).toEqual({'en:hotel':25})
 expect(output.error).not.toBe('')
})
