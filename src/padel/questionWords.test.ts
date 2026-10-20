// @vitest-environment happy-dom
import { expect, it } from 'vitest'
import { questionWordPairs, questionWordSkills } from './questionWords'
import { padelQuestions, nextQuestionWord, recordAnswer, loadProgress, progressKey, isSkillComplete } from './course'
import type { Progress } from '../hotel/course'

it('covers all eight forms in 64 balanced audio questions without noun shortcuts',()=>{
  const questions=padelQuestions.filter(q=>questionWordSkills.includes(q.skill))
  expect(questions).toHaveLength(64)
  for(const prefix of ['Who','What','Where','When','Why','How do','How long','How many']) expect(questions.filter(q=>q.english.startsWith(prefix))).toHaveLength(8)
  for(const skill of questionWordSkills) {
    expect(questions.filter(q=>q.skill===skill&&q.correct===0)).toHaveLength(8)
    expect(questions.filter(q=>q.skill===skill&&q.correct===1)).toHaveLength(8)
  }
  const questionWords=new Set(['who','what','where','when','why','how','long','many','the'])
  const stable=(text:string)=>(text.toLowerCase().match(/[a-z]+/g)??[]).filter(w=>!questionWords.has(w)).sort()
  for(const [id,,english] of questionWordPairs) expect(stable(english[0]),id).toEqual(stable(english[1]))
})

it('starts this topic immediately, reaches every question and reviews earlier pairs',()=>{
  let progress:Progress={},previous:string|undefined,reviews=0
  const seen=new Set<string>()
  for(let round=0;round<160;round++) {
    const q=nextQuestionWord(progress,previous,round,()=>0)
    expect(questionWordSkills).toContain(q.skill)
    if(round<2) expect(q.skill).toBe(questionWordSkills[round])
    if(isSkillComplete(progress,q.skill)) reviews++
    seen.add(q.id)
    progress=recordAnswer(progress,q,true,false)
    previous=q.id
  }
  expect(seen.size).toBe(64)
  expect(reviews).toBeGreaterThan(0)
  const old=padelQuestions.find(q=>q.skill==='people')!
  progress=recordAnswer(progress,old,true,false)
  localStorage.setItem(progressKey('question-test'),JSON.stringify(progress))
  expect(loadProgress('question-test')).toEqual(progress)
  localStorage.removeItem(progressKey('question-test'))
})
