// @vitest-environment happy-dom
import {act} from 'react'
import {createRoot} from 'react-dom/client'
import {expect,it,vi} from 'vitest'
const api=vi.hoisted(()=>({host:vi.fn(),activity:vi.fn()}))
vi.mock('./session',()=>({classroomHostCall:api.host,classroomJoinUrl:()=>'/join'}))
vi.mock('./activity',()=>({classroomActivity:api.activity}))
vi.mock('../drawing/DrawingGame',()=>({default:()=>null}))
vi.mock('qrcode',()=>({default:{toDataURL:()=>Promise.resolve('')}}))
import UniversityClassroom from './UniversityClassroom'
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true})
it('keeps the offline learner and points visible, excludes them from selection, and restores them after a ping',async()=>{
 vi.useFakeTimers();vi.setSystemTime(new Date('2026-11-10T12:00:00Z'))
 localStorage.setItem('su-classroom-host-session','class')
 const member={id:'ann',name:'Ann',active:true,turns:1,coins:30,lastSeen:new Date().toISOString()}
 api.host.mockResolvedValue({id:'class',members:[member],turn:null});api.activity.mockResolvedValue({activity:'join',lesson:3})
 const el=document.createElement('div'),root=createRoot(el)
 const tab=async(name:string)=>act(async()=>[...el.querySelectorAll<HTMLButtonElement>('.phase-button')].find(b=>b.textContent===name)!.click())
 try{
  await act(async()=>root.render(<UniversityClassroom/>))
  expect(el.querySelector('.su-presence')?.textContent).toBe('Online')
  expect(el.querySelector('.su-roster h2')?.textContent).toContain('1 online')
  await act(async()=>vi.advanceTimersByTimeAsync(21000))
  expect(el.querySelector('.su-presence')?.textContent).toBe('Offline')
  expect(el.querySelector('.su-roster h2')?.textContent).toContain('0 online')
  expect(el.querySelector('.su-member')?.textContent).toContain('AnnOffline🪙 30')
  expect(el.querySelector('[aria-label="Remove Ann"]')).not.toBeNull()
  await tab('Testing');expect(el.querySelector<HTMLButtonElement>('[aria-label="Choose next student"]')?.disabled).toBe(true)
  api.host.mockResolvedValue({id:'class',members:[{...member,lastSeen:new Date().toISOString()}],turn:null})
  await act(async()=>vi.advanceTimersByTimeAsync(1500))
  expect(el.querySelector<HTMLButtonElement>('[aria-label="Choose next student"]')?.disabled).toBe(false)
  await tab('Students');expect(el.querySelector('.su-presence')?.textContent).toBe('Online')
 }finally{await act(async()=>root.unmount());localStorage.clear();vi.useRealTimers();vi.resetAllMocks()}
})
