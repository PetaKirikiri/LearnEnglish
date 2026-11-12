// @vitest-environment happy-dom
import {act} from 'react'
import {createRoot} from 'react-dom/client'
import {beforeEach,expect,it,vi} from 'vitest'
import type {WordProgress} from '../learning/wordProgress/model'
vi.hoisted(()=>vi.stubEnv('DEV',false))
const mock=vi.hoisted(()=>({user:{id:'peta',user_metadata:{display_name:'Peta'}} as {id:string;user_metadata:{display_name:string}}|null,rows:[] as WordProgress[],listener:((_event:string,session:unknown)=>{}) as (_event:string,session:unknown)=>void,read:vi.fn()}))
vi.mock('../lib/supabase',()=>({supabase:{auth:{getUser:async()=>({data:{user:mock.user},error:null}),onAuthStateChange:(callback:typeof mock.listener)=>{mock.listener=callback;return {data:{subscription:{unsubscribe:vi.fn()}}}}}}}))
vi.mock('../auth/homeworkLine',()=>({recogniseHomeworkAccount:vi.fn()}))
vi.mock('./studentVocabulary',()=>({useStudentVocabulary:(viewer:string,selected:string|null)=>{
 const id=selected??(viewer==='other'?'other':'peta');mock.read(id)
 return {snapshot:{selected:id,students:viewer==='other'?[{id:'other',name:'Other'}]:[{id:'peta',name:'Peta'},{id:'other',name:'Other'}],rows:id==='peta'?mock.rows:[]},error:'',retry:vi.fn()}
}}))
import VocabularyReview from './VocabularyProgressPage'
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true})
beforeEach(()=>{localStorage.clear();mock.user={id:'peta',user_metadata:{display_name:'Peta'}};mock.rows=[];mock.read.mockClear()})
it('shows the signed-in account and its actual scores while keeping later words behind the frontier',async()=>{
 mock.rows=[{word_id:'en:banana',correct:3,attempts:3,listening_correct:0,direct_correct:0,last_practised:'',recent_results:[true,true,true]}]
 const host=document.createElement('div'),root=createRoot(host)
 try{
  await act(async()=>root.render(<VocabularyReview/>))
  expect(host.textContent).toContain('Peta’s words');expect(mock.read).toHaveBeenCalledWith('peta')
  expect(host.querySelector('[data-word=man]')?.getAttribute('data-status')).toBe('current')
  await act(async()=>[...host.querySelectorAll<HTMLButtonElement>('.vocab-subgroups button')].find(b=>b.textContent==='Objects')!.click())
  const banana=host.querySelector('[data-word=banana]')!
  expect(banana.getAttribute('data-status')).toBe('later');expect(banana.textContent).toContain('Fading 0%');expect(banana.textContent).not.toContain('3 / 3')
  expect(host.querySelectorAll('[role=tab]')).toHaveLength(5);expect(host.querySelectorAll('[role=tabpanel]')).toHaveLength(1)
  await act(async()=>mock.listener('SIGNED_OUT',null))
  expect(host.textContent).not.toContain('Peta');expect(host.textContent).not.toContain('3 / 3 correct');expect(host.textContent).toContain('Sign in with LINE')
 }finally{await act(async()=>root.unmount())}
})
it('switches accounts without retaining the previous learner’s results',async()=>{
 mock.rows=[{word_id:'en:man',correct:25,attempts:25,listening_correct:3,direct_correct:0,last_practised:'',recent_results:[true,true,true],fade_score:25,confirmation_count:3,proven_at:'2026-01-01T00:00:00Z',review_due_at:'2040-01-01T00:00:00Z',learning_version:1}]
 const host=document.createElement('div'),root=createRoot(host)
 try{
  await act(async()=>root.render(<VocabularyReview/>))
  expect(host.querySelector('[data-word=woman]')?.getAttribute('data-status')).toBe('current')
  await act(async()=>mock.listener('SIGNED_IN',{user:{id:'other',user_metadata:{display_name:'Other'}}}))
  expect(host.textContent).toContain('Other’s words');expect(host.querySelector('[data-word=man]')?.getAttribute('data-status')).toBe('current')
  expect(host.textContent).not.toContain('25 / 25 correct')
 }finally{await act(async()=>root.unmount())}
})

it('defaults the teacher view to Peta and switches the dropdown to another student',async()=>{
 mock.user={id:'teacher',user_metadata:{display_name:'Teacher'}}
 mock.rows=[{word_id:'en:banana',correct:3,attempts:3,listening_correct:0,direct_correct:0,last_practised:'',recent_results:[true,true,true]}]
 const host=document.createElement('div'),root=createRoot(host)
 try{
  await act(async()=>root.render(<VocabularyReview/>))
  const select=host.querySelector<HTMLSelectElement>('select[aria-label=Student]')!
  expect(select.value).toBe('peta');expect(select.options).toHaveLength(2)
  expect(host.textContent).toContain('Peta’s words')
  await act(async()=>{select.value='other';select.dispatchEvent(new Event('change',{bubbles:true}))})
  expect(host.textContent).toContain('Other’s words');expect(host.textContent).not.toContain('3 / 3 correct')
 }finally{await act(async()=>root.unmount())}
})

it('switches vocabulary tabs while retaining the selected student',async()=>{
 const host=document.createElement('div'),root=createRoot(host)
 try{
  await act(async()=>root.render(<VocabularyReview/>))
  await act(async()=>[...host.querySelectorAll<HTMLButtonElement>('[role=tab]')].find(b=>b.textContent==='Verbs')!.click())
  expect(host.querySelector('[role=tab][aria-selected=true]')?.textContent).toBe('Verbs')
  expect(host.querySelector('[role=tabpanel]')?.textContent).toContain('Current: holding, opening, using')
  expect(host.querySelector('[role=tabpanel]')?.textContent).toContain('Next: eating')
  await act(async()=>[...host.querySelectorAll<HTMLButtonElement>('.vocab-subgroups button')].find(b=>b.textContent==='Intransitive')!.click())
  expect(host.querySelector('[role=tabpanel]')?.textContent).toContain('Current: talking, listening, walking')
  expect(host.querySelector('[role=tabpanel]')?.textContent).toContain('Next: running')
 }finally{await act(async()=>root.unmount())}
})
