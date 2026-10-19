// @vitest-environment node
import { expect, it } from 'vitest'
import { generalPairs, generalQuestions, everydayActions } from './generalContent'
import snapshot from './syllabus.snapshot.json'
import { buildHotelWordProfiles } from '../hotel/wordProfiles'

const words=(s:string)=>s.toLowerCase().match(/[a-z]+(?:'[a-z]+)*/g)??[]

it('adds 2,196 real listening questions across everyday situations and every section',()=>{
  const questions=generalQuestions()
  expect(questions).toHaveLength(2196)
  expect(new Set(questions.map(q=>q.id)).size).toBe(2196)
  expect(new Set(generalPairs.map(p=>p.node))).toEqual(new Set(snapshot.skills.map(s=>s.id)))
  const domains=['Home','Family','Food','Work','Study','Shopping','Travel','Leisure']
  for(const domain of domains) expect(questions.filter(q=>q.grammar?.domain===domain).length,domain).toBeGreaterThan(100)
  expect(questions.filter(q=>q.correct===0)).toHaveLength(1098)
  expect(questions.filter(q=>q.correct===1)).toHaveLength(1098)
  for(let i=0;i<questions.length;i+=2) {
    expect(questions[i].answers).toEqual(questions[i+1].answers)
    expect(questions[i].english).not.toBe(questions[i+1].english)
    expect(questions[i].grammar?.contrast).toBe(questions[i+1].english)
    expect(questions[i].grammar?.phase).toBe(questions[i+1].grammar?.phase)
    for(const answer of questions[i].answers) expect(answer[0].text).toMatch(/[\u0E00-\u0E7F]/)
  }
})

it('keeps lexical content constant across every pair: only grammar or grammatical roles change',()=>{
  const lemmas=new Map(everydayActions.flatMap(a=>[a.base,a.third,a.past,a.participle,a.ing].map(w=>[w,a.base] as const)))
  const grammar=new Set(['am','is','are','was','were','be','been','being','have','has','had','will','would','can','could','may','must','should','do','does','did','not','i','me','my','mine','you','your','yours','she','her','hers','he','him','his','we','us','our','ours','they','them','their','theirs','this','that','these','those','before','after','and','but','although','because','whether','why','who','whom','a','in','front','of','behind'])
  for(const p of generalPairs) {
    const stable=(s:string)=>words(s).filter(w=>!grammar.has(w)).map(w=>lemmas.get(w)??w).sort()
    expect(stable(p.pair[0]),p.id).toEqual(stable(p.pair[1]))
    expect(p.pair[2],p.id).not.toBe(p.pair[3])
  }
})

it('does not label already practised general sentences as unseen transfer',()=>{
  const practised=new Set(snapshot.questions.filter(q=>q.grammar.phase==='practice').map(q=>q.english.toLowerCase()))
  for(const q of generalQuestions().filter(q=>q.grammar?.phase==='transfer')) expect(practised.has(q.english.toLowerCase()),q.id).toBe(false)
})

it('does not inflate the bank with identical question and answer pairs',()=>{
  const signatures=snapshot.questions.map(q=>JSON.stringify([q.english.toLowerCase(),q.grammar.kind,q.answers.map(a=>a.map(s=>s.text).join('')).sort()]))
  expect(new Set(signatures).size).toBe(signatures.length)
})

it('provides verb forms for every everyday action',()=>{
  const profiles=buildHotelWordProfiles(snapshot.questions,snapshot.revision)
  for(const a of everydayActions) for(const word of [a.base,a.third,a.past,a.participle,a.ing]) {
    if(profiles[word]) expect(profiles[word].verbs.some(v=>v.base===a.base),word).toBe(true)
  }
})

it('keeps both relevant meanings for forms reused across everyday situations',()=>{
  const meanings=new Map(snapshot.vocabulary.map(w=>[w.word,w.thai]))
  expect(meanings.get('book')).toContain('จอง')
  expect(meanings.get('book')).toContain('หนังสือ')
  expect(meanings.get('free')).toContain('ว่าง')
  expect(meanings.get('water')).toContain('รดน้ำ')
  expect(meanings.get('order')).toContain('สั่ง')
  expect(meanings.get('called')).toContain('โทรหา')
})
