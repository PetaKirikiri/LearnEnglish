// @vitest-environment happy-dom
import {act} from 'react'
import {createRoot} from 'react-dom/client'
import {beforeEach,expect,it,vi} from 'vitest'
vi.mock('./PracticeGold',()=>({default:()=>null}))
vi.mock('./JourneyPasses',()=>({useJourneyPasses:()=>({passes:[],unavailable:false}),JourneyPassNames:()=>null}))
vi.mock('./GeneratedPractice',()=>({default:({level,onComplete,onExit}:{level:number;onComplete:(level:number,score:number,total:number,passed:boolean)=>void;onExit:()=>void})=><div><span>Run {level}</span><button onClick={()=>onComplete(level,30,30,true)}>Finish</button><button onClick={onExit}>Exit</button></div>}))
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
  expect(cards).toHaveLength(8)
  expect(host.querySelector('.journey-briefing,.journey-goals,.binary-answer')).toBeNull()
  for(const card of cards)expect(card.querySelectorAll('button')).toHaveLength(1)
  expect([...cards].slice(0,6).map(card=>[...card.querySelectorAll('.tonight-slots')].map(matrix=>matrix.getAttribute('aria-label')))).toEqual([
   ['key','keys'],['Where is the key?'],['Where are the keys?'],
   ['What are you doing?'],['I am walking to the hotel.'],['I am eating your apple.'],
  ])
  expect(host.querySelectorAll('[data-density="thumbnail"]')).toHaveLength(9)
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
 expect(runStars({level:4,score:9,total:9,passed:true})).toBe(0)
 expect(runStars({level:4,score:30,total:30,passed:true})).toBe(3)
 expect(recordStars(4,{best:9,total:9,cleared:true,stars:3})).toBe(0)
 expect(mergeRun({4:{best:9,total:9,cleared:true,stars:3}},{level:4,score:27,total:30,passed:true})[4]).toEqual({best:27,total:30,cleared:true,stars:2})
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
  expect(host.textContent).toContain('Run 6')
  expect(host.querySelector('.action-stars-menu,.journey-guide,.action-star-teaching')).toBeNull()
  expect(loadActionStarProgress('test').progress[2]?.passes).toBe(1)
  expect(loadActionStarProgress('test').progress[1]).toEqual({passes: 2, best: 28})
  await act(async () => host.querySelector<HTMLButtonElement>('button:last-child')!.click())
  expect(host.querySelectorAll('.journey-node')).toHaveLength(8)
 } finally { await act(async () => root.unmount()) }
})

it('browser Back from a round returns to the testing map',async()=>{
 const host=document.createElement('div'),root=createRoot(host)
 try{
  await act(async()=>root.render(<PracticeJourney/>))
  await act(async()=>host.querySelector<HTMLButtonElement>('[aria-label^="เปิด Level 6:"]')!.click())
  expect(host.textContent).toContain('Run 6')
  expect(history.state.englishPracticeRound).toBe(true)
  await act(async()=>window.dispatchEvent(new PopStateEvent('popstate',{state:{}})))
  expect(host.querySelectorAll('.journey-node')).toHaveLength(8)
 }finally{await act(async()=>root.unmount())}
})

it.each([[7,17,20],[8,19,17]] as const)('keeps legacy and current clears for Level %i',async(level,legacy,current)=>{
 const prior={best:legacy,total:legacy,cleared:true,stars:3}
 localStorage.setItem('englishsuccess:journey:v1:test',JSON.stringify({[level]:prior}))
 const host=document.createElement('div'),root=createRoot(host)
 try{
  await act(async()=>root.render(<PracticeJourney userId="test"/>))
  expect(host.querySelector(`.journey-node[aria-label="Level ${level}"].cleared`)).not.toBeNull()
  expect(recordStars(level,prior)).toBe(3)
  expect(mergeRun({[level]:prior},{level,score:1,total:current,passed:false})[level]).toEqual(prior)
  expect(mergeRun({[level]:prior},{level,score:current,total:current,passed:true})[level]).toEqual({best:current,total:current,cleared:true,stars:3})
  expect(mergeRun({}, {level,score:current*2,total:current*3,passed:true})).toEqual({})
 }finally{await act(async()=>root.unmount())}
})
