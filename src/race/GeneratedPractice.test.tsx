// @vitest-environment happy-dom
import {act} from 'react'
import {createRoot} from 'react-dom/client'
import {beforeEach,expect,it,vi} from 'vitest'
import type {WordProgress} from '../learning/wordProgress/model'
const mock=vi.hoisted(()=>({record:vi.fn(),rows:[] as WordProgress[],ready:true}))
vi.mock('../learning/wordProgress/useWordProgress',()=>({useWordProgress:()=>({rows:mock.rows,scores:{},ready:mock.ready,error:'',record:mock.record,retry:vi.fn()})}))
// Forecast logic is covered separately; this flow test exercises thirty actual answers.
vi.mock('./practiceForecast',async original=>({...await original<typeof import('./practiceForecast')>(),audioPreparationPlan:vi.fn().mockReturnValue([])}))
vi.mock('./PracticeGold',()=>({default:()=>null,awardPracticeGold:vi.fn()}))
vi.mock('../audio/sentenceAudio',async original=>({...await original<typeof import('../audio/sentenceAudio')>(),prepareSentenceAudio:vi.fn().mockResolvedValue(undefined)}))
import GeneratedPractice from './GeneratedPractice'
import './testing/forbidSentenceBanks'
import {canonicalBlueprintQuestion} from './blueprintWordServer'
import {generatedNumberCatalogue} from './numberCatalogue'
import {wordHierarchies} from './wordHierarchy'
import {loadEvidence} from './generatedPracticeProgress'
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true})
let finishAudio=()=>{}
beforeEach(()=>{
 vi.stubGlobal('SpeechSynthesisUtterance',class{onstart:(()=>void)|null=null;onend:(()=>void)|null=null;constructor(public text:string){}})
 vi.stubGlobal('speechSynthesis',{getVoices:()=>[{lang:'en-GB',localService:true}],cancel:vi.fn(),speak:(utterance:{onstart:()=>void;onend:()=>void})=>{utterance.onstart();finishAudio=()=>utterance.onend()}})
 localStorage.clear();mock.record.mockClear();mock.rows=[];mock.ready=true;vi.stubGlobal('Audio',class{onplaying:(()=>void)|null=null;onended:(()=>void)|null=null;onerror:(()=>void)|null=null;pause(){}play(){this.onplaying?.();finishAudio=()=>this.onended?.();return Promise.resolve()}})})
