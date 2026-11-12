// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { expect,it } from 'vitest'
import SentenceMatrix from './SentenceMatrix'
import { classroomMatrices } from '../../classroom/matrixLessons'
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true})
it('keeps object references tied to the selected noun and offers bare proper nouns',async()=>{
 const host=document.createElement('div'),root=createRoot(host)
 const click=async(selector:string)=>act(async()=>host.querySelector<HTMLButtonElement>(selector)!.click())
 const sentence=()=>host.querySelector('.tonight-slots')?.getAttribute('aria-label')
 try{
  await act(async()=>root.render(<SentenceMatrix lesson={classroomMatrices['lesson-3']} settings={{audio:false}}/>))
  expect(sentence()).toBe('Where is the hotel?')
  await click('[data-noun-mode="pronoun"]')
  expect(sentence()).toBe('Where is it?')
  await click('[aria-label="Change pronoun"]')
  expect([...host.querySelectorAll('.cw-word-chip')].map(e=>e.getAttribute('data-word'))).toEqual(['it'])
  await click('[data-noun-mode="name"]')
  expect(sentence()).toBe('Where is Bia?')
  expect([...host.querySelectorAll('.example-source')].map(e=>e.textContent)).toEqual(['Where','is','Bia?'])
  await click('[aria-label="Change proper noun"]');await click('[data-word="May"]')
  expect(sentence()).toBe('Where is May?')
  await click('[data-noun-mode="noun"]')
  expect(sentence()).toBe('Where is the hotel?')
 }finally{await act(async()=>root.unmount());host.remove()}
})

it('carries host layout and help settings through every construction',async()=>{
 const host=document.createElement('div');document.body.append(host);const root=createRoot(host)
 const check=()=>{
  const frame=host.querySelector<HTMLElement>('[data-matrix-layout]')!
  expect(frame.dataset.density).toBe('compact')
  expect(frame.style.getPropertyValue('--matrix-max-width')).toBe('920px')
  expect(frame.querySelector('.matrix-layout-noun-control')).not.toBeNull()
  expect(frame.querySelector('.matrix-layout-translation')).not.toBeNull()
  expect(frame.querySelector('.matrix-layout-dock')).not.toBeNull()
  expect(frame.querySelector('.cw-slot-picker')).toBeNull()
  expect(frame.querySelector('.cw-sound')).toBeNull()
 }
 try{
  await act(async()=>root.render(<SentenceMatrix lesson={classroomMatrices['lesson-3']} settings={{layout:{density:'compact',maxWidth:920},wordPicker:false,audio:false}}/>))
  check()
  for(const mode of ['pronoun','name','noun']){
   await act(async()=>host.querySelector<HTMLButtonElement>(`[data-noun-mode="${mode}"]`)!.click());check()
  }
  await act(async()=>host.querySelector<HTMLButtonElement>('[aria-label="Next pattern"]')!.click());check()
  expect(host.querySelector('[data-matrix-layout]')?.getAttribute('data-matrix-layout')).toBe('location-answer')
 }finally{await act(async()=>root.unmount());host.remove()}
})

it('enables all three modes in early lessons and preserves singular/plural noun selections',async()=>{
 const host=document.createElement('div'),root=createRoot(host)
 const click=async(selector:string)=>act(async()=>host.querySelector<HTMLButtonElement>(selector)!.click())
 const sentence=()=>host.querySelector('.tonight-slots')?.getAttribute('aria-label')
 try{
  for(const lesson of ['lesson-1','lesson-2'] as const){
   await act(async()=>root.render(<SentenceMatrix key={lesson} lesson={classroomMatrices[lesson]} settings={{audio:false}}/>))
   const original=sentence(),toolbar=host.querySelector('.matrix-layout-noun-control')!
   expect([...toolbar.querySelectorAll<HTMLButtonElement>('button')].map(b=>[b.dataset.nounMode,b.disabled])).toEqual([['noun',false],['pronoun',false],['name',false]])
   await click('[data-noun-mode="pronoun"]');expect(sentence()).toBe(original?.includes(' are ')?'Where are they?':'Where is it?')
   await click('[data-noun-mode="name"]');expect(sentence()).toBe('Where is Bia?')
   await click('[data-noun-mode="noun"]');expect(sentence()).toBe(original)
  }
  await act(async()=>root.render(<SentenceMatrix key="plural" lesson={classroomMatrices['lesson-3']} settings={{audio:false}}/>))
  await click('[data-picker-slot="2"]');await click('.cw-word-chip[data-word="my"]')
  await click('[data-noun-mode="pronoun"]');expect(sentence()).toBe('Where is it?')
  await click('[data-noun-mode="noun"]');expect(sentence()).toBe('Where is my hotel?')
  await click('[data-picker-slot="1"]');await click('.cw-word-chip[data-word="are"]')
  await click('[data-noun-mode="pronoun"]');expect(sentence()).toBe('Where are they?')
  await click('[data-noun-mode="name"]');expect(sentence()).toBe('Where is Bia?')
  await click('[data-noun-mode="noun"]');expect(sentence()).toBe('Where are my hotels?')
 }finally{await act(async()=>root.unmount());host.remove()}
})

it('forwards learner word scores to pronoun and named-subject fade presentation',async()=>{
 const {default:SubjectQuestionMatrix}=await import('./SubjectQuestionMatrix')
 const host=document.createElement('div'),root=createRoot(host)
 try{
  for(const mode of ['pronoun','name'] as const){
   await act(async()=>root.render(<SubjectQuestionMatrix config={classroomMatrices['lesson-3'].subjectModes} mode={mode} settings={{fadeMode:true,audio:false}} scores={{'en:where':25}} swapper={{mode,modes:['pronoun','name'],onChange:()=>{}}}/>))
   expect(host.querySelector<HTMLElement>('.example-source [data-word="where"]')?.style.opacity).toBe('0')
   expect(host.querySelector('.example-gloss')).toBeNull()
  }
 }finally{await act(async()=>root.unmount())}
})
