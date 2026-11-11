// @vitest-environment happy-dom
import {act} from 'react'
import {createRoot} from 'react-dom/client'
import {beforeEach,expect,it,vi} from 'vitest'
import type {WordProgress} from '../learning/wordProgress/model'
const mock=vi.hoisted(()=>({record:vi.fn(),rows:[] as WordProgress[],ready:true}))
vi.mock('../learning/wordProgress/useWordProgress',()=>({useWordProgress:()=>({rows:mock.rows,scores:{},ready:mock.ready,error:'',record:mock.record,retry:vi.fn()})}))
vi.mock('./PracticeGold',()=>({default:()=>null,awardPracticeGold:vi.fn()}))
vi.mock('../audio/sentenceAudio',async original=>({...await original<typeof import('../audio/sentenceAudio')>(),prepareSentenceAudio:vi.fn().mockResolvedValue(undefined)}))
import GeneratedPractice from './GeneratedPractice'
import {generatedCandidates} from './generatedPracticeContent'
import {loadEvidence} from './generatedPracticeProgress'
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true})
let finishAudio=()=>{}
beforeEach(()=>{localStorage.clear();mock.record.mockClear();mock.rows=[];mock.ready=true;vi.stubGlobal('Audio',class{onplaying:(()=>void)|null=null;onended:(()=>void)|null=null;onerror:(()=>void)|null=null;pause(){}play(){this.onplaying?.();finishAudio=()=>this.onended?.();return Promise.resolve()}})})
const saved=(level:number,user='guest')=>JSON.parse(localStorage.getItem(`englishsuccess:composed-run:v5:${user}:${level}:main`)!)
const correctSide=(level:number)=>{const s=saved(level);const q=generatedCandidates(level as 1).find(q=>q.id===s.questionIds[s.index])!;return s.flipped[s.index]?1:q.correct}
it('finishes after exactly thirty different independently scored questions and starts a fresh set',async()=>{
 const host=document.createElement('div'),root=createRoot(host),complete=vi.fn()
 try{
  await act(async()=>root.render(<GeneratedPractice level={4} onComplete={complete}/>))
  const first=saved(4)
  expect(new Set(first.questionIds).size).toBe(30)
  for(let index=0;index<30;index++){
   expect(complete).not.toHaveBeenCalled();expect(host.querySelector('progress')?.max).toBe(30)
   expect(host.querySelector<HTMLButtonElement>('.binary-answer')?.disabled).toBe(true)
   await act(async()=>finishAudio())
   await act(async()=>host.querySelectorAll<HTMLButtonElement>('.binary-answer')[correctSide(4)].click())
   await act(async()=>host.querySelector<HTMLButtonElement>('.foundation-next')!.click())
  }
  expect(complete).toHaveBeenCalledWith(4,30,30,true,first.id,true)
  expect(mock.record).toHaveBeenCalledTimes(30)
  expect(new Set(mock.record.mock.calls.map(([e])=>e.id)).size).toBe(30)
  expect(loadEvidence()).toHaveLength(30)
  await act(async()=>host.querySelector<HTMLButtonElement>('.practice-complete button')!.click())
  expect(saved(4).id).not.toBe(first.id)
  expect(saved(4).questionIds).not.toEqual(first.questionIds)
 }finally{await act(async()=>root.unmount())}
})
it('resumes the exact unanswered question and choices after refresh and isolates accounts',async()=>{
 const host=document.createElement('div');let root=createRoot(host)
 try{
  await act(async()=>root.render(<GeneratedPractice level={5}/>));await act(async()=>finishAudio())
  await act(async()=>host.querySelectorAll<HTMLButtonElement>('.binary-answer')[correctSide(5)].click())
  await act(async()=>host.querySelector<HTMLButtonElement>('.foundation-next')!.click())
  const prior=saved(5),labels=[...host.querySelectorAll('.binary-answer')].map(b=>b.getAttribute('aria-label'))
  await act(async()=>root.unmount());root=createRoot(host);await act(async()=>root.render(<GeneratedPractice level={5}/>))
  expect(saved(5)).toEqual(prior);expect([...host.querySelectorAll('.binary-answer')].map(b=>b.getAttribute('aria-label'))).toEqual(labels)
  await act(async()=>root.render(<GeneratedPractice level={5} userId="another"/>))
  expect(saved(5,'another').index).toBe(0);expect(saved(5,'another').id).not.toBe(prior.id);expect(loadEvidence('another')).toEqual([])
 }finally{await act(async()=>root.unmount())}
})
it('counts listening evidence only when both target text and pictures were hidden without help or replay',async()=>{
 for(const mode of ['hidden','visible','help','replay'] as const){
  localStorage.clear();mock.record.mockClear();mock.rows=generatedCandidates(1).flatMap(q=>q.targetWords.flatMap(w=>w.split(' '))).map(word=>({word_id:'en:'+word,correct:mode==='visible'?0:25,attempts:25,listening_correct:0,direct_correct:0,last_practised:'',recent_results:[true]}))
  const host=document.createElement('div'),root=createRoot(host)
  try{
   await act(async()=>root.render(<GeneratedPractice level={1}/>));await act(async()=>finishAudio())
   if(mode==='help')await act(async()=>host.querySelector<HTMLButtonElement>('.foundation-help')!.click())
   if(mode==='replay'){await act(async()=>host.querySelector<HTMLButtonElement>('.foundation-replay')!.click());await act(async()=>finishAudio())}
   if(mode!=='visible')expect([...host.querySelectorAll<HTMLElement>('.practice-question .cw-slot-role')].some(n=>n.style.opacity==='0')).toBe(true)
   await act(async()=>host.querySelectorAll<HTMLButtonElement>('.binary-answer')[correctSide(1)].click())
   expect(mock.record.mock.calls[0][0].modality).toBe(mode==='hidden'?'audio':'visible')
   const evidence=loadEvidence()[0];expect(evidence.hidden).toBe(mode!=='visible');expect(evidence.assisted).toBe(mode==='help');expect(evidence.plays).toBe(mode==='replay'?2:1)
  }finally{await act(async()=>root.unmount())}
 }
})
it('waits for saved knowledge before choosing a set or taking a fade snapshot',async()=>{
 mock.ready=false;const host=document.createElement('div'),root=createRoot(host)
 try{await act(async()=>root.render(<GeneratedPractice level={1} userId="loading"/>));expect(host.querySelector('.binary-answer')).toBeNull();expect(saved(1,'loading')).toBeNull();mock.ready=true;await act(async()=>root.render(<GeneratedPractice level={1} userId="loading"/>));expect(host.querySelectorAll('.binary-answer')).toHaveLength(2)}finally{await act(async()=>root.unmount())}
})
it('keeps help and replay history through refresh, so refreshing cannot turn an assisted answer into listening proof',async()=>{
 const host=document.createElement('div');let root=createRoot(host)
 try{
  await act(async()=>root.render(<GeneratedPractice level={1}/>));await act(async()=>finishAudio())
  await act(async()=>host.querySelector<HTMLButtonElement>('.foundation-help')!.click())
  await act(async()=>root.unmount());root=createRoot(host)
  await act(async()=>root.render(<GeneratedPractice level={1}/>));await act(async()=>finishAudio())
  await act(async()=>host.querySelectorAll<HTMLButtonElement>('.binary-answer')[correctSide(1)].click())
  expect(loadEvidence()[0]).toMatchObject({assisted:true,plays:2})
  expect(mock.record.mock.calls[0][0].modality).toBe('visible')
 }finally{await act(async()=>root.unmount())}
})

