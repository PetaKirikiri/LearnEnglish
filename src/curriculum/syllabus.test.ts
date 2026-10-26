// @vitest-environment node
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { afterEach, expect, it } from 'vitest'
import snapshot from './syllabus.snapshot.json'
import { curriculumSchema } from './schema'
import { installCurriculum } from './database'
import { buildCurriculumSeed } from './seed'
import { buildSyllabus, tokenize } from './syllabus'
import { contrasts, expandedQuestions } from './expandedContent'
import { generalQuestions } from './generalContent'
import { beginnerQuestions } from './beginnerContent'
import { introductionQuestions } from './introductions'
import { hotelQuestions, nextQuestion, recordAnswer, requiresAudioCheck, isSkillReady, type Progress } from '../hotel/course'
import { buildHotelWordProfiles } from '../hotel/wordProfiles'
import { wordProfileSchema } from '../learning/wordInfo/types'
const original=structuredClone(buildCurriculumSeed())
afterEach(()=>installCurriculum(original))

it('builds real course neighbours and useful word forms for the entire expanded corpus',()=>{
  const profiles=buildHotelWordProfiles(snapshot.questions,snapshot.revision)
  for(const item of snapshot.vocabulary) {
    const p=wordProfileSchema.parse(profiles[item.word])
    expect(p.occurrences,item.word).toBeGreaterThan(0)
    expect(p.before.length+p.after.length,item.word).toBeGreaterThan(0)
  }
  expect(profiles.refund.nouns[0]).toMatchObject({singular:'refund',plural:'refunds'})
  expect(profiles.offered.verbs[0]).toMatchObject({base:'offer',past:'offered'})
})

it('links every word, frame family and question and preserves every old item',()=>{
  const data=curriculumSchema.parse(snapshot)
  expect(data.structures).toHaveLength(40)
  expect(data.structures.reduce((n,s)=>n+s.frames.length,0)).toBeGreaterThanOrEqual(120)
  expect(data.questions).toHaveLength(2630)
  expect(data.vocabulary.length).toBeGreaterThanOrEqual(493)
  expect(buildSyllabus(Object.fromEntries(data.vocabulary.map(w=>[w.word,w.thai])))).toEqual(data)
  for(const q of original.questions) expect(data.questions.find(row=>row.id===q.id)).toEqual(q)
  const bad=structuredClone(snapshot); bad.vocabulary.pop()
  expect(curriculumSchema.safeParse(bad).success).toBe(false)
})

it('holds incidental vocabulary and word order steady between new meaning alternatives',()=>{
  for(const c of contrasts.filter(c=>c.kind==='meaning')) for(const [a,b] of c.rows) {
    const stable=(s:string)=>tokenize(s).filter(w=>!c.focus.includes(w))
    expect(stable(a),c.node).toEqual(stable(b))
    expect(a,c.node).not.toBe(b)
  }
  for(const q of expandedQuestions().filter(q=>q.grammar?.kind==='form')) {
    expect(q.grammar!.prompt!.replace('_____',q.answers[q.correct][0].text)).toBe(q.english)
    expect(q.grammar!.prompt!.replace('_____',q.answers[1-q.correct][0].text)).toBe(q.grammar!.contrast)
  }
})

it('has matching neural audio including silent blanks for all new questions',()=>{
  const manifest=JSON.parse(readFileSync('public/audio/hotel/voice-manifest.json','utf8'))
  for(const q of [...expandedQuestions(),...generalQuestions(),...beginnerQuestions(),...introductionQuestions()]) for(const [url,text] of [[q.audioUrl,q.english],...(q.grammar?.promptAudioUrl?[[q.grammar.promptAudioUrl,q.grammar.prompt!]]:[])]) {
    const name=url.split('/').at(-1)!, clip=readFileSync(`public${url}`)
    expect(manifest[name].text).toBe(text)
    expect(manifest[name].fingerprint).toBe(createHash('sha256').update(`kokoro-1.0-heart-v1|0.95|0.65|${text}`).digest('hex'))
    expect(clip.subarray(0,4).toString()).toBe('RIFF')
    expect(clip.length).toBeGreaterThan(4800)
  }
})

it('honours prerequisites, reaches every exercise and keeps reviewing',()=>{
  const data=installCurriculum(snapshot)
  let progress:Progress={},previous:string|undefined,reviewCount=0
  const seen=new Set<string>()
  for(let round=0;round<16000;round++) {
    const q=nextQuestion(progress,previous,round,()=>0,1000)
    expect(q).toBeDefined()
    const nodeId=data.courseSkills.find(s=>s.skill===q.skill)!.nodeId
    const parents=data.skills.find(n=>n.id===nodeId)!.prerequisites
    const priorGroups=data.courseSkills.filter(s=>parents.includes(s.nodeId))
    expect(priorGroups.every(s=>isSkillReady(progress,s.skill)),q.id).toBe(true)
    if(isSkillReady(progress,q.skill)) reviewCount++
    seen.add(q.id);previous=q.id;progress=recordAnswer(progress,q,true,false,1000,requiresAudioCheck(progress,q))
  }
  expect(seen.size).toBe(hotelQuestions.length)
  expect(reviewCount).toBeGreaterThan(100)
  expect(nextQuestion(progress,previous,16000,()=>0,1000)).toBeDefined()
},60000)

it('does not unlock the next stage by assisted answers or exposure alone',()=>{
  installCurriculum(snapshot)
  let progress:Progress={}
  for(let round=0;round<300;round++) {
    const q=nextQuestion(progress,undefined,round,()=>0,1000)
    expect(['roles','object_forms']).toContain(q.skill)
    progress=recordAnswer(progress,q,true,true,1000)
  }
  expect(isSkillReady(progress,'roles')).toBe(false)
})
