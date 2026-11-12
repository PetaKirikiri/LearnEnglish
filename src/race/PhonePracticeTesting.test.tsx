// @vitest-environment happy-dom
import {act} from 'react'
import {createRoot} from 'react-dom/client'
import {expect,it,vi} from 'vitest'
import type {WordProgress} from '../learning/wordProgress/model'
const state=vi.hoisted(()=>({rows:[] as WordProgress[],record:vi.fn(),award:vi.fn(),ended:()=>{}}))
vi.mock('../learning/wordProgress/useWordProgress',()=>({useWordProgress:()=>({rows:state.rows,scores:{},ready:true,error:'',record:state.record,retry:vi.fn()})}))
vi.mock('./PracticeGold',()=>({default:()=>null,awardPracticeGold:(...args:unknown[])=>state.award(...args)}))
vi.mock('./JourneyPasses',()=>({useJourneyPasses:()=>({passes:[],unavailable:false}),JourneyPassNames:()=>null}))
vi.mock('./practicePlacement',()=>({loadPracticeStartingRound:async()=>1}))
vi.mock('./numberRecallStore',async original=>({...await original<typeof import('./numberRecallStore')>(),syncRecall:async()=>undefined}))
vi.mock('../audio/sentenceAudio',()=>({prepareSentenceAudio:async()=>undefined,playSentenceAudio:(_q:unknown,callbacks:{started:()=>void;ended:()=>void})=>{callbacks.started();state.ended=callbacks.ended;return()=>{}}}))
vi.mock('../classroom/ClassroomPractice',()=>({default:()=>{throw new Error('The independent test must not render a classroom turn')}}))
vi.mock('./PracticeCourse',()=>({default:()=>{throw new Error('The app test must not route into a lesson worksheet')}}))
vi.mock('../lib/supabase',()=>({supabase:{auth:{getUser:async()=>({data:{user:null}})}}}))
import PhonePractice from './PhonePractice'
import HomeworkEntry from './HomeworkEntry'
import {practiceCandidates} from './generatedPracticeContent'
import {eligiblePracticeActions} from './generatedPracticeProgress'
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true})

it('opens the standalone test without the classroom lesson-template validator',async()=>{
 localStorage.clear();history.replaceState({},'','/english/practice?lesson=not-a-class-template')
 const host=document.createElement('div'),root=createRoot(host)
 try{
  await act(async()=>root.render(<HomeworkEntry/>))
  expect(host.querySelectorAll('.journey-node')).toHaveLength(6)
  expect(host.textContent).not.toContain('Choose a lesson')
 }finally{await act(async()=>root.unmount())}
})

it('runs and scores object questions from the app test even with a classroom lesson in the URL',async()=>{
 localStorage.clear();history.replaceState({},'','/english/practice?lesson=6')
 localStorage.setItem('classroom-notes','preserve these notes')
 state.rows=[]
 state.record.mockClear();state.award.mockClear()
 const host=document.createElement('div'),root=createRoot(host)
 try{
  await act(async()=>root.render(<PhonePractice userId="test-student"/>))
  expect(host.querySelectorAll('.journey-node')).toHaveLength(6)
  await act(async()=>host.querySelector<HTMLButtonElement>('[aria-label^="เปิด Level 6:"]')!.click())
  const saved=JSON.parse(localStorage.getItem('englishsuccess:composed-run:v16:test-student:6:star-1')!)
  const q=practiceCandidates(6,undefined,eligiblePracticeActions(state.rows,[])).find(q=>q.id===saved.questionIds[0])!
  expect(q.document.construction).toBe('action-answer')
  for(const document of [q.document,...q.alternatives??[]]){
   expect(document.units.some(u=>u.role==='object')).toBe(true)
   expect(document.units.some(u=>u.role==='determiner')).toBe(true)
  }
  expect(host.querySelector('.practice-header')).not.toBeNull()
  expect(host.querySelectorAll('.binary-answer')).toHaveLength(2)
  expect(host.querySelector('.example-gloss,.example-translation,.cw-word-picker')).toBeNull()
  expect(host.querySelector<HTMLButtonElement>('.binary-answer')!.disabled).toBe(true)
  await act(async()=>state.ended())
  const correct=saved.flipped[0]?1:q.correct
  await act(async()=>host.querySelectorAll<HTMLButtonElement>('.binary-answer')[correct].click())
  expect(state.record).toHaveBeenCalledOnce()
  expect(state.award).toHaveBeenCalledWith(expect.any(String),true,'test-student')
  expect(localStorage.getItem('classroom-notes')).toBe('preserve these notes')
 }finally{await act(async()=>root.unmount())}
})
