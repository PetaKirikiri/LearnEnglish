// @vitest-environment happy-dom
import {act} from 'react'
import {createRoot} from 'react-dom/client'
import {beforeEach,expect,it,vi} from 'vitest'
vi.mock('./PracticeGold',()=>({default:()=>null}))
vi.mock('./JourneyPasses',()=>({useJourneyPasses:()=>({passes:[],unavailable:false}),JourneyPassNames:()=>null}))
vi.mock('./NumberFoundationCourse',()=>({default:({initialLevel,onComplete,onExit}:{initialLevel:number;onComplete:(level:number,score:number,total:number,passed:boolean)=>void;onExit:()=>void})=><div><span>Run {initialLevel}</span><button onClick={()=>onComplete(initialLevel,30,30,true)}>Finish</button><button onClick={onExit}>Exit</button></div>}))
import PracticeJourney,{mergeRun,recordStars,runStars} from './PracticeJourney'
import {actionStarKey,loadActionStarProgress} from './actionStarProgress'
import {actionStarsVersion} from './actionStarContent'
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true})
beforeEach(()=>{localStorage.clear();history.replaceState({},'','/english/practice');vi.stubGlobal('Audio',class{pause(){}play(){return Promise.resolve()}})})
it('keeps level selection separate from teaching and preserves assessed progress',async()=>{
 const host=document.createElement('div'),root=createRoot(host)
 try{
  await act(async()=>root.render(<PracticeJourney userId="test"/>))
  const cards=host.querySelectorAll('.journey-node')
  expect(cards).toHaveLength(6)
  expect(host.querySelector('.journey-briefing,.journey-goals,.binary-answer')).toBeNull()
  for(const card of cards)expect(card.querySelectorAll('button')).toHaveLength(1)
  expect([...cards].map(card=>[...card.querySelectorAll('.tonight-slots')].map(matrix=>matrix.getAttribute('aria-label')))).toEqual([
   ['key','keys'],['Where is the key?'],['Where are the keys?'],
   ['What are you doing?'],['I am eating an apple.'],['I am eating your apple.'],
  ])
  expect(host.querySelectorAll('[data-density="thumbnail"]')).toHaveLength(7)
  await act(async()=>host.querySelector<HTMLButtonElement>('[aria-label^="เปิด Level 1:"]')!.click())
  expect(host.querySelectorAll('.journey-briefing')).toHaveLength(1)
  expect(host.querySelector('.journey-level-grid')).toBeNull()
  expect(host.querySelectorAll('header')).toHaveLength(1)
  expect(host.querySelector('.journey-header-play')?.textContent).toBe('เริ่ม')
  expect(host.querySelector('.journey-guide .journey-card-play')).toBeNull()
  expect(host.textContent).not.toContain('ลองก่อนเล่น')
  expect(host.querySelector('.journey-guide .journey-rule')).toBeNull()
  await act(async()=>host.querySelector<HTMLButtonElement>('[aria-label="กลับไปเลือกด่าน"]')!.click())
  expect(host.querySelectorAll('.journey-node')).toHaveLength(6)
  await act(async()=>host.querySelector<HTMLButtonElement>('[aria-label^="เปิด Level 1:"]')!.click())
  await act(async()=>host.querySelector<HTMLButtonElement>('[aria-label="เริ่ม Level 1"]')!.click())
  expect(host.textContent).toContain('Run 1')
  await act(async()=>[...host.querySelectorAll('button')].find(b=>b.textContent==='Finish')!.click())
  expect(host.textContent).toContain('ผ่านแล้ว!')
  await act(async()=>[...host.querySelectorAll('button')].find(b=>b.textContent==='เลือกด่าน')!.click())
  expect(host.querySelectorAll('.journey-node.cleared')).toHaveLength(1)
  expect(host.querySelector('.journey-node:first-child [aria-label=ผ่านแล้ว]')).not.toBeNull()
  await act(async()=>root.render(<PracticeJourney userId="another"/>))
  expect(host.querySelectorAll('.journey-node.cleared')).toHaveLength(0)
 }finally{await act(async()=>root.unmount())}
})
it('shows both number forms and their matching answers together without a selector or progress writes',async()=>{
 const audioInstances:{source:string;pause:ReturnType<typeof vi.fn>}[]=[]
 vi.stubGlobal('Audio',class{
  pause=vi.fn()
  constructor(source:string){audioInstances.push({source,pause:this.pause})}
  play(){return Promise.resolve()}
 })
 const host=document.createElement('div'),root=createRoot(host)
 try{
  await act(async()=>root.render(<PracticeJourney userId="demo"/>))
  await act(async()=>host.querySelector<HTMLButtonElement>('[aria-label^="เปิด Level 1:"]')!.click())
  const card=host.querySelector('.journey-guide')!
  const pairs=[...card.querySelectorAll('.journey-number-example')]
  expect(pairs.map(pair=>pair.getAttribute('aria-label'))).toEqual(['key → หนึ่งสิ่ง','keys → หลายสิ่ง'])
  expect(card.querySelector('.journey-variants')).toBeNull()
  expect(card.querySelectorAll('.matrix-layout .cw-noun-group[data-group-size="1"]')).toHaveLength(2)
  expect(card.querySelectorAll('.cw-slot-role .vocabulary-picture')).toHaveLength(2)
  expect(card.querySelector('.example-source strong')?.textContent).toBe('s')
  expect(pairs.map(pair=>pair.querySelector('figcaption')?.textContent)).toEqual(['หนึ่งสิ่ง','หลายสิ่ง'])
  await act(async()=>card.querySelector<HTMLButtonElement>('[aria-label="ฟัง: the key"]')!.click())
  await act(async()=>card.querySelector<HTMLButtonElement>('[aria-label="ฟัง: the keys"]')!.click())
  expect(audioInstances.map(audio=>audio.source)).toEqual(['/audio/number-foundation/the-key.wav','/audio/number-foundation/the-keys.wav'])
  expect(audioInstances[0].pause).toHaveBeenCalled()
  expect(JSON.parse(localStorage.getItem('englishsuccess:journey:v1:demo')!)).toEqual({})
 }finally{await act(async()=>root.unmount())}
 expect(audioInstances[1].pause).toHaveBeenCalled()
})
it('awards performance stars only for complete rounds and keeps the gameplay pass decision',()=>{
 expect(runStars({level:1,score:21,total:30,passed:false})).toBe(1)
 expect(runStars({level:1,score:27,total:30,passed:false})).toBe(1) // unbalanced outcomes
 expect(runStars({level:1,score:27,total:30,passed:true})).toBe(2)
 expect(runStars({level:1,score:30,total:30,passed:true})).toBe(3)
 expect(runStars({level:4,score:10,total:10,passed:true})).toBe(3)
 expect(runStars({level:2,score:1,total:1,passed:false})).toBe(0)
 const record=mergeRun({}, {level:1,score:28,total:30,passed:true})
 const retried=mergeRun(record,{level:1,score:2,total:30,passed:false})
 expect(retried[1]).toEqual({best:28,total:30,cleared:true,stars:2})
 expect(recordStars(1,retried[1])).toBe(2)
 expect(mergeRun(record,{level:1,score:1,total:1,passed:true})).toEqual(record)
 expect(mergeRun({}, {level:2,score:0,total:0,passed:false})).toEqual({})
})
it('preserves level six progress and teaches ownership only after opening its guide',async()=>{
 localStorage.setItem(actionStarKey('test'),JSON.stringify({version:actionStarsVersion,progress:{1:{passes:2,best:47},2:{passes:1,best:46}},reported:[]}))
 expect(loadActionStarProgress('another').progress).toEqual({})
 const host=document.createElement('div'),root=createRoot(host)
 try{
  await act(async()=>root.render(<PracticeJourney userId="test"/>))
  expect(host.querySelector('.journey-goals')).toBeNull()
  await act(async()=>host.querySelector<HTMLButtonElement>('[aria-label^="เปิด Level 6:"]')!.click())
  const card=host.querySelector('.journey-guide')!
  expect(loadActionStarProgress('test').progress[1].passes).toBe(2)
  expect(host.querySelector('.journey-header-play')?.textContent).toBe('เริ่ม')
  expect(card.querySelectorAll('.journey-variants button')).toHaveLength(2)
  await act(async()=>card.querySelectorAll<HTMLButtonElement>('.journey-variants button')[1].click())
  expect(card.querySelector('.tonight-slots')?.getAttribute('aria-label')).toBe('I am eating your apple.')
  expect(card.querySelector('.journey-rule')?.textContent).toContain('ของคุณ')
 }finally{await act(async()=>root.unmount())}
})
