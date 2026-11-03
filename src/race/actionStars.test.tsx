// @vitest-environment happy-dom
import {act} from 'react'
import {createRoot} from 'react-dom/client'
import {beforeEach,it,expect,vi} from 'vitest'
import {readFileSync,existsSync} from 'node:fs'
import {actionStarTiers,actionStarLesson,actionStarDeck,actionStarTeachingExample,completeStar,starAvailable,type StarProgress} from './actionStarContent'
import {composeLessonAction,actionCapabilities} from '../learning/sentenceRules/actionCapabilities'
const record=vi.hoisted(()=>vi.fn())
vi.mock('../learning/wordProgress/useWordProgress',()=>({useWordProgress:()=>({ready:true,error:'',record,retry:vi.fn()})}))
vi.mock('./PracticeGold',()=>({default:()=>null,awardPracticeGold:vi.fn()}))
import ActionStarCourse from './ActionStarCourse'
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true})
let finishAudio:()=>void=()=>{}
beforeEach(()=>{localStorage.clear();record.mockClear();vi.stubGlobal('Audio',class{onended:(()=>void)|null=null;onerror:(()=>void)|null=null;src:string;constructor(src:string){this.src=src}pause(){}play(){finishAudio=()=>this.onended?.();return Promise.resolve()}})})
it('generates three disjoint sets of fifty from compatible blueprint requests and exact recordings',()=>{
 const ids=new Set<string>(),sentences=new Set<string>(),manifest=JSON.parse(readFileSync('public/audio/action-practice/voice-manifest.json','utf8'))
 const capability=actionCapabilities(actionStarLesson)
 for(const tier of actionStarTiers){
  expect(tier.questions).toHaveLength(50)
  expect(new Set(tier.questions.map(q=>q.provenance.subject.toLowerCase()))).toEqual(new Set(['i','you','he','she','we','they']))
  expect(new Set(tier.questions.map(q=>q.provenance.determiner))).toEqual(new Set(['my','your','his','her','our','their']))
  for(const q of tier.questions){
   expect(ids.has(q.id)).toBe(false);ids.add(q.id)
   expect(sentences.has(q.english)).toBe(false);sentences.add(q.english)
   const p=q.provenance,answer=composeLessonAction(actionStarLesson,p).answer
   expect(answer.english).toBe(q.english);expect(answer.thai).toBe(q.thai);expect(answer.units).toEqual(q.units)
   expect(capability.objects(p.action).some(o=>o.noun===p.noun)).toBe(true)
   expect(capability.determiners(capability.objects(p.action).find(o=>o.noun===p.noun)!).some(owner=>composeLessonAction(actionStarLesson,{...p,determiner:owner.word}).answer.thai===q.choices[1])).toBe(true)
   expect(q.choices[0]).not.toBe(q.choices[1])
   expect(existsSync(`public${q.audioUrl}`)).toBe(true)
   expect(manifest[q.audioUrl.split('/').pop()!].text).toBe(q.english)
  }
 }
 expect(ids.size).toBe(150)
 for(const action of ['holding','opening','washing'])expect(ids.has(actionStarTeachingExample(action).id)).toBe(false)
})
it('keeps new verbs in separate stages, brings familiar content back and balances answer positions',()=>{
 expect(new Set(actionStarTiers[0].questions.map(q=>q.provenance.action))).toEqual(new Set(['eating','reading','drinking']))
 const next=actionStarTiers[1].questions.map(q=>q.provenance.action)
 expect(next.indexOf('holding')).toBe(0);expect(next.indexOf('opening')).toBeGreaterThan(next.lastIndexOf('holding'));expect(next.indexOf('washing')).toBeGreaterThan(next.lastIndexOf('opening'))
 for(const tier of actionStarTiers){
  const deck=actionStarDeck(tier.stars,'repeatable')
  expect(deck).toEqual(actionStarDeck(tier.stars,'repeatable'))
  expect(deck.filter(q=>q.correct===0)).toHaveLength(25)
  expect(new Set(deck.map(q=>q.id))).toEqual(new Set(tier.questions.map(q=>q.id)))
 }
 expect(new Set(actionStarTiers[2].questions.map(q=>q.provenance.action)).size).toBe(6)
})
it('requires two complete unassisted successes and keeps prior success on a later unsuccessful run',()=>{
 let progress:StarProgress={}
 expect(starAvailable(2,progress)).toBe(false)
 progress=completeStar(progress,1,50,50,false);expect(starAvailable(2,progress)).toBe(false)
 progress=completeStar(progress,1,44,50,true);expect(starAvailable(2,progress)).toBe(false)
 progress=completeStar(progress,1,45,50,true);expect(starAvailable(2,progress)).toBe(false)
 progress=completeStar(progress,1,46,50,true);expect(starAvailable(2,progress)).toBe(true)
 const old=progress[1]!.passes;progress=completeStar(progress,1,3,50,true);expect(progress[1]!.passes).toBe(old)
 expect(completeStar(progress,2,20,21,true)).toBe(progress)
})
it('uses the existing quadrant, waits for finished audio and reveals language only after answering',async()=>{
 const host=document.createElement('div'),root=createRoot(host)
 const click=async(selector:string)=>act(async()=>host.querySelector<HTMLButtonElement>(selector)!.click())
 try{
  await act(async()=>root.render(<ActionStarCourse/>))
  expect(host.querySelector<HTMLButtonElement>('[aria-label="2 star · 50 questions"]')?.disabled).toBe(true)
  await click('[aria-label="1 star · 50 questions"]')
  await act(async()=>[...host.querySelectorAll('button')].find(b=>b.textContent?.includes('เริ่มฟัง'))!.click())
  expect(host.querySelector('[data-matrix-layout="action-answer"]')).not.toBeNull()
  expect(host.querySelector('.example-source,.example-gloss,.example-translation')).toBeNull()
  expect(host.querySelector<HTMLButtonElement>('.binary-answer')?.disabled).toBe(true)
  await act(async()=>finishAudio())
  expect(host.querySelector<HTMLButtonElement>('.binary-answer')?.disabled).toBe(false)
  await click('.binary-answer')
  expect(host.querySelector('.example-source')).not.toBeNull();expect(host.querySelector('.example-translation')).not.toBeNull()
  expect(record).toHaveBeenCalledOnce()
  await click('.binary-answer');expect(record).toHaveBeenCalledOnce()
 }finally{await act(async()=>root.unmount());vi.unstubAllGlobals()}
})
it('uses separate teaching examples and the same audio-only assessment contract in all three tiers',async()=>{
 const {actionStarsVersion}=await import('./actionStarContent')
 for(const stars of [1,2,3] as const){
  localStorage.clear();localStorage.setItem('existing-student-progress','keep')
  localStorage.setItem('englishsuccess:action-stars:v1:guest',JSON.stringify({version:actionStarsVersion,progress:{1:{passes:2,best:50},2:{passes:2,best:50}},reported:[]}))
  const host=document.createElement('div'),root=createRoot(host)
  try{
   await act(async()=>root.render(<ActionStarCourse/>))
   await act(async()=>host.querySelector<HTMLButtonElement>(`[aria-label="${stars} star · 50 questions"]`)!.click())
   if(stars===2){
    const shown=host.querySelector('.cw-sentence-board')?.getAttribute('aria-label')
    expect(actionStarTiers.flatMap(t=>t.questions.map(q=>q.english))).not.toContain(shown)
    expect(host.querySelector('[data-matrix-layout="action-answer"]')).not.toBeNull()
   }
   await act(async()=>[...host.querySelectorAll('button')].find(b=>b.textContent?.includes('เริ่มฟัง'))!.click())
   expect(host.querySelector('.example-source,.example-gloss,.example-translation')).toBeNull()
   expect(host.querySelector<HTMLButtonElement>('.binary-answer')?.disabled).toBe(true)
   await act(async()=>finishAudio())
   expect(host.querySelector<HTMLButtonElement>('.binary-answer')?.disabled).toBe(false)
   expect(localStorage.getItem('existing-student-progress')).toBe('keep')
  }finally{await act(async()=>root.unmount())}
 }
})