const answers=()=>mock.record.mock.calls.map(([event])=>event).filter(event=>event.event!=='presented')
const presentations=()=>mock.record.mock.calls.map(([event])=>event).filter(event=>event.event==='presented')
const saved=(level:number,user='guest')=>JSON.parse(localStorage.getItem(`englishsuccess:composed-run:v16:${user}:${level}:main`)!)
const correctSide=(level:number)=>{const s=saved(level);return s.questions[s.index].correct}
it('finishes after exactly thirty independently scored questions and starts a fresh set',async()=>{
 const host=document.createElement('div'),root=createRoot(host),complete=vi.fn()
 try{
  await act(async()=>root.render(<GeneratedPractice level={4} onComplete={complete}/>))
  const first=saved(4)
  expect(first.questionIds).toHaveLength(30)
  for(let index=0;index<30;index++){
   expect(complete).not.toHaveBeenCalled();expect(host.querySelector('progress')?.max).toBe(30)
   expect(host.querySelector<HTMLButtonElement>('.binary-answer')?.disabled).toBe(true)
   await act(async()=>finishAudio())
   expect(host.querySelector('.binary-answer.correct,.binary-answer.incorrect')).toBeNull()
   expect(host.querySelector('.practice-continue-surface')).toBeNull()
   expect(saved(4).picked).toBeNull()
   await act(async()=>host.querySelectorAll<HTMLButtonElement>('.binary-answer')[correctSide(4)].click())
   await act(async()=>host.querySelector<HTMLButtonElement>('.practice-continue-surface')!.click())
  }
  expect(complete).toHaveBeenCalledWith(4,30,30,true,first.id,true)
  expect(answers()).toHaveLength(30);expect(new Set(presentations().map(event=>event.id)).size).toBe(30)
  expect(new Set(answers().map(e=>e.id)).size).toBe(30)
  expect(loadEvidence()).toHaveLength(30)
  await act(async()=>host.querySelector<HTMLButtonElement>('.practice-complete button')!.click())
  expect(saved(4).id).not.toBe(first.id)
  expect(saved(4).questionIds).not.toEqual(first.questionIds)
 }finally{await act(async()=>root.unmount())}
},15000)
it('resumes the exact unanswered question and choices after refresh and isolates accounts',async()=>{
 const host=document.createElement('div');let root=createRoot(host)
 try{
  await act(async()=>root.render(<GeneratedPractice level={5}/>));await act(async()=>finishAudio())
  await act(async()=>host.querySelectorAll<HTMLButtonElement>('.binary-answer')[correctSide(5)].click())
  await act(async()=>host.querySelector<HTMLButtonElement>('.practice-continue-surface')!.click())
  const prior=saved(5),labels=[...host.querySelectorAll('.binary-answer')].map(b=>b.getAttribute('aria-label'))
  await act(async()=>root.unmount());root=createRoot(host);await act(async()=>root.render(<GeneratedPractice level={5}/>))
  expect(saved(5)).toEqual(prior);expect([...host.querySelectorAll('.binary-answer')].map(b=>b.getAttribute('aria-label'))).toEqual(labels)
  await act(async()=>root.render(<GeneratedPractice level={5} userId="another"/>))
  expect(saved(5,'another').index).toBe(0);expect(saved(5,'another').id).not.toBe(prior.id);expect(loadEvidence('another')).toHaveLength(1);expect(loadEvidence('another')[0].phase).toBe('presented');expect(loadEvidence('another')[0].id).not.toBe(prior.attemptId)
 }finally{await act(async()=>root.unmount())}
})
it('counts listening evidence only when both target text and pictures were hidden without help or replay',async()=>{
 for(const mode of ['hidden','visible','help','replay'] as const){
  localStorage.clear();mock.record.mockClear();mock.rows=[...Object.values(wordHierarchies).flat(),...generatedNumberCatalogue.map(item=>item.word),'am','is','are'].flatMap(word=>word.toLowerCase().match(/[a-z]+/g)??[]).map(word=>({word_id:'en:'+word,correct:mode==='visible'?0:25,attempts:25,listening_correct:0,direct_correct:0,last_practised:'',recent_results:[true]}))
  const host=document.createElement('div'),root=createRoot(host)
  try{
   await act(async()=>root.render(<GeneratedPractice level={1}/>));await act(async()=>finishAudio())
   if(mode==='help')await act(async()=>host.querySelector<HTMLButtonElement>('.foundation-help')!.click())
   if(mode==='replay'){await act(async()=>host.querySelector<HTMLButtonElement>('.foundation-replay')!.click());await act(async()=>finishAudio())}
   if(mode!=='visible')expect([...host.querySelectorAll<HTMLElement>('.practice-question .cw-slot-role')].some(n=>n.style.opacity==='0')).toBe(true)
   for(const word of host.querySelectorAll<HTMLElement>('.practice-question .matrix-fading-word')){
    if(word.style.opacity==='0'){
     const icon=word.closest('.tonight-slot')?.querySelector<HTMLElement>('.cw-slot-role')
     if(icon)expect(icon.style.opacity,'A faded word must not leave its icon visible').toBe('0')
    }
   }
   const answerPictures=[...host.querySelectorAll('.binary-answer .picture-sentence')]
   expect(answerPictures.length).toBeGreaterThan(0)
   expect(answerPictures.every(p=>p.getAttribute('data-coloured')==='true')).toBe(true)
   await act(async()=>host.querySelectorAll<HTMLButtonElement>('.binary-answer')[correctSide(1)].click())
   expect(answers()[0].modality).toBe(mode==='hidden'?'audio':'visible')
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
  expect(answers()[0].modality).toBe('visible')
 }finally{await act(async()=>root.unmount())}
})

it('runs Lesson 6 separately from action Level 6 and restores matched scene choices through refresh',async()=>{
 const {lessonPracticeTemplate}=await import('./lessonPracticeTemplate')
 mock.rows=Object.values(wordHierarchies).flat().filter(w=>!['this','that','that over there','these','those'].includes(w)).flatMap(word=>word.toLowerCase().match(/[a-z]+/g)??[]).map(word=>({word_id:'en:'+word,correct:25,attempts:25,listening_correct:3,direct_correct:0,last_practised:'',recent_results:[true,true,true],fade_score:25,confirmation_count:3,proven_at:'2026-01-01T00:00:00Z',review_due_at:'2040-01-01T00:00:00Z',learning_version:1}))
 const key='englishsuccess:composed-run:v16:guest:6:lesson-6'
 localStorage.setItem('englishsuccess:composed-run:v16:guest:6:main','untouched action course')
 const host=document.createElement('div');let root=createRoot(host)
 try{
  await act(async()=>root.render(<GeneratedPractice level={6} {...lessonPracticeTemplate(6)}/>))
  expect(host.querySelector('.practice-header')?.textContent??host.textContent).toContain('Lesson 6')
  const scenes=()=>[...host.querySelectorAll('.binary-answer [data-distance]')].map(n=>n.getAttribute('data-distance'))
  const before=scenes();expect(before).toHaveLength(2)
  const labels=[...host.querySelectorAll('.binary-answer')].map(n=>n.getAttribute('aria-label'))
  expect(labels[0]).not.toBe(labels[1])
  await act(async()=>root.unmount());root=createRoot(host)
  await act(async()=>root.render(<GeneratedPractice level={6} {...lessonPracticeTemplate(6)}/>))
  expect(scenes()).toEqual(before)
  for(let index=0;index<30;index++){
   const run=JSON.parse(localStorage.getItem(key)!)
   expect(host.querySelector('progress')?.max).toBe(30)
   await act(async()=>finishAudio())
   await act(async()=>host.querySelectorAll<HTMLButtonElement>('.binary-answer')[run.questions[index].correct].click())
   await act(async()=>host.querySelector<HTMLButtonElement>('.practice-continue-surface')!.click())
  }
  expect(host.textContent).toContain('30 / 30')
  expect(answers()).toHaveLength(30);expect(new Set(presentations().map(event=>event.id)).size).toBe(30)
  expect(answers().every(e=>{const q=canonicalBlueprintQuestion(e.recipe);return q&&['identification-question','identification-answer'].includes(q.document.construction)})).toBe(true)
  expect(localStorage.getItem('englishsuccess:composed-run:v16:guest:6:main')).toBe('untouched action course')
 }finally{await act(async()=>root.unmount())}
},15000)

it('fades the whole demonstrative picture and credits unassisted Lesson 6 listening only after it is hidden',async()=>{
 const {lessonPracticeTemplate}=await import('./lessonPracticeTemplate')
 mock.rows=Object.values(wordHierarchies).flat().filter(w=>!['this','that','that over there','these','those'].includes(w)).flatMap(word=>word.toLowerCase().match(/[a-z]+/g)??[]).map(word=>({word_id:'en:'+word,correct:25,attempts:25,listening_correct:3,direct_correct:0,last_practised:'',recent_results:[true,true,true],fade_score:25,confirmation_count:3,proven_at:'2026-01-01T00:00:00Z',review_due_at:'2040-01-01T00:00:00Z',learning_version:1}))
 mock.rows.push(...[...generatedNumberCatalogue.map(item=>item.word),'what','is','are','this','that','over','there','these','those'].flatMap(word=>word.toLowerCase().match(/[a-z]+/g)??[]).map(word=>({word_id:'en:'+word,correct:25,attempts:25,listening_correct:0,direct_correct:0,last_practised:'',recent_results:[true]})))
 const host=document.createElement('div'),root=createRoot(host)
 try{
  await act(async()=>root.render(<GeneratedPractice level={6} {...lessonPracticeTemplate(6)}/>))
  expect([...host.querySelectorAll<HTMLElement>('.practice-question .cw-slot-role')].every(e=>e.style.opacity==='0')).toBe(true)
  expect(host.querySelector('.practice-question .example-gloss,.practice-question .example-translation')).toBeNull()
  const run=JSON.parse(localStorage.getItem('englishsuccess:composed-run:v16:guest:6:lesson-6')!)
  await act(async()=>finishAudio())
  await act(async()=>host.querySelectorAll<HTMLButtonElement>('.binary-answer')[run.questions[0].correct].click())
  expect(answers()[0].modality).toBe('audio')
  expect(loadEvidence()[0]).toMatchObject({heard:true,hidden:true,assisted:false,plays:1})
 }finally{await act(async()=>root.unmount())}
})

it('advances a new phone learner through the shared tree while switching sentence rounds',async()=>{
 const host=document.createElement('div'),root=createRoot(host),user='phone-tree-walk'
 const {hierarchyState}=await import('./wordHierarchy')
 const {masteredWords}=await import('./generatedPracticeProgress')
 let answered=0
 try{
  for(let block=0;block<20;block++){
   const level=(block%6+1) as 1|2|3|4|5|6
   await act(async()=>root.render(<GeneratedPractice level={level} userId={user}/>))
   if(host.querySelector('.practice-complete button'))await act(async()=>host.querySelector<HTMLButtonElement>('.practice-complete button')!.click())
   for(let index=0;index<30;index++){
    const run=saved(level,user),q=run.questions[run.index]
    expect(q).toBeDefined()
    await act(async()=>finishAudio())
    const side=q.correct
    expect(host.querySelectorAll<HTMLButtonElement>('.binary-answer')[side].disabled).toBe(false)
    await act(async()=>host.querySelectorAll<HTMLButtonElement>('.binary-answer')[side].click())
    await act(async()=>host.querySelector<HTMLButtonElement>('.practice-continue-surface')!.click())
    answered++
   }
   const events=loadEvidence(user)
   expect(events).toHaveLength(answered)
   const state=hierarchyState(masteredWords([],events))
   if(state.noun.completed.length>=2&&state.noun.completed.includes('man')){
    expect(state.noun.current).not.toContain('man')
    expect(answers()).toHaveLength(answered)
    expect(new Set(answers().map(attempt=>attempt.id)).size).toBe(answered)
    expect(events.every(event=>event.heard&&event.plays===1&&!event.assisted)).toBe(true)
    console.log(JSON.stringify({phoneUIAnswers:answered,learntNouns:state.noun.completed,currentNouns:state.noun.current}))
    return
   }
  }
  throw new Error('Phone learner did not advance through the first noun frontier after 600 real UI answers')
 }finally{await act(async()=>root.unmount())}
},180000)
it('records presentation before an answer, survives refresh once, and merges the answer bonus into that encounter',async()=>{
 const {learningStates}=await import('../learning/wordProgress/learningLifecycle')
 const host=document.createElement('div');let root=createRoot(host)
 try{
  await act(async()=>root.render(<GeneratedPractice level={4}/>))
  const first=saved(4),shown=loadEvidence()
  expect(shown).toHaveLength(1);expect(shown[0].phase).toBe('presented')
  expect(answers()).toHaveLength(0)
  for(const word of shown[0].sentence.toLowerCase().match(/[a-z]+/g)??[])expect(learningStates([],shown).get('en:'+word)?.fadeScore).toBe(1)
  await act(async()=>root.unmount());root=createRoot(host)
  await act(async()=>root.render(<GeneratedPractice level={4}/>))
  expect(saved(4).attemptId).toBe(first.attemptId)
  expect(loadEvidence()).toEqual(shown)
  await act(async()=>finishAudio())
  await act(async()=>host.querySelectorAll<HTMLButtonElement>('.binary-answer')[correctSide(4)].click())
  const completed=loadEvidence();expect(completed).toHaveLength(1);expect(completed[0].phase).toBe('answered')
  const focus=completed[0].targets.flatMap(word=>word.toLowerCase().match(/[a-z]+/g)??[]).filter(word=>!['am','is','are'].includes(word))
  for(const word of completed[0].sentence.toLowerCase().match(/[a-z]+/g)??[])expect(learningStates([],completed).get('en:'+word)?.fadeScore).toBe(focus.includes(word)?3:1)
 }finally{await act(async()=>root.unmount())}
},30000)
