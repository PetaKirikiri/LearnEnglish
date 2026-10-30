// @vitest-environment happy-dom
import {beforeEach,expect,it,vi} from 'vitest'
const mock=vi.hoisted(()=>({getUser:vi.fn(),rpc:vi.fn(),from:vi.fn(),range:vi.fn()}))
vi.mock('../lib/supabase',()=>({supabase:{auth:{getUser:mock.getUser},rpc:mock.rpc,from:mock.from}}))
import {readRecall,saveRecall,syncRecall} from './numberRecallStore'
import type {RecallAttempt} from './numberRecall'
const event:RecallAttempt={id:'test-id',word:'hotel',module:1,answer:0,correct:true,at:Date.UTC(2026,9,30),assisted:false,heard:true,replays:1,support:0}
beforeEach(()=>{
 localStorage.clear();vi.clearAllMocks();mock.getUser.mockResolvedValue({data:{user:{id:'a'}}});mock.rpc.mockResolvedValue({error:null});mock.range.mockResolvedValue({data:[],error:null})
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
