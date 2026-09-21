import { describe,expect,it } from 'vitest'
import { examPracticeQuestions as bank } from './examPracticeContent'
import { createExamAssessment, examEvidence, assessmentResults, resumeExamAssessment } from './examReadiness'
import type { ProgressEvent } from './progressData'
import { createPracticeRound } from './quizContent'
import { recordAnswer, type LearningMemory } from './learningMemory'
function answer(questionId:string,roundId:string,n:number,correct=true,helpWords:string[]=[]):ProgressEvent {return {id:`e${n}`,learner_id:'test',kind:'answer',occurred_at:new Date(100000+n*1000).toISOString(),payload:{questionId,roundId,correct,helpWords}}}
describe('exam depth and evidence',()=>{
 it('has three different practice tasks and one reserved context for all 66 vocabulary targets',()=>{
  const targets=new Set(bank.filter(q=>q.examCategory==='vocabulary').map(q=>q.examTarget))
  expect(targets.size).toBe(66)
  for(const target of targets){
   const questions=bank.filter(q=>q.examTarget===target)
   expect(questions.filter(q=>q.examUse==='practice').map(q=>q.examFormat)).toEqual(['meaning','definition','context'])
   expect(questions.filter(q=>q.examUse==='assessment')).toHaveLength(1)
   expect(new Set(questions.map(q=>q.prompt)).size).toBe(4)
  }
 })
 it('never mixes overlapping vocabulary senses as competing answers',()=>{
  for(const q of bank.filter(q=>q.examCategory==='vocabulary'&&q.examFormat!=='meaning'))for(const pair of [['car','taxi'],['train','subway'],['bike','bicycle'],['garden','yard'],['bed','couch'],['bathtub','sink'],['go to bed','go to sleep']])if(pair.includes(q.answer))expect(pair.every(w=>q.choices.includes(w))).toBe(false)
 })
 it('reaches every practice question even if every answer is wrong; never serves a reserved question',()=>{
  let memory:LearningMemory={};const seen=new Set<string>()
  for(let round=0;round<200;round++)for(const q of createPracticeRound(round,memory)){
   expect(q.examUse).toBe('practice');seen.add(q.id);memory=recordAnswer(memory,q,false,round+1,`r${round}`)
  }
  expect(seen.size).toBe(bank.filter(q=>q.examUse==='practice').length)
 })
 it('requires distinct examples across rounds, rejects help and repeated familiar answers, resets after mistakes',()=>{
  const variants=bank.filter(q=>q.examTarget===bank[0].id&&q.examUse==='practice')
  const progress=(events:ProgressEvent[])=>examEvidence(events)[0]
  expect(progress([1,2,3].map(n=>answer(variants[0].id,`r${n}`,n))).secure).toBe(0)
  const independent=variants.map((q,n)=>answer(q.id,`r${n}`,n))
  expect(progress(independent).secure).toBe(1)
  expect(progress(variants.map((q,n)=>answer(q.id,'same-round',n)))).toMatchObject({secure:0})
  expect(progress([...independent,answer(variants[0].id,'new',4,true,['word'])])).toMatchObject({secure:0,review:1})
  expect(progress([...independent,answer(variants[0].id,'new',4,false)])).toMatchObject({secure:0,review:1})
  expect(progress(independent.map(e=>({...e,kind:'legacy_import'})))).toMatchObject({secure:0})
 })
 it('builds exactly ten unseen targets per section, reserves abandoned items and resumes an incomplete test',()=>{
  const questions=createExamAssessment([],()=>0.4)!
  expect(questions).toHaveLength(40)
  for(const category of ['vocabulary','dialogue','grammar','reading']){
   const section=questions.filter(q=>q.examCategory===category)
   expect(section).toHaveLength(10);expect(new Set(section.map(q=>q.examTarget)).size).toBe(10)
  }
  const start:ProgressEvent={id:'start',learner_id:'test',kind:'visit',occurred_at:'2026-09-21',payload:{roundId:'test-round',assessment:true,assessmentQuestionIds:questions.map(q=>q.id),assessmentChoices:questions.map(q=>[...q.choices])}}
  expect(createExamAssessment([start])).toBeNull()
  const answers=questions.map((q,n)=>({...answer(q.id,'test-round',n,n!==0),payload:{...answer(q.id,'test-round',n,n!==0).payload,assessment:true}}))
  const partial=[start,...answers.slice(0,12)]
  expect(assessmentResults(partial)[0]).toMatchObject({complete:false,answered:12})
  expect(resumeExamAssessment(partial)).toMatchObject({index:12,roundId:'test-round'})
  expect(resumeExamAssessment(partial)!.questions.map(q=>q.choices)).toEqual(questions.map(q=>q.choices))
  expect(assessmentResults([start,...answers,...answers])[0]).toMatchObject({complete:true,answered:40})
  expect(assessmentResults([start,...answers])[0].sections.reduce((n,s)=>n+s.correct,0)).toBe(39)
  expect(resumeExamAssessment([start,...answers])).toBeNull()
 })
})
