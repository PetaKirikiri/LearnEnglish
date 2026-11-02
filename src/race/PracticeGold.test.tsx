// @vitest-environment happy-dom
import {act} from 'react'
import {createRoot} from 'react-dom/client'
import {expect,it,vi} from 'vitest'
const rpc=vi.hoisted(()=>vi.fn())
vi.mock('../lib/supabase',()=>({supabase:{rpc}}))
import PracticeGold,{awardPracticeGold,pendingGold} from './PracticeGold'
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true})
it('adds correct answers once, reconciles saved awards without doubling and isolates accounts',async()=>{
 localStorage.clear();rpc.mockResolvedValue({data:{earned:40,settled:[]},error:null})
 const host=document.createElement('div'),root=createRoot(host)
 await act(async()=>root.render(<PracticeGold userId="student"/>))
 expect(host.textContent).toContain('40')
 await act(async()=>{awardPracticeGold('attempt',true,'student');awardPracticeGold('attempt',true,'student');awardPracticeGold('wrong',false,'student')})
 expect(host.querySelector('strong')?.textContent).toBe('50');expect(Object.keys(pendingGold('student'))).toEqual(['attempt'])
 rpc.mockResolvedValue({data:{earned:50,settled:['attempt']},error:null})
 await act(async()=>window.dispatchEvent(new Event('focus')))
 expect(host.querySelector('strong')?.textContent).toBe('50');expect(pendingGold('student')).toEqual({})
 rpc.mockResolvedValue({data:{earned:0,settled:[]},error:null})
 await act(async()=>root.render(<PracticeGold userId="other"/>))
 expect(host.querySelector('strong')?.textContent).toBe('0')
 await act(async()=>root.unmount())
})
