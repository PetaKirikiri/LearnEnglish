import {beforeEach,expect,it,vi} from 'vitest'
import type {IncomingMessage,ServerResponse} from 'node:http'
const mock=vi.hoisted(()=>({getUser:vi.fn(),upsert:vi.fn(),audio:vi.fn()}))
vi.mock('@supabase/supabase-js',()=>({createClient:()=>({auth:{getUser:mock.getUser},from:()=>({upsert:mock.upsert})})}))
vi.mock('./kokoroCache',()=>({cachedKokoro:mock.audio}))
import handler from './sentenceAudio'
import {nextPersonalQuestion} from '../src/race/practiceForecast'
const question=nextPersonalQuestion(1,[],[],'server-kokoro-fixture',0)
async function request(body:unknown,token='test'){
 let status=0,result:unknown
 const res={set statusCode(n:number){status=n},setHeader:vi.fn(),end:(value:string)=>{result=JSON.parse(value)}} as unknown as ServerResponse
 await handler({method:'POST',headers:{authorization:token?`Bearer ${token}`:undefined},body} as IncomingMessage&{body:unknown},res)
 return {status,result}
}
beforeEach(()=>{vi.resetAllMocks();vi.stubEnv('VITE_SUPABASE_URL','https://db.invalid');vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY','service');mock.getUser.mockResolvedValue({data:{user:{id:'learner'}}});mock.audio.mockResolvedValue({url:'https://audio.invalid/kokoro.wav',timingUrl:'https://audio.invalid/kokoro.json',cached:false});mock.upsert.mockResolvedValue({error:null})})
it('authenticates and resolves the canonical question before generating audio',async()=>{
 const result=await request({id:question.id,recipe:question.recipe})
 expect(result).toMatchObject({status:200,result:{provider:'kokoro',url:'https://audio.invalid/kokoro.wav'}})
 expect(mock.audio).toHaveBeenCalledWith(expect.anything(),question.document.english)
})
it('rejects unsigned requests and arbitrary text',async()=>{
 expect((await request({id:question.id},'')).status).toBe(401)
 expect((await request({id:'unknown',text:'arbitrary'})).status).toBe(400)
 expect(mock.audio).not.toHaveBeenCalled()
})
it('keeps scoring registration independent of speech generation',async()=>{
 expect((await request({id:question.id,recipe:question.recipe,registerOnly:true})).result).toEqual({registered:question.id})
 expect(mock.upsert).toHaveBeenCalled();expect(mock.audio).not.toHaveBeenCalled()
})
it('returns a recoverable error if server synthesis fails',async()=>{
 mock.audio.mockRejectedValue(new Error('model unavailable'))
 expect((await request({id:question.id,recipe:question.recipe})).status).toBe(503)
})
