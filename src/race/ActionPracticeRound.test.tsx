// @vitest-environment happy-dom
import {act} from 'react'
import {createRoot} from 'react-dom/client'
import {expect,it,vi} from 'vitest'
vi.mock('./GeneratedPractice',()=>({default:({level,onComplete}:{level:number;onComplete:(level:number,score:number,total:number,passed:boolean)=>void})=><button onClick={()=>onComplete(level,28,30,true)}>Complete adaptive round</button>}))
import ActionPractice from './ActionPractice'
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true})
it('forwards completion from the adaptive engine to the existing level flow',async()=>{
 const host=document.createElement('div'),root=createRoot(host),complete=vi.fn()
 try{await act(async()=>root.render(<ActionPractice level={4} onLevel={()=>{}} onComplete={complete}/>));await act(async()=>host.querySelector('button')!.click());expect(complete).toHaveBeenCalledWith(4,28,30,true)}finally{await act(async()=>root.unmount())}
})
