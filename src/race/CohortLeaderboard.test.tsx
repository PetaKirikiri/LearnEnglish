import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, expect, it, vi } from 'vitest'
const mocks=vi.hoisted(()=>({rpc:vi.fn(),getUser:vi.fn(),flush:vi.fn()}))
vi.mock('../lib/supabase',()=>({supabase:{rpc:mocks.rpc,auth:{getUser:mocks.getUser}}}))
vi.mock('../learning/wordProgress/store',()=>({flushWordAttempts:mocks.flush}))
vi.mock('../auth/homeworkLine',()=>({homeworkLiffId:'test-liff'}))
import CohortLeaderboard from './CohortLeaderboard'
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true})
const host=document.createElement('div');document.body.append(host)
let root=createRoot(host)
afterEach(async()=>{await act(async()=>root.unmount());host.replaceChildren();root=createRoot(host);vi.resetAllMocks()})
const board=(period:string,points=0)=>({period,rows:[{id:'student',name:'Student',rank:points?1:null,points},{id:'quiet',name:'Not yet practising',rank:null,points:0}],periodStart:null,periodEnd:null})
const select=async(name:string)=>act(async()=>host.querySelector<HTMLButtonElement>(`button[aria-label="${name}"]`)!.click())
it('shows students with no points and fetches every period from the server',async()=>{
 mocks.rpc.mockImplementation((_:string,{p_period}:{p_period:string})=>Promise.resolve({data:board(p_period,p_period==='all'?120:0)}))
 await act(async()=>root.render(<CohortLeaderboard userId="student"/>))
 await select('Week')
 expect(host.querySelectorAll('li')).toHaveLength(2)
 expect(host.querySelector('.cohort-rank')?.textContent).toBe('—')
 for(const [label,period] of [['Today','today'],['Month','month'],['All time','all'],['Week','week']]){
  await select(label)
  expect(mocks.rpc).toHaveBeenLastCalledWith('english_success_leaderboard',{p_period:period})
 }
 await select('All time')
 expect(host.querySelector('.cohort-points')?.textContent).toBe('120')
 expect(host.querySelector('.is-you')?.textContent).toContain('Student')
})
it('does not let a slow old period replace the selected results',async()=>{
 let finish: (value:unknown)=>void=()=>{}
 mocks.rpc.mockImplementation((_:string,{p_period}:{p_period:string})=>p_period==='all'?new Promise(resolve=>{finish=resolve}):Promise.resolve({data:board(p_period,55)}))
 await act(async()=>root.render(<CohortLeaderboard userId="student"/>))
 await select('Today')
 await act(async()=>finish({data:board('all',999)}))
 expect(host.querySelector('.cohort-points')?.textContent).toBe('55')
})
it('still loads saved ranks if an offline answer cannot sync',async()=>{
 mocks.flush.mockRejectedValue(new Error('offline answer'))
 mocks.rpc.mockResolvedValue({data:board('all',20)})
 await act(async()=>root.render(<CohortLeaderboard userId="student"/>))
 expect(host.querySelectorAll('li')).toHaveLength(2)
 expect(host.querySelector('.cohort-sync')).not.toBeNull()
})
it('shows a sign-in action instead of pretending an unauthenticated roster is empty',async()=>{
 mocks.getUser.mockResolvedValue({data:{user:null}})
 await act(async()=>root.render(<CohortLeaderboard/>))
 expect(host.querySelector('a[href*="liff.line.me/test-liff?view=scoreboard"]')).not.toBeNull()
 expect(mocks.rpc).not.toHaveBeenCalled()
})
it('retries a failed server request',async()=>{
 mocks.rpc.mockResolvedValueOnce({error:new Error('network')}).mockResolvedValue({data:board('all',10)})
 await act(async()=>root.render(<CohortLeaderboard userId="student"/>))
 expect(host.querySelector('[role=alert]')).not.toBeNull()
 await act(async()=>host.querySelector<HTMLButtonElement>('[role=alert] button')!.click())
 expect(host.querySelector('.cohort-points')?.textContent).toBe('10')
})
