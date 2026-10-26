// @vitest-environment happy-dom
import { expect, it } from 'vitest'
import { questionWordPairs, questionWordSkills, questionWordReviews } from './questionWords'
import { revisedPadelPairs } from './contentRevisions'
import { padelQuestions, nextQuestionWord, recordAnswer, loadProgress, progressKey, isSkillComplete, requiresAudioCheck } from './course'
import type { Progress } from '../hotel/course'

it('covers all eight forms without forcing equal template counts or noun shortcuts',()=>{
  const questions=padelQuestions.filter(q=>questionWordSkills.includes(q.skill))
  expect(questions).toHaveLength(64)
  for(const prefix of ['Who','What','Where','When','Why','How','How long','How many']) expect(questions.some(q=>q.english.startsWith(prefix))).toBe(true)
  for(const skill of questionWordSkills) {
    expect(questions.filter(q=>q.skill===skill&&q.correct===0)).toHaveLength(8)
    expect(questions.filter(q=>q.skill===skill&&q.correct===1)).toHaveLength(8)
  }
  const functionWords=new Set(['who','what','where','when','why','how','long','many','often','the','a','another','for','with','against','do','is','are','have','will','should','i','me','my','we','our','she','not','still','need','to'])
  const lemmas: Record<string,string> = {booked:'book',booking:'book',paid:'pay',arriving:'arrive',arrived:'arrive'}
  for(const [id,,english] of questionWordPairs) {
    const review=questionWordReviews[id]
    expect(review.scenario.length,id).toBeGreaterThan(30)
    expect(review.target.length,id).toBeGreaterThan(3)
    const stable=(text:string)=>(text.toLowerCase().match(/[a-z]+/g)??[])
      .filter(w=>!functionWords.has(w) && !(review.target==='what time / what day' && ['time','day'].includes(w)))
      .map(w=>lemmas[w]??w).sort()
    expect(stable(english[0]),id).toEqual(stable(english[1]))
  }
})

it('does not bring the rejected artificial sentences back into the course',()=>{
  const texts=padelQuestions.map(q=>q.english)
  for(const rejected of ['What is on the court?','What is at reception?','What is by the gate?','What is in the changing room?','Who did you find?','Why do I cancel my booking?','Why do I change my booking?','How long can the coaches teach?','Please return the rackets when you arrive.','Would you like to cancel a court?']) expect(texts).not.toContain(rejected)
  expect(texts).toContain('Who are you playing with?')
  expect(texts).toContain('Who are you playing against?')
})

it('retains unchanged progress but requires practice and new audio for revised content',()=>{
  const changed=padelQuestions.filter(q=>/-v2-/.test(q.id))
  expect(changed).toHaveLength(54)
  const unchanged=padelQuestions.find(q=>q.id==='padel-questions-2-1-1')!
  const revised=padelQuestions.find(q=>q.id==='padel-questions-1-1-v2-1')!
  const progress=recordAnswer({},unchanged,true,false)
  progress[revised.skill]={seen:['padel-questions-1-1-1'],correct:1,attempts:1}
  localStorage.setItem(progressKey('revised-test'),JSON.stringify(progress))
  const loaded=loadProgress('revised-test')
  expect(loaded[unchanged.skill].seen).toContain(unchanged.id)
  expect(loaded[revised.skill].seen).toEqual([])
  expect(isSkillComplete(loaded,revised.skill)).toBe(false)
  for(const q of changed) expect(q.audioUrl).toBe(`/audio/padel/${q.id}.wav`)
  for(const id of revisedPadelPairs) expect(padelQuestions.filter(q=>q.pairId===id).every(q=>q.id.includes('-v2-'))).toBe(true)
  localStorage.removeItem(progressKey('revised-test'))
})

it('requires foundations even on the topic route, then reaches all questions with review',()=>{
  let progress:Progress={},previous:string|undefined,reviews=0
  const seen=new Set<string>()
  for(let round=0;round<1500;round++) {
    const q=nextQuestionWord(progress,previous,round,()=>0)
    if(round<2) expect(q.skill).toBe(['people','gear'][round])
    if(isSkillComplete(progress,q.skill)) reviews++
    seen.add(q.id)
    progress=recordAnswer(progress,q,true,false,round+1,requiresAudioCheck(progress,q))
    previous=q.id
  }
  expect(seen.size).toBe(padelQuestions.length)
  expect(reviews).toBeGreaterThan(0)
  const old=padelQuestions.find(q=>q.skill==='people')!
  progress=recordAnswer(progress,old,true,false)
  localStorage.setItem(progressKey('question-test'),JSON.stringify(progress))
  expect(loadProgress('question-test')).toEqual(progress)
  localStorage.removeItem(progressKey('question-test'))
})
