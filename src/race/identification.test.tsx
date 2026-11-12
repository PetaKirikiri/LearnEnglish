// @vitest-environment happy-dom
import {act} from 'react'
import {createRoot} from 'react-dom/client'
import {readFileSync} from 'node:fs'
import {expect,it} from 'vitest'
import {identificationDeck,identificationQuestions} from './identificationContent'
import {references,identificationQuestion,referenceFor} from '../learning/sentenceRules/identification'
import SentenceMatrix from '../learning/sentenceMatrix/SentenceMatrix'
import {requestLesson} from '../learning/lessonRegistry'
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true})

it('keeps thirty matched scene decisions, balanced answer positions and all five taught sentence forms',()=>{
 for(const seed of ['tonight','repeat','student']){
  const deck=identificationDeck(seed)
  expect(deck).toHaveLength(30);expect(new Set(deck.map(q=>q.id)).size).toBe(30)
  expect(deck.filter(q=>q.correct===0)).toHaveLength(15)
  expect(new Set(deck.map(q=>q.document.english)).size).toBeGreaterThan(1)
  for(const q of deck){
   const scenes=q.sceneChoices!
   expect(scenes[0].word).toBe(scenes[1].word)
   expect(scenes[0].reference).not.toBe(scenes[1].reference)
   expect(q.choices[q.correct]).toBe(referenceFor(scenes[q.correct].reference).word)
   expect(q.document.english).toBe(identificationQuestion(scenes[q.correct].reference).english)
   expect(q.document.english).not.toMatch(/\b(a|an|it|to)\b/i)
  }
 }
 expect(identificationDeck('tonight').map(q=>q.id)).not.toEqual(identificationDeck('repeat').map(q=>q.id))
})
it('ships a matching playable PCM recording for each taught sentence',()=>{
 const manifest=JSON.parse(readFileSync('public/audio/lesson-six/voice-manifest.json','utf8'))
 for(const q of identificationQuestions){
  expect(manifest[q.audioUrl.split('/').pop()!].text).toBe(q.document.english)
  const audio=readFileSync(`public${q.audioUrl}`)
  expect(audio.toString('ascii',0,4)).toBe('RIFF');expect(audio.toString('ascii',8,12)).toBe('WAVE')
  expect(audio.length).toBeGreaterThan(20000)
 }
})
it('uses the shared boxes and dropdown without a separate gallery or practice link',async()=>{
 const host=document.createElement('div'),root=createRoot(host)
 try{
  await act(async()=>root.render(<SentenceMatrix lesson={requestLesson(6)} settings={{audio:false}}/>))
  expect(host.querySelector('.cw-sentence-display .matrix-layout')).not.toBeNull()
  expect(host.querySelectorAll('.tonight-slot')).toHaveLength(3)
  expect(host.querySelector('.identification-options,.identification-scene,.identification-practice-link')).toBeNull()
  for(const reference of references){
   await act(async()=>host.querySelector<HTMLButtonElement>('[data-picker-slot="3"]')!.click())
   expect(host.querySelector('.cw-word-conveyor')?.hasAttribute('hidden')).toBe(false)
   expect(host.querySelectorAll('.cw-word-chip')).toHaveLength(5)
   await act(async()=>host.querySelector<HTMLButtonElement>(`button.cw-word-chip[data-word="${reference.word}"]`)!.click())
   expect(host.querySelector('.cw-sentence-board')?.getAttribute('aria-label')).toBe(identificationQuestion(reference.id).english)
   expect(host.querySelector('.cw-slot-role [data-distance]')?.getAttribute('data-distance')).toBe(reference.id)
   expect(host.querySelector('.cw-word-conveyor')?.hasAttribute('hidden')).toBe(true)
   expect(host.querySelector('[data-picker-slot="3"]')?.getAttribute('aria-expanded')).toBe('false')
  }
  await act(async()=>root.render(<SentenceMatrix lesson={requestLesson(6)} settings={{audio:false,fadeMode:true}}/>))
  expect(host.querySelector('.cw-slot-picker,.cw-word-chip,.distance-scene')).toBeNull()
 }finally{await act(async()=>root.unmount())}
})
it('keeps number agreement, plural pictures and selected nouns together across Q and A',async()=>{
 const host=document.createElement('div'),root=createRoot(host)
 const pick=async(role:string,word:string)=>{
  await act(async()=>host.querySelector<HTMLButtonElement>(`[data-word-role="${role}"]`)!.click())
  await act(async()=>host.querySelector<HTMLButtonElement>(`button.cw-word-chip[data-word="${word}"]`)!.click())
 }
 try{
  await act(async()=>root.render(<SentenceMatrix lesson={requestLesson(6)} settings={{audio:false}}/>))
  await pick('reference','these')
  expect(host.querySelector('.cw-sentence-board')?.getAttribute('aria-label')).toBe('What are these?')
  expect(host.querySelector('.cw-slot-role .distance-scene')?.getAttribute('data-count')).toBe('2')
  expect(host.querySelectorAll('.cw-slot-role .distance-scene-object img')).toHaveLength(2)
  await act(async()=>host.querySelectorAll<HTMLButtonElement>('.cw-pattern-tabs button')[1].click())
  expect(host.querySelector('.cw-sentence-board')?.getAttribute('aria-label')).toBe('These are the phones.')
  await pick('object','bags')
  await pick('reference','those')
  expect(host.querySelector('.cw-sentence-board')?.getAttribute('aria-label')).toBe('Those are the bags.')
  await pick('reference','that')
  expect(host.querySelector('.cw-sentence-board')?.getAttribute('aria-label')).toBe('That is the bag.')
  expect(host.querySelectorAll('.cw-slot-role .distance-scene-object img')).toHaveLength(1)
 }finally{await act(async()=>root.unmount())}
})
it('preserves old question definitions and changes only number or distance in new distractors',()=>{
 const oldSql=readFileSync('supabase/migrations/20261110000900_lesson_six_identification.sql','utf8')
 for(const question of identificationQuestions.filter(q=>!q.plural)){
  expect(oldSql).toContain(`('${question.id}',1,'${question.document.english}',array['${question.choices.join("','")}']`)
 }
 for(const question of identificationQuestions.filter(q=>q.plural)){
  const [a,b]=question.sceneChoices.map(scene=>referenceFor(scene.reference))
  expect(Number(a.distance!==b.distance)+Number(a.plural!==b.plural)).toBe(1)
 }
})
