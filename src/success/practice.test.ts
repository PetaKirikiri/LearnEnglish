// @vitest-environment happy-dom
import { afterEach, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { successCourse, successLessons } from './course'
import { lessonPractice, recordAnswer, requiresAudioCheck, loadProgress, progressKey } from './practice'
import type { Progress } from '../hotel/course'
import { loadWordFamiliarity, recordWordExposure, wordOpacity, type WordFamiliarity } from '../hotel/wordFamiliarity'
afterEach(()=>localStorage.clear())

it('learns and fades how much and how many as separate whole units',()=>{
  const course=lessonPractice(successLessons[0])
  let memory:WordFamiliarity={}
  for(let n=0;n<5;n++)memory=recordWordExposure(memory,'How much',true,false,undefined,course.wordUnits('How much'))
  memory=recordWordExposure(memory,'How many',true,false,undefined,course.wordUnits('How many'))
  expect(Object.keys(memory)).toEqual(['how much','how many'])
  expect(memory['how much']).toEqual({seen:5,strength:5})
  expect(wordOpacity(memory,'How much')).toBeLessThan(wordOpacity(memory,'How many'))
  localStorage.setItem(course.wordMemoryKey('tester'),JSON.stringify(memory))
  expect(loadWordFamiliarity('tester',course.wordMemoryKey('tester'))).toEqual(memory)
})
it('ships matching recordings and distinct Thai alternatives for every item',()=>{
  const manifest=JSON.parse(readFileSync('public/audio/success/voice-manifest.json','utf8'))
  for(const q of successCourse.questions) {
    expect(q.answers).toHaveLength(2)
    expect(q.answers[0][0].text).not.toBe(q.answers[1][0].text)
    expect(q.answers.every(a=>/[\u0e00-\u0e7f]/.test(a[0].text))).toBe(true)
    expect(readFileSync(`public${q.audioUrl}`).subarray(0,4).toString()).toBe('RIFF')
    expect(manifest[q.audioUrl.split('/').at(-1)!].text).toBe(q.english)
  }
})
it('introduces in the specified order, repeats, and requires unassisted audio evidence',()=>{
  const course=lessonPractice(successLessons[0])
  let p:Progress={},previous:string|undefined
  const total=successCourse.questions.length
  for(let n=0;n<total*3;n++) {
    const q=course.nextQuestion(p,previous)
    expect(q.id).toBe(successCourse.questions[n%total].id)
    expect(requiresAudioCheck(p,q)).toBe(n>=total*2)
    p=recordAnswer(p,q,true,false,n+1,requiresAudioCheck(p,q));previous=q.id
    if(n<total*3-1)expect(course.isSkillComplete(p)).toBe(false)
  }
  expect(course.isSkillComplete(p)).toBe(true)
  localStorage.setItem(progressKey('tester'),JSON.stringify(p))
  expect(loadProgress('tester')).toEqual(p)
  expect(loadProgress('someone-else')).toEqual({})
  p=recordAnswer(p,successCourse.questions[0],true,true,22,true)
  expect(course.isSkillComplete(p)).toBe(false)
  expect(course.nextQuestion(p,previous)).toBeDefined()
})
it('ignores corrupt evidence and other courses',()=>{
  localStorage.setItem('padel:v1:tester',JSON.stringify({people:{seen:[],correct:50,attempts:50}}))
  expect(loadProgress('tester')).toEqual({})
  localStorage.setItem(progressKey('tester'),'{bad')
  expect(loadProgress('tester')).toEqual({})
})
