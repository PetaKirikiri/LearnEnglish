// @vitest-environment happy-dom
import { afterEach, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { hotelQuestions, skills, recordAnswer, nextQuestion, practiceReady, isSkillReady, isSkillComplete, loadProgress, progressKey, RETENTION_MS, type Progress } from './course'
import { meaningPairs, formItems } from './grammarContent'
import { recordWordExposure } from './wordFamiliarity'
import { recordAnswer as legacyRecordAnswer, hotelQuestions as legacyQuestions } from './legacyCourse'
import { hotelScoringSql } from '../../scripts/hotelScoringCatalogue'

afterEach(()=>localStorage.clear())
const start=1000000
function passSkill(skill:string, progress:Progress={},now=start):Progress {
  for(const q of hotelQuestions.filter(q=>q.skill===skill)) for(let i=0;i<2;i++) progress=recordAnswer(progress,q,true,false,now+i)
  return progress
}

it('ships 16 structural skills with multiple practice and transfer contexts, not vocabulary pairs',()=>{
  expect(hotelQuestions).toHaveLength(166)
  expect(new Set(hotelQuestions.map(q=>q.id)).size).toBe(166)
  expect(meaningPairs).toHaveLength(54)
  expect(formItems).toHaveLength(58)
  for(const skill of skills){
    const questions=hotelQuestions.filter(q=>q.skill===skill)
    expect(new Set(questions.filter(q=>q.grammar!.phase==='practice').map(q=>q.grammar!.context)).size,skill).toBeGreaterThanOrEqual(4)
    expect(new Set(questions.filter(q=>q.grammar!.phase==='transfer').map(q=>q.grammar!.context)).size,skill).toBe(2)
    expect(new Set(questions.map(q=>q.correct)).size,skill).toBe(2)
    for(const q of questions){
      expect(q.grammar!.explanation.length).toBeGreaterThan(20)
      expect(q.answers).toHaveLength(2)
      expect(q.answers[0]).not.toEqual(q.answers[1])
      if(q.grammar!.kind==='form') expect(q.grammar!.prompt!.replace('_____',q.answers[q.correct][0].text)).toBe(q.english)
    }
  }
})

it('does not substitute another person, object or action as a vocabulary clue in meaning pairs',()=>{
  const structural=new Set('i me she her he him we us they them am is are was were have has will can cannot must do not to from in front of behind beside opposite before after by'.split(' '))
  const lemmas:Record<string,string>={checking:'check',checked:'check',arranging:'arrange',arranged:'arrange',preparing:'prepare',prepared:'prepare',sending:'send',sent:'send',bringing:'bring',brought:'bring',calling:'call',called:'call',serving:'serve',helps:'help',helping:'help',carries:'carry',carrying:'carry'}
  const stable=(s:string)=>(s.toLowerCase().match(/[a-z]+/g)??[]).filter(w=>!structural.has(w)).map(w=>lemmas[w]??w).sort()
  for(const pair of meaningPairs){
    expect(stable(pair.english[0]),pair.english.join(' / ')).toEqual(stable(pair.english[1]))
    expect(pair.english.join(' ')).not.toMatch(/\b(now|already|yesterday|tomorrow)\b/i)
  }
})

it('keeps transfer meaning sentences out of all other practice questions',()=>{
  for(const q of hotelQuestions.filter(q=>q.grammar!.phase==='transfer'&&q.grammar!.kind==='meaning')){
    expect(hotelQuestions.filter(other=>other.english===q.english).map(other=>other.id),q.id).toEqual([q.id])
  }
})

it('starts with two focuses and holds unseen contexts until both passes of practice',()=>{
  let progress:Progress={}
  expect(nextQuestion(progress,undefined,0,()=>0).skill).toBe('roles')
  expect(nextQuestion(progress,undefined,1,()=>0).skill).toBe('object_forms')
  for(const q of hotelQuestions.filter(q=>q.skill==='roles'&&q.grammar!.phase==='practice')){
    progress=recordAnswer(progress,q,true,false,start)
    expect(practiceReady(progress,'roles')).toBe(false)
    progress=recordAnswer(progress,q,true,false,start+1)
  }
  expect(practiceReady(progress,'roles')).toBe(true)
  expect(nextQuestion(progress,undefined,0,()=>0).grammar!.phase).toBe('transfer')
})

it('does not call an immediate perfect run mastery; returns to old skills for delayed checks',()=>{
  let progress=passSkill('roles')
  expect(isSkillReady(progress,'roles')).toBe(true)
  expect(isSkillComplete(progress,'roles')).toBe(false)
  expect(nextQuestion(progress,undefined,3,()=>0,start+RETENTION_MS+1).skill).toBe('roles')
  for(const q of hotelQuestions.filter(q=>q.skill==='roles')) progress=recordAnswer(progress,q,true,false,start+RETENTION_MS+1)
  expect(isSkillComplete(progress,'roles')).toBe(true)
  for(const skill of skills.slice(1)) progress=passSkill(skill,progress)
  // Even after all areas are ready, practice continues and rotates through all.
  expect(new Set(Array.from({length:64},(_,round)=>nextQuestion(progress,undefined,round,()=>0).skill)).size).toBe(16)
})

it('requires retained evidence in transfer contexts as well as practised ones',()=>{
  let progress=passSkill('roles')
  for(const q of hotelQuestions.filter(q=>q.skill==='roles'&&q.grammar!.phase==='practice')) progress=recordAnswer(progress,q,true,false,start+RETENTION_MS+1)
  expect(isSkillComplete(progress,'roles')).toBe(false)
})

it('resets the actual failed item, not arbitrary other sentences, and help does not earn evidence',()=>{
  const [question,other]=hotelQuestions
  const ready=passSkill('roles')
  for(const [correct,assisted] of [[false,false],[true,true]]){
    const next=recordAnswer(ready,question,correct,assisted,start+RETENTION_MS+1)
    expect(next.roles.items![question.id].streak).toBe(0)
    expect(next.roles.items![question.id].retained).toBe(false)
    expect(next.roles.items![other.id]).toEqual(ready.roles.items![other.id])
    expect(isSkillReady(next,'roles')).toBe(false)
  }
})

it('requires recent accuracy, even if all per-item pass counts exist',()=>{
  const ready=passSkill('roles')
  ready.roles.recent=[true,true,true,true,true,true,true,true,true,false,false,false]
  expect(isSkillReady(ready,'roles')).toBe(false)
})

it('never converts old vocabulary progress or incidental exposure into grammar mastery',()=>{
  localStorage.setItem('hotel:v1:learner',JSON.stringify({roles:{seen:hotelQuestions.map(q=>q.id),correct:999,attempts:999}}))
  expect(loadProgress('learner')).toEqual({})
  const p=passSkill('roles')
  localStorage.setItem(progressKey('learner'),JSON.stringify(p))
  expect(loadProgress('learner')).toEqual(p)
  expect(loadProgress('other')).toEqual({})
  const q=hotelQuestions.find(q=>q.skill==='be_agreement')!
  const words=recordWordExposure({},q.english,true,false,q.grammar!.targets)
  expect(words.am).toEqual({seen:1,strength:1})
  expect(words.booking).toEqual({seen:1,strength:0})
  expect(words.checking).toEqual({seen:1,strength:0})
  const pattern=hotelQuestions.find(q=>q.english==='I will explain the bill to you.')!
  expect(pattern.grammar!.targets).toEqual(['to'])
})

it('preserves legacy Padel marking and old queued score IDs',()=>{
  expect(recordAnswer({},legacyQuestions[0],true,false)).toEqual(legacyRecordAnswer({},legacyQuestions[0],true,false))
  const sql=hotelScoringSql()
  expect(sql).not.toMatch(/delete|active=false/i)
  expect(readFileSync('supabase/migrations/20261014100000_hotel_grammar_catalogue.sql','utf8')).toContain(sql)
  for(const q of hotelQuestions) expect(sql).toContain(`('${q.id}', ${q.correct}, true)`)
})

it('a perfect learner can reach every area without a scheduling dead end',()=>{
  let progress:Progress={}; let previous:string|undefined
  for(let round=0;round<700;round++){
    const q=nextQuestion(progress,previous,round,()=>0,start)
    expect(q).toBeDefined()
    expect(q.id).not.toBe(previous)
    progress=recordAnswer(progress,q,true,false,start+round)
    previous=q.id
  }
  expect(skills.every(skill=>isSkillReady(progress,skill))).toBe(true)
  expect(skills.some(skill=>isSkillComplete(progress,skill))).toBe(false)
  for(let round=0;round<400;round++){
    const q=nextQuestion(progress,previous,round,()=>0,start+RETENTION_MS+1000)
    progress=recordAnswer(progress,q,true,false,start+RETENTION_MS+1000+round)
    previous=q.id
  }
  expect(skills.every(skill=>isSkillComplete(progress,skill))).toBe(true)
})
