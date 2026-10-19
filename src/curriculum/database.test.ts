// @vitest-environment happy-dom
import { beforeEach, expect, it, vi } from 'vitest'
import { buildCurriculumSeed } from './seed'
import { curriculumSchema } from './schema'
import { getCurriculum, installCurriculum, loadCurriculumDatabase } from './database'
import { hotelQuestions, skills, nextQuestion, recordAnswer, requiresAudioCheck, loadProgress, progressKey, type Progress } from '../hotel/course'

const seed = structuredClone(buildCurriculumSeed())
const config = {url:'https://language.example.test',anonKey:'public-language-key'}
const cacheKey = 'englishsuccess:curriculum:v2:https://language.example.test'
beforeEach(() => { localStorage.clear(); installCurriculum(structuredClone(seed)) })

it('maps all existing questions to referenced Thai-focused nodes without inventing higher-level coverage', () => {
  const data = curriculumSchema.parse(seed)
  expect(data.questions).toHaveLength(166)
  expect(data.skills).toHaveLength(34)
  expect(new Set(data.courseSkills.map(s=>s.nodeId)).size).toBe(15)
  expect(data.skills.filter(s=>s.level==='C1').every(s=>!data.courseSkills.some(m=>m.nodeId===s.id))).toBe(true)
  expect(data.skills.every(s=>s.thaiBridge && s.references.length)).toBe(true)
})

it('rejects duplicate IDs, missing references, invalid prerequisites and unmapped questions atomically', () => {
  for (const mutate of [
    (s:typeof seed) => { s.questions.push(s.questions[0]) },
    (s:typeof seed) => { s.skills[0].references[0].sourceId='missing' },
    (s:typeof seed) => { s.skills[0].prerequisites=[s.skills[0].id] },
    (s:typeof seed) => { s.questions[0].skill='unknown' },
    (s:typeof seed) => { s.wordLinks=[{questionId:'missing',word:'the',role:'context'}] },
  ]) {
    const bad=structuredClone(seed); mutate(bad)
    expect(()=>installCurriculum(bad)).toThrow()
    expect(hotelQuestions).toHaveLength(166)
    expect(getCurriculum()?.revision).toBe(seed.revision)
  }
})

it('checks alternatives and separate form prompts instead of accepting broken exercises', () => {
  const bad=structuredClone(seed)
  bad.questions[0].answers[1]=bad.questions[0].answers[0]
  expect(curriculumSchema.safeParse(bad).success).toBe(false)
  const form=structuredClone(seed)
  form.questions.find(q=>q.grammar.kind==='form')!.grammar.promptAudioUrl=undefined
  expect(curriculumSchema.safeParse(form).success).toBe(false)
})

it('loads the language RPC with only its public key and caches the validated catalogue', async () => {
  const request=vi.fn(async()=>new Response(JSON.stringify(seed)))
  await expect(loadCurriculumDatabase(config,localStorage,request)).resolves.toBe('database')
  expect(request.mock.calls[0]).toEqual([
    config.url+'/rest/v1/rpc/englishsuccess_curriculum_v2',
    expect.objectContaining({method:'POST',headers:{apikey:config.anonKey,Authorization:'Bearer '+config.anonKey,'Content-Type':'application/json'},body:'{}'}),
  ])
  expect(JSON.parse(localStorage.getItem(cacheKey)!)).toEqual(seed)
})

it('uses only a validated same-origin cache on outage and otherwise fails visibly', async () => {
  const request=vi.fn(async()=>{throw new Error('Offline')})
  localStorage.setItem(cacheKey,JSON.stringify(seed))
  await expect(loadCurriculumDatabase(config,localStorage,request)).resolves.toBe('cache')
  await expect(loadCurriculumDatabase({...config,url:'https://other.example.test'},localStorage,request)).rejects.toThrow('Offline')
  localStorage.setItem(cacheKey,'{}')
  await expect(loadCurriculumDatabase(config,localStorage,request)).rejects.toThrow('Offline')
})

it('uses database order for practice and content without erasing saved question evidence', () => {
  const question=hotelQuestions[0]
  localStorage.setItem(progressKey('learner'),JSON.stringify(recordAnswer({},question,true,false,1000)))
  const changed=structuredClone(seed)
  changed.courseSkills.forEach(s=>{s.order=changed.courseSkills.length-1-s.order})
  installCurriculum(changed)
  expect(skills[0]).toBe('passive')
  expect(nextQuestion({},undefined,0,()=>0).skill).toBe('passive')
  expect(hotelQuestions[0].skill).toBe('passive')
  expect(loadProgress('learner')[question.skill].items?.[question.id].attempts).toBe(1)
})

it('can reach every database exercise through adaptive practice and continues reviewing', () => {
  let progress:Progress={}, previous:string|undefined
  const seen=new Set<string>()
  for(let round=0;round<2000;round++) {
    const q=nextQuestion(progress,previous,round,()=>0,1000)
    expect(q).toBeDefined()
    seen.add(q.id); previous=q.id
    progress=recordAnswer(progress,q,true,false,1000,requiresAudioCheck(progress,q))
  }
  expect(seen.size).toBe(seed.questions.length)
  expect(nextQuestion(progress,previous,2000,()=>0,1000)).toBeDefined()
})
