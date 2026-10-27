// @vitest-environment happy-dom
import {beforeEach,expect,it,vi} from 'vitest'
const mocks=vi.hoisted(()=>({rpc:vi.fn(),getUser:vi.fn()}))
vi.mock('../../lib/supabase',()=>({supabase:{rpc:mocks.rpc,auth:{getUser:mocks.getUser}}}))
import {flushWordAttempts,pendingAttempts,queueAttempt} from './store'
import type {WordAttempt} from './model'
const attempt:WordAttempt={id:'attempt-1',questionId:'q1',version:1,answer:'yes',occurredAt:'2026-10-27T00:00:00Z',modality:'faded',replays:0,ruleVersion:1}
beforeEach(()=>{localStorage.clear();vi.resetAllMocks();mocks.getUser.mockResolvedValue({data:{user:{id:'a'}}})})
it('retains failed requests and retries the same id without duplicating the outbox',async()=>{
 queueAttempt('a',attempt);queueAttempt('a',attempt)
 mocks.rpc.mockResolvedValueOnce({error:new Error('offline')}).mockResolvedValueOnce({error:null})
 await expect(flushWordAttempts('a')).rejects.toThrow('offline');expect(pendingAttempts('a')).toHaveLength(1)
 await flushWordAttempts('a');expect(pendingAttempts('a')).toHaveLength(0)
 expect(mocks.rpc.mock.calls.map(c=>c[1].p_id)).toEqual(['attempt-1','attempt-1'])
})
it('never sends another account’s queued answers',async()=>{
 queueAttempt('b',attempt)
 await expect(flushWordAttempts('b')).rejects.toThrow('Account changed')
 expect(mocks.rpc).not.toHaveBeenCalled();expect(pendingAttempts('b')).toHaveLength(1)
})
it('keeps newly queued answers when an earlier request completes',async()=>{
 queueAttempt('a',attempt)
 mocks.rpc.mockImplementation(async()=>{queueAttempt('a',{...attempt,id:'attempt-2'});return{error:null}})
 await flushWordAttempts('a');expect(pendingAttempts('a').map(a=>a.id)).toEqual(['attempt-2'])
})
