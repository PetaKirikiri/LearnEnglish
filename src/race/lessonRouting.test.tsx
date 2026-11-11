// @vitest-environment happy-dom
import {act} from 'react'
import {createRoot} from 'react-dom/client'
import {expect,it,vi} from 'vitest'
vi.mock('./PracticeJourney',()=>({default:()=> <div data-testid="round-map"/>}))
vi.mock('./GeneratedPractice',()=>({default:()=> <div data-testid="blueprint-practice"/>}))
import PhonePractice from './PhonePractice'
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true})
it('testing always opens its round map even when lesson or LINE parameters remain in the URL',async()=>{
 const host=document.createElement('div'),root=createRoot(host)
 try{for(const query of ['',...Array.from({length:6},(_,i)=>`?lesson=${i+1}`),'?liff.state=%3Flesson%3D6']){
  history.replaceState(null,'',`/english/practice${query}`)
  await act(async()=>root.render(<PhonePractice/>))
  expect(host.querySelector('[data-testid="round-map"]')).not.toBeNull()
  expect(host.querySelector('[data-testid="blueprint-practice"]')).toBeNull()
 }}finally{await act(async()=>root.unmount());history.replaceState(null,'','/')}
})
