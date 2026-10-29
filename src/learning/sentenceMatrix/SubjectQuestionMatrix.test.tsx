// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { expect,it } from 'vitest'
import SentenceMatrix from './SentenceMatrix'
import { classroomMatrices } from '../../classroom/matrixLessons'
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true})
it('switches the yellow subject between a noun phrase, agreeing pronouns and bare names',async()=>{
 const host=document.createElement('div');document.body.append(host);const root=createRoot(host)
 const click=async(selector:string)=>act(async()=>host.querySelector<HTMLButtonElement>(selector)!.click())
 const sentence=()=>host.querySelector('.tonight-slots')?.getAttribute('aria-label')
 try{
  await act(async()=>root.render(<SentenceMatrix lesson={classroomMatrices['lesson-3']} settings={{audio:false}}/>))
  expect(sentence()).toBe('Where is the hotel?')
  expect(host.querySelectorAll('.cw-noun-group .tonight-slot')).toHaveLength(2)
  await click('[data-noun-mode="pronoun"]')
  expect(sentence()).toBe('Where is he?')
  expect(host.querySelectorAll('.cw-noun-group .tonight-slot')).toHaveLength(1)
  for(const [word,verb] of [['I','am'],['he','is'],['she','is'],['you','are']]){
   await click('[aria-label="Change pronoun"]');await click(`[data-word="${word}"]`)
   expect(sentence()).toBe(`Where ${verb} ${word}?`)
   expect(host.querySelector('.cw-word-conveyor')?.hasAttribute('hidden')).toBe(true)
  }
  await click('[data-noun-mode="name"]')
  expect(sentence()).toBe('Where is Bia?')
  for(const word of ['Central','Success']){
   await click('[aria-label="Change proper noun"]');await click(`[data-word="${word}"]`)
   expect(sentence()).toBe(`Where is ${word}?`)
  }
  await click('[aria-label="Explain Success"]')
  expect(host.querySelector('h1')?.textContent).toBe('Success')
  expect(host.querySelector('.pronunciation-comparison, .cw-pronunciation')).not.toBeNull()
  await click('[aria-label="Back to sentence"]')
  await click('[data-noun-mode="noun"]')
  expect(sentence()).toBe('Where is the hotel?')
  expect(host.querySelectorAll('.cw-noun-group .tonight-slot')).toHaveLength(2)
 }finally{await act(async()=>root.unmount());host.remove()}
})

it('works on another lesson through configuration without the Lesson 3 carousel',async()=>{
 const host=document.createElement('div');document.body.append(host);const root=createRoot(host)
 const lesson={...classroomMatrices['lesson-1'],id:'custom-subjects',subjectModes:{pronouns:[],names:[{word:'Maya',thai:'Maya'}]}}
 try{
  await act(async()=>root.render(<SentenceMatrix lesson={lesson} settings={{audio:false}}/>))
  expect(host.querySelector('.cw-pattern-carousel')).toBeNull()
  expect(host.querySelector<HTMLButtonElement>('[data-noun-mode="pronoun"]')?.disabled).toBe(true)
  await act(async()=>host.querySelector<HTMLButtonElement>('[data-noun-mode="name"]')!.click())
  expect(host.querySelector('.tonight-slots')?.getAttribute('aria-label')).toBe('Where is Maya?')
  expect(host.textContent).not.toContain('Bia')
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

it('keeps future noun modes visible but inactive in early lessons',async()=>{
 const host=document.createElement('div');document.body.append(host);const root=createRoot(host)
 try{
  for(const lesson of ['lesson-1','lesson-2'] as const){
   await act(async()=>root.render(<SentenceMatrix lesson={classroomMatrices[lesson]} settings={{audio:false}}/>))
   const original=host.querySelector('.tonight-slots')?.getAttribute('aria-label')
   const toolbar=host.querySelector('.matrix-layout-noun-control')!
   expect([...toolbar.querySelectorAll<HTMLButtonElement>('button')].map(b=>[b.dataset.nounMode,b.disabled])).toEqual([['noun',false],['pronoun',true],['name',true]])
   for(const mode of ['pronoun','name'])await act(async()=>toolbar.querySelector<HTMLButtonElement>(`[data-noun-mode="${mode}"]`)!.click())
   expect(host.querySelector('.tonight-slots')?.getAttribute('aria-label')).toBe(original)
  }
 }finally{await act(async()=>root.unmount());host.remove()}
})

it('lets the verb selector choose an agreeing pronoun without leaving the construction',async()=>{
 const host=document.createElement('div');document.body.append(host);const root=createRoot(host)
 const click=async(selector:string)=>act(async()=>host.querySelector<HTMLButtonElement>(selector)!.click())
 try{
  await act(async()=>root.render(<SentenceMatrix lesson={classroomMatrices['lesson-3']} settings={{audio:false}}/>))
  await click('[data-noun-mode="pronoun"]')
  for(const [verb,person] of [['is','he'],['are','you'],['am','I']]){
   await click('[aria-label="Change am / is / are"]')
   await click(`.cw-word-chip[data-word="${verb}"]`)
   expect(host.querySelector('.tonight-slots')?.getAttribute('aria-label')).toBe(`Where ${verb} ${person}?`)
   expect(host.querySelector('.cw-word-conveyor')?.hasAttribute('hidden')).toBe(true)
  }
  await click('[aria-label="Change pronoun"]');await click('.cw-word-chip[data-word="she"]')
  await click('[aria-label="Change am / is / are"]');await click('.cw-word-chip[data-word="is"]')
  expect(host.querySelector('.tonight-slots')?.getAttribute('aria-label')).toBe('Where is she?')
 }finally{await act(async()=>root.unmount());host.remove()}
})

it('preserves the noun question verb when entering pronoun mode and leaves its noun selection intact',async()=>{
 const host=document.createElement('div');document.body.append(host);const root=createRoot(host)
 const click=async(selector:string)=>act(async()=>host.querySelector<HTMLButtonElement>(selector)!.click())
 const sentence=()=>host.querySelector('.tonight-slots')?.getAttribute('aria-label')
 try{
  await act(async()=>root.render(<SentenceMatrix lesson={classroomMatrices['lesson-3']} settings={{audio:false}}/>))
  await click('[data-picker-slot="2"]');await click('.cw-word-chip[data-word="my"]')
  await click('[data-noun-mode="pronoun"]')
  expect(sentence()).toBe('Where is he?')
  await click('[data-noun-mode="noun"]')
  expect(sentence()).toBe('Where is my hotel?')
  await click('[data-picker-slot="1"]');await click('.cw-word-chip[data-word="are"]')
  await click('[data-noun-mode="pronoun"]')
  expect(sentence()).toBe('Where are you?')
  await click('[data-noun-mode="noun"]')
  expect(sentence()).toBe('Where are my hotels?')
 }finally{await act(async()=>root.unmount());host.remove()}
})
