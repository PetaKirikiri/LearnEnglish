// @vitest-environment-options {"settings":{"disableIframePageLoading":true}}
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { expect, it, vi } from 'vitest'
import type { RaceView } from '../race/types'
import ClassroomRace from './ClassroomRace'

const mocks = vi.hoisted(() => ({ connection: {} as Record<string, unknown>, request: vi.fn(), qr: vi.fn() }))
vi.mock('../race/connection', () => ({ HOST_KEY:'test-host', useRaceConnection:()=>mocks.connection, raceRequest:mocks.request }))
vi.mock('qrcode', () => ({ default:{toDataURL:mocks.qr} }))
vi.mock('./language', () => ({t:(value:string)=>value}))
vi.mock('../race/RaceHostView', () => ({default:()=> <div data-testid="live-race">Live race</div>}))
vi.mock('../race/CartoonHorse', () => ({default:()=>null}))

it('keeps public joining, the changing roster, round selection and starting inside the notes', async()=>{
  Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true})
  Element.prototype.scrollIntoView = vi.fn()
  const credentials = {room:'TEST',token:'test-only'}
  const view:RaceView = {id:'TEST',run:1,stageId:'lesson-two-number',phase:'lobby',round:-1,finish:6000,serverNow:1,motionAt:1,title:'Lesson 2',players:[],opensAt:0,closesAt:0,joinUrl:'https://learn-english-coral.vercel.app/english/race/join/TEST'}
  mocks.qr.mockResolvedValue('data:image/png;base64,test')
  mocks.connection = {credentials,view,now:1,connection:'',remember:vi.fn(),forget:vi.fn(),sync:vi.fn()}
  const host=document.createElement('div'); document.body.append(host)
  const root=createRoot(host)
  const render=()=>root.render(<ClassroomRace lessonId="lesson-2" stages={['lesson-two-number','lesson-two-owner','lesson-two-review']}/> )
  const originalUrl=window.location.href
  try {
    await act(async()=>render())
    expect(host.querySelector<HTMLButtonElement>('.cw-race-go')?.disabled).toBe(true)
    expect(mocks.qr).toHaveBeenCalledWith(view.joinUrl,expect.any(Object))
    view.players=[{id:'p',name:'Student joined',lane:0,metres:0,speed:0,answered:false}]
    await act(async()=>render())
    expect(host.querySelector('.cw-race-roster')?.textContent).toContain('Student joined')
    expect(host.querySelector<HTMLButtonElement>('.cw-race-go')?.disabled).toBe(false)
    mocks.request.mockResolvedValue({...view,stageId:'lesson-two-review'})
    await act(async()=>host.querySelectorAll<HTMLButtonElement>('.cw-round-card')[2].click())
    expect(mocks.request).toHaveBeenLastCalledWith('prepare',credentials,{stage:'lesson-two-review',run:1})
    await act(async()=>host.querySelector<HTMLButtonElement>('.cw-join-toggle')!.click())
    expect(host.querySelector('.cw-join-popover a')?.getAttribute('href')).toBe(view.joinUrl)
    mocks.request.mockResolvedValue({...view,phase:'answering'})
    await act(async()=>host.querySelector<HTMLButtonElement>('.cw-race-go')!.click())
    expect(mocks.request).toHaveBeenLastCalledWith('control',credentials,{action:'start',round:-1,run:1})
    mocks.connection.view={...view,phase:'answering'}
    await act(async()=>render())
    expect(document.querySelector('[data-testid="live-race"]')).not.toBeNull()
    expect(window.location.href).toBe(originalUrl)
  } finally {await act(async()=>root.unmount());host.remove()}
})
