import {beforeEach,expect,it,vi} from 'vitest'
const mock=vi.hoisted(()=>({rpc:vi.fn(),getSession:vi.fn()}))
vi.mock('../../lib/supabase',()=>({supabase:{rpc:mock.rpc,auth:{getSession:mock.getSession}}}))
import {submitAttempt} from './submitAttempt'
const payload={p_id:'attempt',p_question:'compose-v2-test',p_answer:'the man'}
const receipt=(status:string)=>({data:{accepted:true,receipt_id:'durable-receipt',client_id:'attempt',status},error:null})
beforeEach(()=>{vi.resetAllMocks();mock.getSession.mockResolvedValue({data:{session:{access_token:'test-token'}}});vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({registered:payload.p_question})}))})
it('registers a new canonical question and retries the same durable receipt before accepting progression',async()=>{
 mock.rpc.mockResolvedValueOnce(receipt('needs_review')).mockResolvedValueOnce(receipt('scored'))
 expect((await submitAttempt('word',payload)).status).toBe('scored')
 expect(mock.rpc.mock.calls.map(call=>call[1])).toEqual([{p_source:'word',p_payload:payload},{p_source:'word',p_payload:payload}])
 expect(fetch).toHaveBeenCalledWith('/api/sentence-audio',expect.objectContaining({body:JSON.stringify({id:payload.p_question,registerOnly:true})}))
})
it('retains the queued answer if canonical registration fails',async()=>{
 mock.rpc.mockResolvedValue(receipt('needs_review'));vi.mocked(fetch).mockResolvedValue({ok:false} as Response)
 await expect(submitAttempt('word',payload)).rejects.toThrow('register')
})
it('never requests registration or audio generation for an already-scored answer',async()=>{
 mock.rpc.mockResolvedValue(receipt('scored'));await submitAttempt('word',payload)
 expect(fetch).not.toHaveBeenCalled()
})
it('sends the ingredient recipe only for canonical registration, keeping receipt payloads unchanged',async()=>{
 const recipe={version:1,example:'reviewed ingredients'}
 mock.rpc.mockResolvedValueOnce(receipt('needs_review')).mockResolvedValueOnce(receipt('scored'))
 await submitAttempt('word',payload,recipe)
 expect(fetch).toHaveBeenCalledWith('/api/sentence-audio',expect.objectContaining({body:JSON.stringify({id:payload.p_question,registerOnly:true,recipe})}))
 expect(mock.rpc.mock.calls.every(call=>call[1].p_payload===payload)).toBe(true)
})