it('runs Lesson 6 separately from action Level 6 and restores matched scene choices through refresh',async()=>{
 const {lessonPracticeTemplate}=await import('./lessonPracticeTemplate')
 const key='englishsuccess:composed-run:v5:guest:6:lesson-6'
 localStorage.setItem('englishsuccess:composed-run:v5:guest:6:main','untouched action course')
 const host=document.createElement('div');let root=createRoot(host)
 try{
  await act(async()=>root.render(<GeneratedPractice level={6} {...lessonPracticeTemplate(6)}/>))
  expect(host.querySelector('.practice-header')?.textContent??host.textContent).toContain('Lesson 6')
  const scenes=()=>[...host.querySelectorAll('.binary-answer [data-distance]')].map(n=>n.getAttribute('data-distance'))
  const before=scenes();expect(before).toHaveLength(2);expect(before[0]).not.toBe(before[1])
  await act(async()=>root.unmount());root=createRoot(host)
  await act(async()=>root.render(<GeneratedPractice level={6} {...lessonPracticeTemplate(6)}/>))
  expect(scenes()).toEqual(before)
  for(let index=0;index<30;index++){
   const run=JSON.parse(localStorage.getItem(key)!)
   expect(host.querySelector('progress')?.max).toBe(30)
   await act(async()=>finishAudio())
   await act(async()=>host.querySelectorAll<HTMLButtonElement>('.binary-answer')[run.flipped[index]?1:0].click())
   await act(async()=>host.querySelector<HTMLButtonElement>('.foundation-next')!.click())
  }
  expect(host.textContent).toContain('30 / 30')
  expect(mock.record).toHaveBeenCalledTimes(30)
  expect(mock.record.mock.calls.every(([e])=>e.questionId.startsWith('identify-v2-'))).toBe(true)
  expect(localStorage.getItem('englishsuccess:composed-run:v5:guest:6:main')).toBe('untouched action course')
 }finally{await act(async()=>root.unmount())}
})

it('fades the whole demonstrative picture and credits unassisted Lesson 6 listening only after it is hidden',async()=>{
 const {lessonPracticeTemplate}=await import('./lessonPracticeTemplate')
 mock.rows=['what','is','are','this','that','over','there','these','those'].map(word=>({word_id:'en:'+word,correct:25,attempts:25,listening_correct:0,direct_correct:0,last_practised:'',recent_results:[true]}))
 const host=document.createElement('div'),root=createRoot(host)
 try{
  await act(async()=>root.render(<GeneratedPractice level={6} {...lessonPracticeTemplate(6)}/>))
  expect([...host.querySelectorAll<HTMLElement>('.practice-question .cw-slot-role')].every(e=>e.style.opacity==='0')).toBe(true)
  expect(host.querySelector('.practice-question .example-gloss,.practice-question .example-translation')).toBeNull()
  const run=JSON.parse(localStorage.getItem('englishsuccess:composed-run:v5:guest:6:lesson-6')!)
  await act(async()=>finishAudio())
  await act(async()=>host.querySelectorAll<HTMLButtonElement>('.binary-answer')[run.flipped[0]?1:0].click())
  expect(mock.record.mock.calls[0][0].modality).toBe('audio')
  expect(loadEvidence()[0]).toMatchObject({heard:true,hidden:true,assisted:false,plays:1})
 }finally{await act(async()=>root.unmount())}
})
