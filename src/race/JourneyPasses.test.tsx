// @vitest-environment happy-dom
import {act} from 'react'
import {createRoot} from 'react-dom/client'
import {expect,it,vi} from 'vitest'
vi.mock('../lib/supabase',()=>({supabase:{}}))
import {JourneyPassNames} from './JourneyPasses'
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true})
it('shows actual names only on the level they passed and distinguishes failed loading',async()=>{
 const host=document.createElement('div'),root=createRoot(host)
 const passes=[{id:'one',name:'Fifa',level:1},{id:'two',name:'Pond',level:2}]
 try{
 await act(async()=>root.render(<JourneyPassNames level={1} passes={passes} unavailable={false}/>))
 expect(host.textContent).toContain('Fifa');expect(host.textContent).not.toContain('Pond')
 await act(async()=>root.render(<JourneyPassNames level={3} passes={passes} unavailable={false}/>))
 expect(host.textContent).toBe('')
 await act(async()=>root.render(<JourneyPassNames level={3} passes={passes} unavailable/>))
 expect(host.querySelector('[role="status"]')).not.toBeNull()
 }finally{await act(async()=>root.unmount())}
})
