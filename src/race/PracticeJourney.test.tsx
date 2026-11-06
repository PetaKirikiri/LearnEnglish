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
it('starts the selected round in one tap and preserves assessed progress',async()=>{
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
it('opens the unlocked Level 6 round directly and keeps earlier star results', async () => {
 localStorage.setItem(actionStarKey('test'), JSON.stringify({
  version: actionStarsVersion, progress: {1: {passes: 2, best: 47}, 2: {passes: 1, best: 46}}, reported: [],
 }))
 const host = document.createElement('div'), root = createRoot(host)
 try {
  await act(async () => root.render(<PracticeJourney userId="test"/>))
  await act(async () => host.querySelector<HTMLButtonElement>('[aria-label^="เปิด Level 6:"]')!.click())
  expect(host.querySelectorAll('.practice-answers button')).toHaveLength(2)
  expect(host.querySelector('.action-stars-menu,.journey-guide,.action-star-teaching')).toBeNull()
  expect(localStorage.getItem(actionStarKey('test') + ':run:2')).toBeTruthy()
  expect(loadActionStarProgress('test').progress[1]).toEqual({passes: 2, best: 47})
  await act(async () => host.querySelector<HTMLButtonElement>('[aria-label="กลับแผนที่"]')!.click())
  expect(host.querySelectorAll('.journey-node')).toHaveLength(6)
 } finally { await act(async () => root.unmount()) }
})
