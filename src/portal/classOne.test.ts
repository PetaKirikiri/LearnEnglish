// @vitest-environment happy-dom
import { afterEach, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { classOneAudio, classOneExamples, classOneFrameQuestions, classOneLesson, classOnePracticeQuestions, classOneQuestions, classOneSkill, classOneStages, classOneWords } from './classOne'
import { classOnePractice, classOneStageIndex, classOneStageReady } from './classOnePractice'
import type { Progress } from '../hotel/course'

afterEach(()=>localStorage.clear())
const correct=(p:Progress,q:typeof classOneQuestions[number],assisted=false)=>classOnePractice.recordAnswer!(p,q,true,assisted,100,false)
function completeStage(p:Progress,index:number){for(const q of classOneStages[index].questions){p=correct(p,q);p=correct(p,q)}return p}
it('starts with standalone question words, then familiar vocabulary, then one question frame',()=>{
  expect(classOneLesson).toMatchObject({number:1,title:'Class 1',date:'2026-10-26'})
  expect(classOneStages.map(s=>s.id)).toEqual(['question-words','everyday-words','first-questions'])
  expect(classOneQuestions.map(q=>q.english)).toEqual(['Who?','What?','Where?','When?','Why?','How much?','How many?'])
  expect(classOneWords).toHaveLength(12)
  expect(classOnePracticeQuestions).toHaveLength(21)
  expect(classOneFrameQuestions.map(q=>q.english)).toEqual(['Who is this?','What is this?'])
  expect(classOneStages[2].introduces).toEqual(['… is this?'])
  expect(classOnePracticeQuestions.map(q=>q.english).join(' ')).not.toMatch(/\b(in|at|the|do|does|are|need|want|leaving|eat|playing|these|there)\b/i)
  for(const stage of classOneStages)for(const requirement of stage.requires)
    expect(classOneStages.findIndex(s=>s.id===requirement)).toBeLessThan(classOneStages.indexOf(stage))
})
it('keeps the final contrast stable except for the taught question word',()=>{
  expect(classOneFrameQuestions[0].answers).toEqual(classOneFrameQuestions[1].answers)
  expect(classOneFrameQuestions.map(q=>q.english.replace(/^(Who|What)/,'…'))).toEqual(['… is this?','… is this?'])
  for(const [index,example] of classOneExamples.entries()){
    expect(example.units.map(u=>u.english).join(' ')).toBe(example.english)
    expect(classOneFrameQuestions[index].answers[index][0].text).toBe(example.thai)
  }
})
it('does not unlock vocabulary or sentences through wrong attempts, one success or assisted answers',()=>{
  let p:Progress={}
  for(const q of classOneQuestions)for(let i=0;i<10;i++)p=classOnePractice.recordAnswer!(p,q,false,false)
  expect(classOneStageIndex(p)).toBe(0)
  for(const q of classOneQuestions){p=correct(p,q,true);p=correct(p,q,true)}
  expect(classOneStageIndex(p)).toBe(0)
  for(const q of classOneQuestions)p=correct(p,q)
  expect(classOneStageIndex(p)).toBe(0)
  p=completeStage(p,0)
  expect(classOneStageIndex(p)).toBe(1)
  expect(classOnePractice.nextQuestion(p).english).not.toMatch(/is this/)
  p=completeStage(p,1)
  expect(classOneStageIndex(p)).toBe(2)
})
it('revisits earlier content after progression and steps back when a prerequisite is missed',()=>{
  let p=completeStage({},0)
  p=completeStage(p,1)
  const first=classOneQuestions[0]
  // 38 successes so far; the next success makes the fourth-encounter review due.
  p=correct(p,classOneFrameQuestions[0])
  expect(classOneStageIndex(p)).toBe(2)
  expect(classOneStages.slice(0,2).flatMap(s=>s.questions)).toContain(classOnePractice.nextQuestion(p,classOneFrameQuestions[0].id))
  p=classOnePractice.recordAnswer!(p,first,false,false)
  expect(classOneStageIndex(p)).toBe(0)
  expect(classOnePractice.nextQuestion(p).id).toBe(first.id)
})
it('never serves a later stage before its prerequisites are ready and keeps reviewing',()=>{
  let p:Progress={},previous:string|undefined
  const seen=new Set<string>()
  for(let i=0;i<100;i++){
    const q=classOnePractice.nextQuestion(p,previous)
    const stage=classOneStages.findIndex(s=>s.questions.includes(q))
    for(let earlier=0;earlier<stage;earlier++)expect(classOneStageReady(p,earlier)).toBe(true)
    expect(q.id).not.toBe(previous)
    seen.add(q.id);p=correct(p,q);previous=q.id
  }
  expect(seen.size).toBe(21)
  expect(classOnePractice.isSkillComplete(p,classOneSkill)).toBe(false) // Not yet audio-only evidence.
  expect(classOnePractice.nextQuestion(p,previous)).toBeDefined()
  localStorage.setItem(classOnePractice.progressKey('student'),JSON.stringify(p))
  expect(classOnePractice.loadProgress('student')[classOneSkill].items).toEqual(p[classOneSkill].items)
  expect(classOnePractice.loadProgress('different-student')).toEqual({})
})
it('has matching neural audio for every active item',()=>{
  const manifest=JSON.parse(readFileSync('public/audio/class-one/voice-manifest.json','utf8'))
  for(const item of classOneAudio){
    expect(existsSync('public'+item.audioUrl),item.spokenText).toBe(true)
    expect(manifest[item.audioUrl.split('/').pop()!].text).toBe(item.spokenText)
  }
})
it('keeps new score IDs separate from removed sentences and in the English ledger',()=>{
  for(const q of classOnePracticeQuestions){
    expect(q.id.startsWith('hotel-g3-general-')).toBe(true)
    expect(q.id).not.toMatch(/class-one-question-\d+-\d+$/)
  }
  expect(classOnePractice.queue).toBeTypeOf('function')
  expect(classOnePractice.sync).toBeTypeOf('function')
})
it('fades only encountered units and restores them after errors',()=>{
  let memory=classOnePractice.recordExposure!({},'Who is this?',true,false)
  memory=classOnePractice.recordExposure!(memory,'What is this?',true,false)
  expect(classOnePractice.wordOpacity!(memory,'this')).toBeLessThan(classOnePractice.wordOpacity!(memory,'who'))
  const faded=classOnePractice.wordOpacity!(memory,'this')
  memory=classOnePractice.recordExposure!(memory,'Who is this?',false,false)
  expect(classOnePractice.wordOpacity!(memory,'this')).toBeGreaterThan(faded)
})
