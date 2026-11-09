// @vitest-environment happy-dom
import {act} from 'react'
import {createRoot} from 'react-dom/client'
import {readFileSync,existsSync} from 'node:fs'
import {it,expect} from 'vitest'
import {lessonNumbers,requestedLesson} from './lessonRequests'
import {requestLesson,lessonRegistry} from './lessonRegistry'
import {classroomMatrices} from '../classroom/matrixLessons'
import {actionCapabilities,composeLessonAction} from './sentenceRules/actionCapabilities'
import {lessonPracticeQuestions} from '../race/lessonPractice'
import {practiceModules} from '../race/practiceModules'
import {practiceDeck} from '../race/practiceDeck'
import {racePools} from '../race/pools'
import SentenceMatrix from './sentenceMatrix/SentenceMatrix'
import ListeningMatrix from './sentenceMatrix/ListeningMatrix'
import MobileNotes from '../classroom/MobileNotes'
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true})
it('shares supported lesson requests across URLs, LINE, classroom and engine; rejects unsupported values',()=>{
 expect(requestedLesson('')).toBe('1')
 expect(classroomMatrices).toBe(lessonRegistry)
 for(const number of lessonNumbers){
  expect(requestedLesson(`?lesson=${number}`)).toBe(number)
  expect(requestedLesson(`?liff.state=${encodeURIComponent(`?lesson=${number}`)}`)).toBe(number)
  expect(requestLesson(Number(number))).toBe(classroomMatrices[`lesson-${number}`])
  for(const stage of requestLesson(number).stages!)expect(racePools.find(p=>p.id===stage)?.questions.length).toBeGreaterThan(0)
 }
 for(const value of ['0','6','unknown','',NaN])expect(()=>requestLesson(value)).toThrow('Unsupported lesson')
 expect(()=>practiceDeck(99)).toThrow('Unsupported lesson')
 expect(()=>practiceModules(99)).toThrow('Unsupported lesson')
})
it('serves identical bounded banks and matching recordings to modules and decks for every lesson',()=>{
 for(const number of lessonNumbers){
  const questions=lessonPracticeQuestions(number),ids=practiceModules(Number(number)).flatMap(m=>m.questionIds)
  expect(new Set(ids)).toEqual(new Set(questions.map(q=>q.id)))
  expect(ids).toHaveLength(new Set(ids).size)
  expect(new Set(practiceDeck(Number(number)).map(q=>q.id))).toEqual(new Set(ids))
  expect(practiceDeck(Number(number))).toHaveLength(questions.length*2)
  for(const q of questions){
   expect(q.answers[q.correct][0].text).not.toBe(q.meaningDistractor)
   expect(existsSync(`public${q.audioUrl}`),q.id).toBe(true)
   const directory=q.audioUrl!.slice(0,q.audioUrl!.lastIndexOf('/'))
   const manifest=JSON.parse(readFileSync(`public${directory}/voice-manifest.json`,'utf8'))
   expect(manifest[q.audioUrl!.split('/').pop()!].text,q.id).toBe(q.english)
  }
 }
})
it('matches Lesson 4 exercise subjects, owners, actions and meanings to teaching capabilities',()=>{
 const lesson=requestLesson(4),capability=actionCapabilities(lesson),questions=lessonPracticeQuestions(4)
 const words=(role:string)=>new Set(questions.flatMap(q=>q.document!.units.filter(u=>u.role===role).map(u=>u.english.toLowerCase())))
 expect(words('person')).toEqual(new Set(capability.subjects.map(s=>s.word.toLowerCase())))
 expect(words('determiner')).toEqual(new Set(['my','your','his','her','our','their']))
 expect(words('action')).toEqual(new Set(lesson.actions))
 for(const q of questions){
  const unit=(role:string)=>q.document!.units.find(u=>u.role===role)!.english.replace(/[.!?]$/,'')
  const action=unit('action'),object=capability.objects(action).find(o=>o.noun===unit('object'))!
  const answer=composeLessonAction(lesson,{subject:unit('person'),action,object:object.word,determiner:unit('determiner') as 'my'}).answer
  expect(answer.english).toBe(q.english);expect(answer.thai).toBe(q.answers[q.correct][0].text)
  expect(answer.units).toEqual(q.document!.units)
 }
 expect(()=>actionCapabilities({...lesson,vocabulary:[]})).toThrow('no compatible lesson objects')
 expect(()=>composeLessonAction(lesson,{subject:'I',action:'flying'})).toThrow('outside lesson')
 expect(()=>composeLessonAction(lesson,{subject:'Bia',action:'eating'})).toThrow('outside lesson')
 expect(()=>composeLessonAction(lesson,{subject:'I',action:'eating',determiner:'an'})).toThrow('outside lesson')
})
it('uses canonical classroom controls and education choices for Lesson 4',async()=>{
 const host=document.createElement('div');document.body.append(host);const root=createRoot(host)
 const click=async(selector:string)=>act(async()=>host.querySelector<HTMLButtonElement>(selector)!.click())
 try{
  await act(async()=>root.render(<SentenceMatrix lesson={requestLesson(4)} settings={{audio:false}}/>))
  expect(host.querySelector('.cw-sentence-board')?.getAttribute('aria-label')).toBe('I am eating the apple.')
  await click('[aria-label="Change person"]');await click('[data-word="You"]')
  expect(host.querySelector('.cw-sentence-board')?.getAttribute('aria-label')).toBe('You are eating the apple.')
  await click('[aria-label="Change determiner"]');await click('[data-word="our"]')
  expect(host.querySelector('.cw-sentence-board')?.getAttribute('aria-label')).toBe('You are eating our apple.')
  await click('[aria-label="Slot 4: our"]')
  expect(host.querySelector('.cw-reference-sheet')).not.toBeNull()
  expect(host.querySelector('.pronunciation-comparison')).not.toBeNull()
  expect(host.querySelector('.cw-word-heading h1')?.textContent).toBe('our')
  expect([...host.querySelectorAll('.cw-word-options strong')].map(e=>e.textContent)).toEqual(requestLesson(4).owners)
 }finally{await act(async()=>root.unmount());host.remove()}
})
it('opens Lesson 4 notes and hides Thai layers in unanswered structured assessments',async()=>{
 window.history.replaceState({},'','/english/notes?lesson=4')
 const host=document.createElement('div'),root=createRoot(host)
 try{
  await act(async()=>root.render(<MobileNotes/>))
  expect(host.querySelector('[aria-label="Lesson 4"]')?.getAttribute('aria-pressed')).toBe('true')
  expect(host.querySelector('.cw-sentence-board')?.getAttribute('aria-label')).toBe('I am eating the apple.')
  for(const number of [3,4]){
   const q=lessonPracticeQuestions(number)[0]
   await act(async()=>root.render(<ListeningMatrix key={number} sentence={q.english} document={q.document} settings={{fadeMode:false,translations:true}}/>))
   expect(host.querySelector('.example-translation,.example-gloss')).toBeNull()
   expect(host.textContent).not.toContain(q.document!.thai)
   expect(host.querySelectorAll('.example-source')).toHaveLength(q.document!.units.length)
  }
 }finally{await act(async()=>root.unmount())}
})
it('keeps Class 5 destination questions and answers within the taught scope',()=>{
 const lesson=requestLesson(5),questions=lessonPracticeQuestions(5)
 expect(questions).toHaveLength(30)
 expect(questions.filter(q=>q.english.endsWith('?')).map(q=>q.english)).toEqual(['Where am I going?','Where are you going?','Where is he going?','Where is she going?','Where are we going?','Where are they going?'])
 for(const q of questions){
  expect(q.english).not.toMatch(/\b(it|its|schools|hotels|bedrooms)\b/i)
  expect(q.answers).toHaveLength(2)
  expect(q.answers[0][0].text).not.toBe(q.answers[1][0].text)
 }
 expect(lesson.actionQuestion).toBe('destination')
 expect(lesson.actions).toEqual(['going','walking','running'])
})
it('shares destination verb choices and rejects unrelated objects',()=>{
 const lesson=requestLesson(5),capability=actionCapabilities(lesson)
 for(const action of ['going','walking','running']){
  const objects=capability.objects(action)
  expect(objects.length).toBeGreaterThan(0)
  expect(objects.every(object=>object.categories.includes('destination'))).toBe(true)
  const pair=composeLessonAction(lesson,{subject:'I',action,object:'to the hotel',determiner:'the'})
  expect(pair.answer.english).toBe(`I am ${action} to the hotel.`)
  expect(pair.question.english).toBe(`Where am I ${action}?`)
 }
 expect(composeLessonAction(lesson,{subject:'I',action:'walking',object:'to the hotel'}).answer.thai).toContain('เดินไปที่โรงแรม')
 expect(()=>capability.objects('eating')).toThrow()
 expect(()=>composeLessonAction(lesson,{subject:'I',action:'walking',object:'an apple'})).toThrow()
})
