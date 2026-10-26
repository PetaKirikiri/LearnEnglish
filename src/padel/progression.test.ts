// @vitest-environment happy-dom
import { afterEach, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { padelStages, stageByPair } from './progression'
import { padelQuestions, nextQuestion, recordAnswer, requiresAudioCheck, isSkillComplete, progressSkill, loadProgress, progressKey } from './course'
import type { Progress } from '../hotel/course'

afterEach(()=>localStorage.clear())
it('maps every exercise once to prerequisite stages and existing curriculum references',()=>{
  const catalogue=JSON.parse(readFileSync('src/curriculum/syllabus.snapshot.json','utf8'))
  const nodes=new Set(catalogue.skills.map((s:{id:string})=>s.id))
  expect(stageByPair.size).toBe(padelQuestions.length/2)
  for(const [i,stage] of padelStages.entries()) {
    expect(stage.prerequisite).toBe(padelStages[i-1]?.id)
    expect(stage.lanes).toHaveLength(2)
    expect(stage.lanes.every(l=>l.length>0)).toBe(true)
    expect(stage.nodeIds.every(id=>nodes.has(id))).toBe(true)
  }
  const opening=padelQuestions.filter(q=>progressSkill(q)==='start')
  expect(opening.map(q=>q.english)).toEqual(['The player.','The coach.','A racket.','A ball.','The net.','The court.'])
})

it('cannot randomly open with locations, requests or advanced grammar',()=>{
  for(let round=0;round<100;round++) for(const random of [0,0.3,0.6,0.999]) {
    const q=nextQuestion({},undefined,round,()=>random)
    expect(progressSkill(q)).toBe('start')
    expect(q.english).not.toMatch(/here|please|would|have|is /i)
  }
})

it('seeing everything, one correct answer or text-only success never unlocks a stage',()=>{
  let p:Progress={}
  for(const q of padelQuestions) p[q.skill]={seen:padelQuestions.filter(i=>i.skill===q.skill).map(i=>i.id),correct:100,attempts:100}
  expect(progressSkill(nextQuestion(p))).toBe('start')
  for(const q of padelQuestions.filter(q=>progressSkill(q)==='start')) {
    for(let n=0;n<6;n++) p=recordAnswer(p,q,true,false,n+1,false)
  }
  expect(isSkillComplete(p,'start')).toBe(false)
  expect(requiresAudioCheck(p,nextQuestion(p))).toBe(true)
})

it('tests both directions, gates each stage, keeps review, and reaches the entire bank',()=>{
  let p:Progress={}, previous:string|undefined
  let review=0, maxStage=0
  const visited=new Set<string>()
  for(let round=0;round<1800;round++) {
    const q=nextQuestion(p,previous,round,()=>0.6)
    const stage=padelStages.findIndex(s=>s.id===progressSkill(q))
    for(const prerequisite of padelStages.slice(0,stage)) expect(isSkillComplete(p,prerequisite.id)).toBe(true)
    if(stage<maxStage) review++
    maxStage=Math.max(stage,maxStage)
    if(previous) expect(q.id).not.toBe(previous)
    visited.add(q.id)
    p=recordAnswer(p,q,true,false,round+1,requiresAudioCheck(p,q))
    previous=q.id
    // Simulate closing and reopening the app regularly.
    if(round%20===0) {
      localStorage.setItem(progressKey('learner'),JSON.stringify(p))
      p=loadProgress('learner')
    }
  }
  expect(visited.size).toBe(padelQuestions.length)
  expect(review).toBeGreaterThan(100)
  expect(padelStages.every(s=>isSkillComplete(p,s.id))).toBe(true)
  // A failed review is not ignored just because it was once completed.
  const q=padelQuestions[0]
  p=recordAnswer(p,q,false,false,2000,true)
  expect(isSkillComplete(p,'start')).toBe(false)
  expect(progressSkill(nextQuestion(p))).toBe('start')
})

it('assistance resets evidence and old/corrupt records do not invent mastery',()=>{
  const q=padelQuestions[0]
  let p:Progress={}
  for(let n=0;n<3;n++) p=recordAnswer(p,q,true,false,n+1,n===2)
  p=recordAnswer(p,q,true,true,4,true)
  expect(p[q.skill].items![q.id].streak).toBe(0)
  expect(p[q.skill].items![q.id].audioStreak).toBe(0)
  localStorage.setItem(progressKey('bad'),JSON.stringify({
    people:{seen:[q.id],correct:25,attempts:30,items:{[q.id]:{attempts:1,streak:999,audioStreak:999,firstCorrect:1,lastCorrect:1}}},
  }))
  expect(loadProgress('bad').people.correct).toBe(25)
  expect(loadProgress('bad').people.items).toBeUndefined()
})

it('spaces out a failed item instead of immediately repeating the same answer',()=>{
  let p:Progress={}
  for(const q of padelQuestions.filter(q=>progressSkill(q)==='start'))
    for(let n=0;n<3;n++) p=recordAnswer(p,q,true,false,n+1,n===2)
  const q=padelQuestions[0]
  p=recordAnswer(p,q,false,false,4,true)
  expect(nextQuestion(p,q.id).id).not.toBe(q.id)
  expect(progressSkill(nextQuestion(p,q.id))).toBe('start')
})

it('new grammar bridges do not let familiar nouns give away the answer',()=>{
  for(const q of padelQuestions.filter(q=>q.pairId.startsWith('foundation-'))) {
    const nouns=(text:string)=>(text.toLowerCase().match(/\b(rackets?|balls?|players?|coach|court)\b/g)??[]).map(s=>s.replace(/s$/,''))
    expect(nouns(q.english),q.id).toEqual(nouns(q.contrast))
  }
})
