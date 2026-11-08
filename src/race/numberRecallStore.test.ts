// @vitest-environment happy-dom
import {beforeEach,expect,it,vi} from 'vitest'
const mock=vi.hoisted(()=>({getUser:vi.fn(),rpc:vi.fn(),from:vi.fn(),range:vi.fn()}))
vi.mock('../lib/supabase',()=>({supabase:{auth:{getUser:mock.getUser},rpc:mock.rpc,from:mock.from}}))
import {readRecall,saveRecall,syncRecall} from './numberRecallStore'
import type {RecallAttempt} from './numberRecall'
const event:RecallAttempt={id:'test-id',word:'hotel',module:1,answer:0,correct:true,at:Date.UTC(2026,9,30),assisted:false,heard:true,replays:1,support:0}
const receipt=(id:string,status='scored')=>({data:{accepted:true,receipt_id:'receipt-'+id,client_id:id,status},error:null})
beforeEach(()=>{
 localStorage.clear();vi.resetAllMocks();mock.getUser.mockResolvedValue({data:{user:{id:'a'}}});mock.rpc.mockImplementation(async(_name,args)=>receipt(args.p_payload.p_id));mock.range.mockResolvedValue({data:[],error:null})
 const query={select:()=>query,eq:()=>query,order:()=>query,range:mock.range};mock.from.mockReturnValue(query)
})
it('deduplicates local attempts and keeps accounts separate',()=>{
 saveRecall(event,'a');saveRecall(event,'a');saveRecall({...event,correct:false},'b')
 expect(readRecall('a')).toEqual([event]);expect(readRecall('b')[0].correct).toBe(false);expect(readRecall()).toEqual([])
 localStorage.setItem('english:number-recall:v1:a','{}');expect(readRecall('a')).toEqual([])
})
it('retains failed uploads and retries the same id before loading server history',async()=>{
 saveRecall(event,'a');mock.rpc.mockResolvedValueOnce({error:Error('offline')})
 await expect(syncRecall('a')).rejects.toThrow('offline');expect(readRecall('a')).toEqual([event])
 mock.range.mockResolvedValue({data:[{...event,occurred_at:new Date(event.at).toISOString()}],error:null})
 await syncRecall('a');expect(mock.rpc).toHaveBeenCalledTimes(2)
 expect(mock.rpc.mock.calls[0]).toEqual(mock.rpc.mock.calls[1]);expect(readRecall('a')).toHaveLength(1)
 await syncRecall('a');expect(mock.rpc).toHaveBeenCalledTimes(2)
})
it('does not send another account’s attempts',async()=>{
 saveRecall(event,'b');await expect(syncRecall('b')).rejects.toThrow('Account changed');expect(mock.rpc).not.toHaveBeenCalled();expect(readRecall('b')).toEqual([event])
})
it('keeps new answers that arrive while history is downloading',async()=>{
 let resolve!:(value:unknown)=>void;mock.range.mockImplementation(()=>new Promise(done=>{resolve=done}))
 const work=syncRecall('a');await vi.waitFor(()=>expect(mock.range).toHaveBeenCalled())
 saveRecall(event,'a');resolve({data:[],error:null});await work
 expect(readRecall('a')).toEqual([event]);expect(mock.rpc).toHaveBeenCalledTimes(1)
 expect(JSON.parse(localStorage.getItem('english:number-recall:v1:a:outbox')??'[]')).toEqual([])
})
it('keeps held history while saved receipts let valid siblings upload',async()=>{
 const held={...event,id:'held',word:'water'},valid={...event,id:'valid'}
 saveRecall(held,'a');saveRecall(valid,'a')
 mock.rpc.mockImplementation(async(_name,args)=>receipt(args.p_payload.p_id,args.p_payload.p_id==='held'?'needs_review':'scored'))
 await syncRecall('a')
 expect(mock.rpc.mock.calls.map(call=>call[1].p_payload.p_id)).toEqual(['held','valid'])
 expect(mock.rpc.mock.calls.every(call=>call[0]==='submit_english_attempt'&&call[1].p_source==='number')).toBe(true)
 expect(JSON.parse(localStorage.getItem('english:number-recall:v1:a:outbox')??'[]')).toEqual([])
 expect(readRecall('a')).toEqual([held,valid])
 await syncRecall('a');expect(mock.rpc).toHaveBeenCalledTimes(2)
})
it('retains an answer when the server response does not confirm its receipt',async()=>{
 saveRecall(event,'a');mock.rpc.mockResolvedValue({data:null,error:null})
 await expect(syncRecall('a')).rejects.toThrow('Answer receipt not confirmed')
 expect(JSON.parse(localStorage.getItem('english:number-recall:v1:a:outbox')??'[]')).toEqual([event])
})
it('replaces a settled legacy receipt without duplicating it or collapsing later reps',async()=>{
 const legacy={...event,id:'0-hotel'}
 saveRecall(legacy,'a')
 mock.range.mockResolvedValue({data:[
  {...event,id:'server-first',legacy_id:legacy.id,occurred_at:new Date(event.at).toISOString()},
  {...event,id:'server-second',legacy_id:legacy.id,occurred_at:new Date(event.at+60000).toISOString()},
 ],error:null})
 await syncRecall('a')
 expect(readRecall('a').map(row=>row.id)).toEqual(['server-first','server-second'])
})
it('stops on a connection failure without discarding any queued answers',async()=>{
 saveRecall(event,'a');saveRecall({...event,id:'second'},'a')
 mock.rpc.mockResolvedValue({error:Error('offline')})
 await expect(syncRecall('a')).rejects.toThrow('offline')
 expect(mock.rpc).toHaveBeenCalledTimes(1)
 expect(JSON.parse(localStorage.getItem('english:number-recall:v1:a:outbox')??'[]')).toHaveLength(2)
})
