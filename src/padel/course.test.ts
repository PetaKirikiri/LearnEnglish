// @vitest-environment happy-dom
import { afterEach, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { padelQuestions, skills, skillNames, loadProgress, nextQuestion, isSkillComplete, recordAnswer, progressKey } from './course'
import { padelPairs } from './content'
import { pilatesPairs } from './pilatesContent'
import { clubPairs } from './clubContent'
import { padelWordGlosses, padelWordProfiles, padelWordExamples } from './wordData'
import { wordProfileSchema } from '../learning/wordInfo/types'
import { isPadelLineEntry, padelLineEntryUrl } from './lineEntry'
import type { Progress } from '../hotel/course'

afterEach(() => localStorage.clear())
it('serves direct and nested Padel routes from the app on Vercel', () => {
  const config = JSON.parse(readFileSync('vercel.json','utf8'))
  for (const source of ['/padel','/padel/:path*','/hotel','/hotel/:path*']) expect(config.rewrites).toContainEqual({source,destination:'/index.html'})
})
it('has balanced, unique, ordered content with distinct choices', () => {
  expect(padelQuestions).toHaveLength(388)
  expect(new Set(padelQuestions.map(q => q.id)).size).toBe(388)
  expect(skillNames).toHaveLength(skills.length)
  for (const skill of skills) expect(padelQuestions.filter(q => q.skill === skill)).toHaveLength(padelPairs.filter(p=>p[1]===skill).length*2)
  expect(padelQuestions.every(q=>skills.includes(q.skill))).toBe(true)
  expect(padelQuestions.map(q=>skills.indexOf(q.skill))).toEqual(padelQuestions.map(q=>skills.indexOf(q.skill)).sort((a,b)=>a-b))
  for (const [id,skill,english,thai] of padelPairs) {
    expect(english[0]).not.toBe(english[1]); expect(thai[0]).not.toBe(thai[1])
    for (const index of [0,1]) {
      const q = padelQuestions.find(q => q.pairId === id && q.correct === index)!
      expect(q.skill).toBe(skill); expect(q.english).toBe(english[index])
      expect(q.answers[q.correct][0].text).toBe(thai[index])
      expect(q.contrast).toBe(english[1-index])
    }
  }
})
it('interleaves both courses from the start and includes every Pilates pair', () => {
  expect(pilatesPairs).toHaveLength(56)
  for (const pair of pilatesPairs) expect(padelPairs.filter(p => p[0] === pair[0])).toHaveLength(1)
  for (const skill of new Set(pilatesPairs.map(p=>p[1]))) {
    const questions = padelQuestions.filter(q => q.skill === skill)
    expect(questions.filter(q => q.pairId.startsWith('pilates-'))).toHaveLength(8)
    expect(questions.slice(0,4).filter(q => q.pairId.startsWith('pilates-'))).toHaveLength(2)
  }
})
it('covers daily club operations before advanced grammar with real question forms',()=>{
  expect(clubPairs).toHaveLength(50)
  for(const skill of ['court_booking','player_numbers','prices','racket_hire','balls_grips','class_booking','rain','court_rules']) {
    expect(clubPairs.filter(p=>p[1]===skill).length).toBeGreaterThanOrEqual(6)
  }
  expect(skills.indexOf('court_booking')).toBeLessThan(skills.indexOf('ongoing'))
  const texts=clubPairs.flatMap(p=>p[2]).join(' ')
  for(const phrase of ['What time','How many','How long','per hour','per court','hire a racket','grip tape','rain','rules','fifteen thirty']) expect(texts).toContain(phrase)
  expect(padelWordProfiles.hire.verbs.some(v=>v.base==='hire')).toBe(true)
  expect(padelWordGlosses.serve).toContain('พาเดล')
})
it('keeps the same people and objects in grammar contrasts', () => {
  for (const [,skill,english] of padelPairs.filter(p => ['finished','plans'].includes(p[1]))) {
    expect(['finished','plans']).toContain(skill)
    for (const noun of ['guest','coach','court','booking','confirmation','instructor','customer','studio','mats','equipment','class']) {
      expect(english[0].includes(noun)).toBe(english[1].includes(noun))
    }
    expect(english[0].split(' ')[0]).toBe(english[1].split(' ')[0])
  }
})
it('uses customer throughout the course and word help', () => {
  expect(padelQuestions.some(q=>/\bclients?\b/i.test(q.english))).toBe(false)
  expect(padelQuestions.some(q=>q.english==='The customer.')).toBe(true)
  expect(padelWordGlosses.customer).toBe('ลูกค้า')
  expect(padelWordProfiles.customers.nouns).toContainEqual({singular:'customer',plural:'customers',countability:'countable'})
})
it('ships real matching recordings for every question', () => {
  const manifest = JSON.parse(readFileSync('public/audio/padel/voice-manifest.json','utf8'))
  for (const q of padelQuestions) {
    const file = readFileSync(`public${q.audioUrl}`)
    expect(file.subarray(0,4).toString()).toBe('RIFF')
    expect(file.length).toBeGreaterThan(4800)
    expect(manifest[q.audioUrl.split('/').at(-1)!].text).toBe(q.english)
    expect(manifest[q.audioUrl.split('/').at(-1)!].seconds).toBeGreaterThan(0.3)
  }
})
it('has Thai help, valid profiles and actual examples for every word', () => {
  const words = new Set(padelQuestions.flatMap(q => q.english.toLowerCase().match(/[a-z]+/g)!))
  for (const word of words) {
    expect(padelWordGlosses[word],word).toMatch(/[\u0e00-\u0e7f]/)
    expect(wordProfileSchema.safeParse(padelWordProfiles[word]).success,word).toBe(true)
    expect(padelWordProfiles[word].corpus_version).toBe('padel-pilates-staff-v1')
    expect(new Set(padelWordProfiles[word].nouns.map(n => n.singular)).size).toBe(padelWordProfiles[word].nouns.length)
    expect(new Set(padelWordProfiles[word].verbs.map(v => v.base)).size).toBe(padelWordProfiles[word].verbs.length)
    const sentence = padelQuestions.find(q => q.english.toLowerCase().match(/[a-z]+/g)?.includes(word))!.english
    expect(padelWordExamples(word,sentence)[0]).toBe(sentence)
    for (const example of padelWordExamples(word,sentence)) expect(padelQuestions.some(q => q.english === example)).toBe(true)
  }
})
it('keeps learner/course progress isolated and rejects stale or corrupt content', () => {
  const q = padelQuestions[0]
  localStorage.setItem('hotel:v1:alice',JSON.stringify({people:{seen:[q.id],correct:5,attempts:5}}))
  expect(loadProgress('alice')).toEqual({})
  const progress = recordAnswer({},q,true,false)
  localStorage.setItem(progressKey('alice'),JSON.stringify(progress))
  expect(loadProgress('alice')).toEqual(progress)
  expect(loadProgress('bob')).toEqual({})
  localStorage.setItem(progressKey('alice'),JSON.stringify({people:{seen:['hotel-1',q.id,q.id,5],correct:1,attempts:1},gear:{seen:[],correct:-1,attempts:0}}))
  expect(loadProgress('alice')).toEqual(progress)
})
it('mixes two current topics, keeps review, and continues after completion', () => {
  expect(nextQuestion({},undefined,0,()=>0).skill).toBe('people')
  expect(nextQuestion({},undefined,1,()=>0).skill).toBe('gear')
  let progress: Progress = {}
  for (const q of padelQuestions.filter(q => ['people','gear'].includes(q.skill))) progress = recordAnswer(progress,q,true,false)
  expect(isSkillComplete(progress,'people')).toBe(true)
  expect(nextQuestion(progress,undefined,0,()=>0).skill).toBe('quantity')
  expect(nextQuestion(progress,undefined,1,()=>0).skill).toBe('court_booking')
  expect(nextQuestion(progress,undefined,3,()=>0).skill).toBe('people')
  expect(nextQuestion(progress,undefined,7,()=>0).skill).toBe('gear')
  for (const q of padelQuestions) progress = recordAnswer(progress,q,true,false)
  for (let n=0;n<56;n++) expect(nextQuestion(progress,undefined,n)).toBeDefined()
})
it('marks assisted answers as practice, not completed questions', () => {
  expect(recordAnswer({},padelQuestions[0],true,true).people.seen).toEqual([])
  expect(recordAnswer({},padelQuestions[0],false,false).people.correct).toBe(0)
})
it('uses the shared LINE entry with an explicit Padel return mode', () => {
  for (const signup of [false,true]) {
    const url = new URL(padelLineEntryUrl(signup))
    expect(url.origin).toBe('https://liff.line.me')
    expect(url.searchParams.get('mode')).toBe('padel')
    expect(url.searchParams.has('intent')).toBe(signup)
    expect(isPadelLineEntry(url.search)).toBe(true)
    expect(isPadelLineEntry(`?liff.state=${encodeURIComponent(url.search)}`)).toBe(true)
  }
  expect(isPadelLineEntry('?app=englishsuccess&mode=hotel')).toBe(false)
})
