// @vitest-environment happy-dom
import {act} from 'react'
import {createRoot} from 'react-dom/client'
import {afterEach,beforeEach,expect,it,vi} from 'vitest'
const rpc=vi.hoisted(()=>vi.fn())
vi.mock('./session',()=>({classroomCall:rpc}))
import {memberIsOnline,useClassroomClock} from './presence'
import {useStudentSession} from './useStudentSession'
import type {ClassMember,ClassSession} from './session'
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true})
let el:HTMLDivElement,root:ReturnType<typeof createRoot>
const member={id:'ann',name:'Ann',active:true,turns:1,coins:10,lastSeen:'2026-11-10T12:00:00Z'} satisfies ClassMember
const session={id:'class',host:false,me:'ann',members:[member],turn:null} satisfies ClassSession
beforeEach(()=>{vi.useFakeTimers();vi.setSystemTime(new Date(member.lastSeen));el=document.createElement('div');root=createRoot(el);rpc.mockResolvedValue(session);vi.spyOn(document,'visibilityState','get').mockReturnValue('visible');vi.spyOn(navigator,'onLine','get').mockReturnValue(true)})
afterEach(async()=>{await act(async()=>root.unmount());vi.useRealTimers();vi.restoreAllMocks();rpc.mockReset()})
function Student(){const {session,error}=useStudentSession('class');return <div>{session?.me}{error}</div>}
const advance=async(ms:number)=>act(async()=>vi.advanceTimersByTimeAsync(ms))
it('expires presence at twenty seconds without removing membership or points',()=>{
 expect(memberIsOnline(member,Date.now()+19999)).toBe(true)
 expect(memberIsOnline(member,Date.now()+20000)).toBe(false)
 expect(member).toMatchObject({active:true,coins:10,turns:1})
 expect(memberIsOnline({...member,active:false})).toBe(false)
 expect(memberIsOnline({...member,lastSeen:'invalid'})).toBe(false)
})
it('uses server time despite clock skew and ages a stale host snapshot',async()=>{
 // Keep the snapshot stable as it would be after receiving a response.
 const snapshot={...session,serverNow:member.lastSeen,receivedAt:Date.now()+3600000}
 function StableClock(){const now=useClassroomClock(snapshot);return <span>{memberIsOnline(member,now)?'Online':'Offline'}</span>}
 vi.setSystemTime(Date.now()+3600000)
 await act(async()=>root.render(<StableClock/>));expect(el.textContent).toBe('Online')
 await advance(21000);expect(el.textContent).toBe('Offline')
})
it('stops pings when hidden and immediately resumes without joining twice',async()=>{
 await act(async()=>root.render(<Student/>));expect(rpc.mock.calls[0][0]).toBe('join')
 await advance(1500);expect(rpc.mock.calls.at(-1)?.[0]).toBe('state')
 vi.spyOn(document,'visibilityState','get').mockReturnValue('hidden')
 await act(async()=>document.dispatchEvent(new Event('visibilitychange')))
 rpc.mockClear();await advance(30000);expect(rpc).not.toHaveBeenCalled()
 vi.spyOn(document,'visibilityState','get').mockReturnValue('visible')
 await act(async()=>document.dispatchEvent(new Event('visibilitychange')))
 expect(rpc).toHaveBeenCalledTimes(1);expect(rpc.mock.calls[0][0]).toBe('state')
})
it('handles closing, reopening from page cache, and a lost network',async()=>{
 await act(async()=>root.render(<Student/>))
 await act(async()=>window.dispatchEvent(new Event('pagehide')));rpc.mockClear()
 await advance(30000);expect(rpc).not.toHaveBeenCalled()
 await act(async()=>window.dispatchEvent(new Event('pageshow')));expect(rpc.mock.calls[0][0]).toBe('state')
 await act(async()=>window.dispatchEvent(new Event('offline')));rpc.mockClear()
 await advance(30000);expect(rpc).not.toHaveBeenCalled()
 await act(async()=>window.dispatchEvent(new Event('online')));expect(rpc.mock.calls[0][0]).toBe('state')
})
it('retries a failed initial join and prevents a suspended request overwriting the resumed page',async()=>{
 rpc.mockRejectedValueOnce(new Error('Network failed'))
 await act(async()=>root.render(<Student/>));expect(el.textContent).toContain('Network failed')
 await advance(1500);expect(rpc.mock.calls[1][0]).toBe('join');expect(el.textContent).toBe('ann')
 let finish!:(value:ClassSession)=>void
 rpc.mockImplementationOnce(()=>new Promise<ClassSession>(resolve=>{finish=resolve}))
 await advance(1500)
 const signal=rpc.mock.calls.at(-1)?.[3] as AbortSignal
 await act(async()=>window.dispatchEvent(new Event('pagehide')));expect(signal.aborted).toBe(true)
 await act(async()=>window.dispatchEvent(new Event('pageshow')))
 await act(async()=>finish({...session,me:'stale'}));expect(el.textContent).toBe('ann')
})
it('cleans up pings and lifecycle listeners on unmount',async()=>{
 await act(async()=>root.render(<Student/>))
 await act(async()=>root.render(null));rpc.mockClear()
 await advance(30000);await act(async()=>window.dispatchEvent(new Event('pageshow')))
 expect(rpc).not.toHaveBeenCalled()
})
