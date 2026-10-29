// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, expect, it, vi } from 'vitest'
import SentenceMatrix from './SentenceMatrix'
import { classroomMatrices } from '../../classroom/matrixLessons'
import { peopleAudio, locationWords } from './peopleLocation'
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true})
const host=document.createElement('div');document.body.append(host)
let root=createRoot(host)
afterEach(async()=>{await act(async()=>root.unmount());host.replaceChildren();root=createRoot(host);vi.restoreAllMocks()})
const click=async(selector:string)=>act(async()=>host.querySelector<HTMLButtonElement>(selector)!.click())
const choose=async(word:string)=>act(async()=>[...host.querySelectorAll<HTMLButtonElement>('.cw-word-chip')].find(b=>b.querySelector('strong')?.textContent===word)!.click())
const sentence=()=>host.querySelector('.cw-sentence-board')?.getAttribute('aria-label')
const render=()=>act(async()=>root.render(<SentenceMatrix lesson={classroomMatrices['lesson-3']}/>))
it('keeps the original four pieces and adds an answer slide with a separate determiner and noun',async()=>{
 await render()
 expect(sentence()).toBe('Where is the hotel?')
 expect([...host.querySelectorAll('.example-source')].map(e=>e.textContent)).toEqual(['Where','is','the','hotel?'])
 await click('[aria-label="Next pattern"]')
 expect(sentence()).toBe('I am at the hotel.')
 expect([...host.querySelectorAll('.example-source')].map(e=>e.textContent)).toEqual(['I','am','at','the','hotel.'])
 expect([...host.querySelectorAll('.cw-noun-group .example-source')].map(e=>e.textContent)).toEqual(['the','hotel.'])
 expect(host.querySelector('.cw-noun-group')?.getAttribute('aria-label')).toBe('Location noun phrase')
 await click('[aria-label="Change place"]');await choose('gym')
 for(const [person,expected] of [['you','You are'],['he','He is'],['she','She is'],['I','I am']]){
  await click('[aria-label="Change person"]');await choose(person)
  expect(sentence()).toBe(`${expected} at the gym.`)
 }
 await click('[aria-label="Previous pattern"]')
 expect(sentence()).toBe('Where is the gym?')
 await click('[data-picker-slot="3"]');await choose('shoes')
 expect(sentence()).toBe('Where are the shoes?')
})
it('preserves the full original vocabulary but limits answer destinations and excludes past tense',async()=>{
 await render();await click('[data-picker-slot="1"]')
 expect([...host.querySelectorAll('.cw-word-chip strong')].map(n=>n.textContent)).toEqual(['is','are'])
 await click('[data-picker-slot="3"]')
 expect(host.querySelectorAll('.cw-word-chip')).toHaveLength(classroomMatrices['lesson-3'].vocabulary.length)
 await click('[aria-label="Next pattern"]');await click('[aria-label="Change place"]')
 expect([...host.querySelectorAll('.cw-word-chip strong')].map(n=>n.textContent)).toEqual(locationWords(classroomMatrices['lesson-3'].vocabulary).map(p=>p.word))
})
it('explains each answer piece and never makes the location noun control person agreement',async()=>{
 await render();await click('[aria-label="Next pattern"]')
 const labels=[...host.querySelectorAll('[aria-label^="Slot "]')].map(b=>b.getAttribute('aria-label'))
 for(const label of labels){
  await click(`[aria-label="${label}"]`)
  expect(host.querySelectorAll('.pronunciation-comparison')).toHaveLength(1)
  expect(host.querySelector('.pronunciation-content')?.hasAttribute('hidden')).toBe(false)
  expect(host.querySelector('.cw-people-example-sentence')?.textContent).toBe('I am at the hotel.')
  if(label==='Slot 4: the')expect(host.querySelector('.cw-word-explanation h1')?.textContent).toBe('the')
  if(label==='Slot 5: hotel')expect(host.querySelector('.cw-word-explanation h1')?.textContent).toBe('hotel')
  expect(host.querySelector('.cw-number-comparison')).toBeNull()
  await click('.cw-word-return')
 }
})
it('honors matrix help settings and plays the matching sentence recording',async()=>{
 const play=vi.spyOn(HTMLMediaElement.prototype,'play').mockResolvedValue()
 await act(async()=>root.render(<SentenceMatrix lesson={classroomMatrices['lesson-3']} settings={{explanations:false,wordPicker:false}}/>))
 expect(host.querySelector('.example-unit-trigger')).toBeNull()
 expect(host.querySelector('.cw-slot-picker')).toBeNull()
 await click('[aria-label="Next pattern"]');await click('.cw-sound')
 expect(host.querySelector('audio')?.getAttribute('src')).toBe(peopleAudio('I am at the hotel.'))
 expect(play).toHaveBeenCalledOnce()
})
it('enables independent yellow-block swappers through the layout request',async()=>{
 await render();await click('[aria-label="Next pattern"]')
 expect(host.querySelector('[aria-label="Subject block mode"]')).not.toBeNull()
 expect(host.querySelector('[aria-label="Location block mode"]')).not.toBeNull()
 await click('[aria-label="Subject block mode"] [data-noun-mode="name"]')
 expect(sentence()).toBe('Bia is at the hotel.')
 await click('[aria-label="Location block mode"] [data-noun-mode="name"]')
 expect(sentence()).toBe('Bia is at Central.')
 expect(host.querySelectorAll('.cw-noun-group .tonight-slot')).toHaveLength(1)
 await click('[aria-label="Change place"]')
 expect([...host.querySelectorAll('.cw-word-chip strong')].map(n=>n.textContent)).toEqual(['Central','Success'])
 await choose('Success')
 expect(sentence()).toBe('Bia is at Success.')
 await click('[aria-label="Subject block mode"] [data-noun-mode="pronoun"]')
 expect(sentence()).toBe('I am at Success.')
 await click('[aria-label="Location block mode"] [data-noun-mode="noun"]')
 expect(sentence()).toBe('I am at the hotel.')
 expect(host.querySelectorAll('.cw-noun-group .tonight-slot')).toHaveLength(2)
})
