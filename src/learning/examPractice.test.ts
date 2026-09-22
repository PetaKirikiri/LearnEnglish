import { describe, expect, it } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { finalExamVocabulary } from '../content/finalExamVocabulary'
import { readings } from '../content/readings'
import { examPracticeQuestions, buildExamExplainers } from './examPracticeContent'
import { createPracticeRound, getQuizCatalogue, getLessonAudioItems } from './quizContent'
import { recordAnswer, type LearningMemory } from './learningMemory'
import { questionProgressKey } from './progressData'
import { buildWordConfidence } from './wordConfidence'

describe('textbook exam practice in the existing flow',()=>{
 it('covers all seven photographed vocabulary pages, ten place relations and both readings',()=>{
  expect(finalExamVocabulary).toHaveLength(64)
  expect([...new Set(finalExamVocabulary.map(v=>v.page))]).toEqual([34,36,38,40,46,48,50])
  expect(examPracticeQuestions).toHaveLength(424)
  expect(examPracticeQuestions.filter(q=>q.examCategory==='grammar'&&q.sceneObject===undefined).map(q=>q.answer)).toEqual(['under','behind','in front of','between','beside','above','on','in','over','next to'])
  expect(examPracticeQuestions.filter(q=>q.examCategory==='dialogue')).toHaveLength(48)
  expect(examPracticeQuestions.filter(q=>q.examCategory==='reading'&&q.sourceReadingId==='different-houses')).toHaveLength(33)
  expect(examPracticeQuestions.filter(q=>q.examCategory==='reading'&&q.sourceReadingId==='a-train-above-you')).toHaveLength(39)
  for(const word of ['bike','go to sleep']) expect(examPracticeQuestions.some(q=>q.spokenText===word)).toBe(true)
 })
 it('starts immediately with a sentence blank and balances the four exam categories',()=>{
  const round=createPracticeRound()
  expect(round).toHaveLength(10)
  expect(round[0].placeRelation).toBeTruthy()
  expect(round[0].prompt).toContain('_____')
  for(const category of ['vocabulary','dialogue','grammar','reading']) expect(round.filter(q=>q.examCategory===category).length).toBeGreaterThanOrEqual(2)
  expect(new Set(round.map(q=>q.id)).size).toBe(10)
  expect(createPracticeRound()).toEqual(round)
  const totals=new Map<string,number>()
  for(let i=0;i<4;i++) for(const q of createPracticeRound(i)) totals.set(q.examCategory!, (totals.get(q.examCategory!)??0)+1)
  expect([...totals.values()]).toEqual([10,10,10,10])
 })
 it('serves only exam topics even with older learner history, without resetting saved answers',()=>{
  const c=getQuizCatalogue(),old=c.sentences.find(q=>!q.examCategory)!,other=c.vocabulary.find(q=>!q.examCategory)!
  const memory=recordAnswer(recordAnswer({},old,false,50,'one'),other,true,60,'one')
  const copy=JSON.stringify(memory),round=createPracticeRound(0,memory)
  expect(round.filter(q=>q.examCategory)).toHaveLength(10)
  expect(round.map(q=>q.id)).not.toContain(old.id)
  expect(round.map(q=>q.id)).not.toContain(other.id)
  expect(JSON.stringify(memory)).toBe(copy)
 })
 it('revisits an incorrect exam item and eventually reaches every supplied vocabulary entry',()=>{
  const wrong=examPracticeQuestions.find(q=>q.examCategory==='vocabulary')!
  let memory:LearningMemory=recordAnswer({},wrong,false,1,'wrong')
  expect(Array.from({length:4},(_,i)=>createPracticeRound(i,memory)).flat().some(q=>q.id===wrong.id)).toBe(true)
  const seen=new Set<string>()
  for(let round=0;round<150;round++) for(const q of createPracticeRound(round,memory)) {
   seen.add(q.id); memory=recordAnswer(memory,q,true,100+round,`round-${round}`)
  }
  expect(examPracticeQuestions.filter(q=>q.examUse!=='assessment').every(q=>seen.has(q.id))).toBe(true)
 })
 it('has four distinct answers, no synonymous place distractors and passage evidence',()=>{
  for(const q of examPracticeQuestions) {
   expect(q.choices).toHaveLength(4)
   expect(new Set(q.choices).size).toBe(4)
   expect(q.choices.filter(c=>c===q.answer)).toHaveLength(1)
   if(q.passage) expect(readings.find(r=>r.id===q.sourceReadingId)!.paragraphs.some(p=>p.includes(q.passage!))).toBe(true)
   if(q.examCategory==='vocabulary' && q.examFormat!=='meaning') for(const pair of [['window','door'],['dining room','kitchen'],['living room','bedroom'],['taxi','bus']]) if(pair.includes(q.answer)) expect(pair.every(word=>q.choices.includes(word)), q.id).toBe(false)
   if(q.placeRelation) for(const pair of [['above','over'],['beside','next to']]) expect(pair.every(p=>q.choices.includes(p))).toBe(false)
  }
 })
 it('keeps Thai explanations and audible masked/full recordings for all new content',()=>{
  const explainers=buildExamExplainers()
  for(const q of examPracticeQuestions) {
   expect(explainers.find(e=>e.question_id===q.id)?.clue_th).toMatch(/[ก-๙]/)
   for(const url of [q.audioUrl,q.gapAudioUrl,q.contextAudioUrl].filter(Boolean)) {
    expect(existsSync(`public${url}`)).toBe(true)
    const wav=readFileSync(`public${url}`)
    expect(wav.length).toBeGreaterThan(10000)
    expect(wav.subarray(100).some(byte=>byte!==0)).toBe(true)
   }
  }
 })
 it('plays only the visible prompt before sentence answers, and keeps fifth rounds inside the exam syllabus',()=>{
  const audio=new Map(getLessonAudioItems().map(item=>[item.audioUrl,item.spokenText]))
  const recordings=JSON.parse(readFileSync('public/audio/lessons/voice-manifest.json','utf8')) as Record<string,{text:string}>
  for(const q of examPracticeQuestions) for(const url of [q.audioUrl,q.gapAudioUrl,q.contextAudioUrl].filter((url):url is string=>Boolean(url))) {
   expect(recordings[url.split('/').at(-1)!]?.text, `Outdated recording: ${url}`).toBe(audio.get(url))
  }
  for(const q of examPracticeQuestions.filter(q=>q.mode==='sentences')) expect(audio.get(q.gapAudioUrl!)).toBe(q.prompt)
  for(const round of [4,9,14]) {
   const questions=createPracticeRound(round)
   expect(questions).toHaveLength(10)
   expect(questions.filter(q=>q.examCategory)).toHaveLength(10)
  }
 })
 it('does not overwrite older vocabulary scoring keys or award word mastery for reading answers',()=>{
  const c=getQuizCatalogue(),questions=[...c.vocabulary,...c.sentences]
  const keys=new Map<string,string>()
  for(const q of questions) {
   const key=questionProgressKey(q)
   expect(keys.has(key),key).toBe(false)
   keys.set(key,q.answer)
  }
  const rows=buildWordConfidence([],questions)
  expect(rows.some(r=>r.word==='a train ticket.')).toBe(false)
  expect(rows.some(r=>r.word==='bathroom')).toBe(true)
 })
})
