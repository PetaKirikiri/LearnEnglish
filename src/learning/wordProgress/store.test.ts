// @vitest-environment happy-dom
import {beforeEach,expect,it,vi} from 'vitest'
const mocks=vi.hoisted(()=>({rpc:vi.fn(),getUser:vi.fn()}))
vi.mock('../../lib/supabase',()=>({supabase:{rpc:mocks.rpc,auth:{getUser:mocks.getUser}}}))
import {flushWordAttempts,pendingAttempts,queueAttempt} from './store'
import type {WordAttempt} from './model'
const attempt:WordAttempt={id:'attempt-1',questionId:'q1',version:1,answer:'yes',occurredAt:'2026-10-27T00:00:00Z',modality:'faded',replays:0,ruleVersion:1}
const receipt=(id:string,status='scored')=>({data:{accepted:true,receipt_id:'receipt-'+id,client_id:id,status},error:null})
beforeEach(()=>{localStorage.clear();vi.resetAllMocks();mocks.getUser.mockResolvedValue({data:{user:{id:'a'}}});mocks.rpc.mockImplementation(async(_name,args)=>receipt(args.p_payload.p_id))})
it('retains failed requests and retries the same id without duplicating the outbox',async()=>{
 queueAttempt('a',attempt);queueAttempt('a',attempt)
 mocks.rpc.mockResolvedValueOnce({error:new Error('offline')}).mockResolvedValueOnce(receipt(attempt.id))
 await expect(flushWordAttempts('a')).rejects.toThrow('offline');expect(pendingAttempts('a')).toHaveLength(1)
 await flushWordAttempts('a');expect(pendingAttempts('a')).toHaveLength(0)
 expect(mocks.rpc.mock.calls.map(c=>c[1].p_payload.p_id)).toEqual(['attempt-1','attempt-1'])
})
it('never sends another account’s queued answers',async()=>{
 queueAttempt('b',attempt)
 await expect(flushWordAttempts('b')).rejects.toThrow('Account changed')
 expect(mocks.rpc).not.toHaveBeenCalled();expect(pendingAttempts('b')).toHaveLength(1)
})
it('keeps newly queued answers when an earlier request completes',async()=>{
 queueAttempt('a',attempt)
 mocks.rpc.mockImplementation(async()=>{queueAttempt('a',{...attempt,id:'attempt-2'});return receipt(attempt.id)})
 await flushWordAttempts('a');expect(pendingAttempts('a').map(a=>a.id)).toEqual(['attempt-2'])
})
it('accepts held receipts without blocking later answers',async()=>{
 queueAttempt('a',attempt);queueAttempt('a',{...attempt,id:'attempt-2'})
 mocks.rpc.mockImplementation(async(_name,args)=>receipt(args.p_payload.p_id,args.p_payload.p_id===attempt.id?'needs_review':'scored'))
 await flushWordAttempts('a')
 expect(mocks.rpc.mock.calls.map(call=>call[1].p_payload.p_id)).toEqual(['attempt-1','attempt-2'])
 expect(mocks.rpc.mock.calls.every(call=>call[0]==='submit_english_attempt'&&call[1].p_source==='word')).toBe(true)
 expect(pendingAttempts('a')).toEqual([])
})
it.each([null,{accepted:true},{accepted:true,receipt_id:'saved',client_id:'another',status:'scored'}])('keeps answers without a matching saved receipt: %j',async(data)=>{
 queueAttempt('a',attempt);mocks.rpc.mockResolvedValue({data,error:null})
 await expect(flushWordAttempts('a')).rejects.toThrow('Answer receipt not confirmed')
 expect(pendingAttempts('a')).toEqual([attempt])
})
it('keeps presentation and answer receipts for the same attempt separate across retries',async()=>{
 const view={...attempt,event:'presented' as const,answer:''}
 queueAttempt('a',view);queueAttempt('a',attempt);queueAttempt('a',view)
 expect(pendingAttempts('a')).toHaveLength(2)
 mocks.rpc.mockResolvedValueOnce(receipt(attempt.id)).mockResolvedValueOnce({error:new Error('offline')})
 await expect(flushWordAttempts('a')).rejects.toThrow('offline')
 expect(pendingAttempts('a')).toEqual([attempt])
 await flushWordAttempts('a');expect(pendingAttempts('a')).toEqual([])
 expect(mocks.rpc.mock.calls.map(call=>call[1].p_payload.p_event??'answered')).toEqual(['presented','answered','answered'])
})
