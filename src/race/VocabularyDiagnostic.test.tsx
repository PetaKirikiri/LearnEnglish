// @vitest-environment happy-dom
import {act} from 'react'
import {createRoot} from 'react-dom/client'
import {expect,it,vi} from 'vitest'
vi.hoisted(()=>vi.stubEnv('DEV',true))
const mock=vi.hoisted(()=>({auth:vi.fn(),read:vi.fn()}))
vi.mock('../lib/supabase',()=>({supabase:{auth:{getUser:mock.auth,onAuthStateChange:mock.auth}}}))
vi.mock('../auth/homeworkLine',()=>({recogniseHomeworkAccount:mock.auth}))
vi.mock('./studentVocabulary',()=>({useStudentVocabulary:(viewer:string,selected:string|null,diagnostic:boolean)=>{
 mock.read(viewer,selected,diagnostic)
 return {snapshot:{selected:selected??'peta',students:[{id:'peta',name:'Peta'},{id:'other',name:'Other'}],rows:[]},error:'',retry:vi.fn()}
}}))
import VocabularyReview from './VocabularyProgressPage'
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true})
it('opens the private diagnostic directly on Peta without invoking student sign-in',async()=>{
 const host=document.createElement('div'),root=createRoot(host)
 try{
  await act(async()=>root.render(<VocabularyReview/>))
  expect(host.textContent).toContain('Peta’s words');expect(host.textContent).not.toContain('Sign in')
  expect(mock.auth).not.toHaveBeenCalled();expect(mock.read).toHaveBeenCalledWith('diagnostic',null,true)
  const select=host.querySelector<HTMLSelectElement>('select[aria-label=Student]')!
  await act(async()=>{select.value='other';select.dispatchEvent(new Event('change',{bubbles:true}))})
  expect(host.textContent).toContain('Other’s words')
 }finally{await act(async()=>root.unmount())}
})
