// @vitest-environment happy-dom
import { afterEach, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { padelQuestions, skills, skillNames, loadProgress, nextQuestion, isSkillComplete, recordAnswer, progressKey } from './course'
import { padelPairs } from './content'
import { clubPairs } from './clubContent'
import { padelWordGlosses, padelWordProfiles, padelWordExamples } from './wordData'
import { wordProfileSchema } from '../learning/wordInfo/types'
import { isPadelLineEntry, padelLineEntryUrl } from './lineEntry'
import type { Progress } from '../hotel/course'
import { pairOrder } from './progression'

afterEach(() => localStorage.clear())
it('serves direct and nested Padel routes from the app on Vercel', () => {
  const config = JSON.parse(readFileSync('vercel.json','utf8'))
  for (const source of ['/padel','/padel/:path*','/hotel','/hotel/:path*']) expect(config.rewrites).toContainEqual({source,destination:'/index.html'})
})
it('has balanced, unique, ordered content with distinct choices', () => {
  expect(padelQuestions).toHaveLength(292)
  expect(new Set(padelQuestions.map(q => q.id)).size).toBe(292)
  expect(skillNames).toHaveLength(skills.length)
  for (const skill of skills) expect(padelQuestions.filter(q => q.skill === skill)).toHaveLength(padelPairs.filter(p=>p[1]===skill).length*2)
  expect(padelQuestions.every(q=>skills.includes(q.skill))).toBe(true)
  expect(padelQuestions.map(q=>pairOrder.get(q.pairId))).toEqual(padelQuestions.map(q=>pairOrder.get(q.pairId)).sort((a,b)=>a!-b!))
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
it('serves only Padel and begins with familiar people and equipment', () => {
  expect(JSON.stringify(padelQuestions)).not.toMatch(/pilates|instructor|reformer|grip socks|studio|class_booking/i)
  expect(skills).not.toContain('class_booking')
  expect(padelQuestions.filter(q=>q.skill==='people').slice(0,2).map(q=>q.english)).toEqual(['The player.','The coach.'])
  expect(padelQuestions.filter(q=>q.skill==='gear').slice(0,4).map(q=>q.english)).toEqual(['A racket.','A ball.','The net.','The court.'])
  for (const skill of skills) expect(padelQuestions.some(q=>q.skill===skill)).toBe(true)
})
it('retains real club operations but teaches their language foundations first',()=>{
  expect(clubPairs).toHaveLength(44)
  for(const skill of ['court_booking','player_numbers','prices','racket_hire','balls_grips','rain','court_rules']) {
    expect(clubPairs.filter(p=>p[1]===skill).length).toBeGreaterThanOrEqual(6)
  }
  expect(pairOrder.get('desk-booking-1')!).toBeGreaterThan(pairOrder.get('ongoing-3')!)
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
  expect(padelWordProfiles.customer.nouns).toContainEqual({singular:'customer',plural:'customers',countability:'countable'})
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
    expect(padelWordProfiles[word].corpus_version).toBe('padel-staff-v2')
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
  expect(loadProgress('alice')).toEqual({people:{seen:[q.id],correct:1,attempts:1}})
})
it('keeps the opening in its two foundation lanes, not later topic sentences', () => {
  expect(nextQuestion({},undefined,0,()=>0).skill).toBe('people')
  expect(nextQuestion({},undefined,1,()=>0).skill).toBe('gear')
  let progress: Progress = {}
  for (const q of padelQuestions.slice(0,6)) for(let i=0;i<3;i++) progress = recordAnswer(progress,q,true,false,i+1,i===2)
  expect(isSkillComplete(progress,'start')).toBe(true)
  expect(nextQuestion(progress,undefined,0,()=>0).skill).toBe('quantity')
  expect(nextQuestion(progress,undefined,1,()=>0).skill).toBe('possession')
  expect(nextQuestion(progress,undefined,3,()=>0).skill).toBe('people')
  expect(['people','gear']).toContain(nextQuestion(progress,undefined,7,()=>0).skill)
  for (const q of padelQuestions) for(let i=0;i<3;i++) progress = recordAnswer(progress,q,true,false,i+10,i===2)
  for (let n=0;n<56;n++) expect(nextQuestion(progress,undefined,n)).toBeDefined()
})
it('drops retired Pilates questions without resetting retained Padel progress', () => {
  const kept = padelQuestions[0]
  localStorage.setItem(progressKey('returning'),JSON.stringify({
    people:{seen:[kept.id,'padel-pilates-people-1-1'],correct:2,attempts:2},
    class_booking:{seen:['padel-pilates-desk-1-1'],correct:1,attempts:1},
  }))
  const progress=loadProgress('returning')
  expect(progress.people.seen).toEqual([kept.id])
  expect(progress.class_booking).toBeUndefined()
  expect(progress.people.correct).toBe(2)
  for(let round=0;round<100;round++) expect(nextQuestion(progress,undefined,round).id).not.toContain('pilates')
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
