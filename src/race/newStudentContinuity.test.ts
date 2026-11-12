import {vocabularyLearning} from './vocabularyProgress'
// @vitest-environment happy-dom
import {beforeEach,expect,it} from 'vitest'
import {lessonPracticeTemplate} from './lessonPracticeTemplate'
import {nextPersonalQuestion} from './practiceForecast'
import {curriculumBaseline,evidenceScores,loadEvidence,masteredWords,saveEvidence,vocabularyFamily,type ListeningEvidence} from './generatedPracticeProgress'
import {hierarchyCompatible,hierarchyState} from './wordHierarchy'
import {wordOpacity,wordTokens} from '../learning/wordProgress/model'
import {learningStates} from '../learning/wordProgress/learningLifecycle'

beforeEach(()=>localStorage.clear())
const lessons=[1,2,3,4,5,6] as const
// Call the same selector, template, account evidence and baseline used by
// GeneratedPractice.createRun/next. No alternate vocabulary or scoring algorithm.
const question=(lesson:number,user:string,index:number)=>{
 const template=lessonPracticeTemplate(lesson),events=loadEvidence(user)
 return nextPersonalQuestion(template.level,[],events,'new-student',index,{
  ...template.options,familiar:curriculumBaseline([],events,user),
 })
}

it('starts a new student on the same Current vocabulary in every lesson where the structure permits it',()=>{
 const initial=hierarchyState(new Set())
 expect(initial.noun.current).toEqual(['man','woman','phone','bag'])
 for(const lesson of lessons){
  const user=`fresh-${lesson}`,seen=new Set<string>()
  expect(loadEvidence(user)).toEqual([])
  for(let index=0;index<8;index++){
   const q=question(lesson,user,index)
   expect(hierarchyCompatible(q,initial),`Lesson ${lesson}: ${q.document.english}`).toBe(true)
   for(const word of q.vocabulary.map(vocabularyFamily))if(initial.noun.current.includes(word))seen.add(word)
   expect(q.vocabulary.map(vocabularyFamily)).not.toEqual(expect.arrayContaining(['boy']))
   expect(q.document.english).not.toMatch(/apple|banana/i)
  }
  // Both initial subjects are expressible in every lesson's construction.
  expect([...seen],`Lesson ${lesson} starting nouns`).toEqual(expect.arrayContaining(['man','woman']))
 }
},20000)

it('earns fade and listening proof from scratch, then carries the new frontier into every lesson',()=>{
 const user='new-student-changing-lessons'
 let answered=0
 const learntSubject=()=>['man','woman'].find(word=>hierarchyState(masteredWords([],loadEvidence(user))).noun.completed.includes(word))
 // These are real generated questions and the evidence payload saved by the
 // practice answer handler. No preloaded scores, fabricated targets or mastery.
 // Four noun families and both verb groups now receive fair turns; keep the
 // same real fade/proof requirements while allowing their parallel practice.
 for(;answered<600&&!learntSubject();answered++){
  const lesson=lessons[answered%lessons.length],q=question(lesson,user,answered)
  const events=loadEvidence(user),scores=evidenceScores([],events)
  const event:ListeningEvidence={id:`answer-${answered}`,questionId:q.id,level:lessonPracticeTemplate(lesson).level,
   sentence:q.document.english,targets:q.credit===null?[]:q.targetWords,vocabulary:q.vocabulary,
   correct:true,heard:true,hidden:q.listeningWords.length>0&&q.listeningWords.flatMap(wordTokens).every(w=>wordOpacity(w,scores,{fadeMode:true})===0),
   assisted:false,plays:1,at:new Date(Date.now()+answered).toISOString()}
  saveEvidence(event,user)
 }
 const events=loadEvidence(user),learnt=masteredWords([],events),state=hierarchyState(learnt)
 const completed=learntSubject()
 expect(completed,`no initial subject learnt after ${answered} actual answers`).toBeDefined()
 expect(vocabularyLearning('noun',completed!,learningStates([],events))).toMatchObject({fadeScore:25,confirmations:3})
 expect(state.noun.current).not.toContain(completed)
 expect(state.noun.allowed).toContain('boy')
 for(const lesson of lessons){
  const before=JSON.stringify(loadEvidence(user))
  const questions=Array.from({length:8},(_,index)=>question(lesson,user,index))
  expect(questions.every(q=>hierarchyCompatible(q,state)),`Lesson ${lesson} lost shared frontier`).toBe(true)
  expect(questions.some(q=>q.vocabulary.map(vocabularyFamily).includes('boy')),`Lesson ${lesson} did not pick up boy; Current=${state.noun.current}; questions=${questions.map(q=>q.document.english+' ['+q.targetWords+']').join(' | ')}`).toBe(true)
  expect(JSON.stringify(loadEvidence(user))).toBe(before)
 }
 expect(loadEvidence('another-new-student')).toEqual([])
 expect(hierarchyState(masteredWords([],loadEvidence('another-new-student'))).noun.current).toEqual(['man','woman','phone','bag'])
},30000)

it('keeps subject, verb and object when a new student opens an action lesson',()=>{
 const user='fresh-action-object',state=hierarchyState(new Set())
 const questions=Array.from({length:30},(_,index)=>question(4,user,index))
 expect(state.verb.current).toEqual(['holding','opening','using','talking','listening','walking'])
 for(const q of questions){
  for(const role of ['person','action','object'])expect(q.document.units.some(unit=>unit.role===role),q.document.english+' missing '+role).toBe(true)
  expect(q.level).toBe(6)
 }
 expect(questions.some(q=>q.vocabulary.includes('phone'))).toBe(true)
 expect(questions.some(q=>q.vocabulary.includes('bag'))).toBe(true)
 expect(questions.every(q=>hierarchyCompatible(q,state))).toBe(true)
 // Earn actual verb/object evidence in this structure, then reopen another
 // lesson and return. Merely appearing in the sentence must not credit a word.
 for(let index=0;index<60;index++){
  const q=question(4,user,index),events=loadEvidence(user),scores=evidenceScores([],events)
  saveEvidence({id:`action-${index}`,questionId:q.id,level:6,sentence:q.document.english,
   targets:q.credit===null?[]:q.targetWords,vocabulary:q.vocabulary,correct:true,heard:true,
   hidden:q.listeningWords.length>0&&q.listeningWords.flatMap(wordTokens).every(w=>wordOpacity(w,scores,{fadeMode:true})===0),
   assisted:false,plays:1,at:new Date(Date.now()+index).toISOString()},user)
 }
 const earned=evidenceScores([],loadEvidence(user))
 expect(['holding','opening','using'].some(word=>(earned['en:'+word]??0)>0)).toBe(true)
 expect(['phone','phones','bag','bags'].some(word=>(earned['en:'+word]??0)>0)).toBe(true)
 for(const lesson of [1,6,4]){
  question(lesson,user,0)
  expect(evidenceScores([],loadEvidence(user))).toEqual(earned)
 }
 expect(question(4,user,0).document.units.some(u=>u.role==='action')).toBe(true)
})
