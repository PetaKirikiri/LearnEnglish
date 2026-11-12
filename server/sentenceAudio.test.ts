import {beforeEach,expect,it,vi} from 'vitest'
import type {IncomingMessage,ServerResponse} from 'node:http'
const mock=vi.hoisted(()=>({getUser:vi.fn(),rpc:vi.fn(),download:vi.fn(),upload:vi.fn(),upsert:vi.fn()}))
vi.mock('@supabase/supabase-js',()=>({createClient:()=>({auth:{getUser:mock.getUser},rpc:mock.rpc,from:()=>({upsert:mock.upsert}),storage:{from:()=>({download:mock.download,upload:mock.upload,getPublicUrl:(p:string)=>({data:{publicUrl:`https://audio.invalid/${p}`}})})}})}))
vi.mock('../src/race/generatedPracticeAudio.json',()=>({default:{}}))
import handler,{audioIdentity} from './sentenceAudio'
import {generatedCandidates,sentenceKey} from '../src/race/generatedPracticeContent'
import manifest from '../src/race/generatedPracticeAudio.json'
const missing=generatedCandidates(6).find(q=>!q.audioUrl&&!(manifest as Record<string,string>)[sentenceKey(q.document.english)])!
async function request(body:unknown,token='test'){
 let status=0,result:unknown
 const res={set statusCode(n:number){status=n},setHeader:vi.fn(),end:(s:string)=>{result=JSON.parse(s)}} as unknown as ServerResponse
 await handler({method:'POST',headers:{authorization:token?`Bearer ${token}`:undefined},body} as IncomingMessage&{body:unknown},res)
 return {status,result}
}
beforeEach(()=>{vi.resetAllMocks();vi.stubEnv('VITE_SUPABASE_URL','https://db.invalid');vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY','service');vi.stubEnv('ELEVENLABS_API_KEY','secret');vi.stubEnv('ELEVENLABS_VOICE_ID','voice');mock.getUser.mockResolvedValue({data:{user:{id:'learner'}}});mock.rpc.mockResolvedValue({data:'claimed'});mock.download.mockResolvedValue({error:{message:'missing'}});mock.upload.mockResolvedValue({});mock.upsert.mockResolvedValue({error:null});vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(new Uint8Array(200),{headers:{'Content-Type':'audio/mpeg'}})))})
it('keys audio by sentence, voice and model rather than learner',()=>{expect(audioIdentity('Hello.','a','m')).toBe(audioIdentity(' Hello. ','a','m'));expect(audioIdentity('Hello.','a','m')).not.toBe(audioIdentity('Hello?','a','m'));expect(audioIdentity('Hello.','a','m')).not.toBe(audioIdentity('Hello.','b','m'))})
it('rejects unsigned requests and arbitrary paid text',async()=>{expect((await request({id:missing.id},'')).status).toBe(401);expect((await request({id:'arbitrary',text:'Generate anything'})).status).toBe(400);expect(fetch).not.toHaveBeenCalled()})
it('returns a shared cache hit without spending credits',async()=>{mock.rpc.mockResolvedValue({data:'ready'});expect((await request({id:missing.id})).status).toBe(200);expect(fetch).not.toHaveBeenCalled()})
it('does not duplicate another worker and stores successful generation once',async()=>{mock.rpc.mockResolvedValueOnce({data:'pending'});await request({id:missing.id});expect(fetch).not.toHaveBeenCalled();await request({id:missing.id});expect(fetch).toHaveBeenCalledTimes(1);expect(mock.upload).toHaveBeenCalledTimes(1);expect(mock.rpc).toHaveBeenLastCalledWith('finish_sentence_audio',expect.objectContaining({p_success:true}))})
it('backs off on quota failure and returns an immediate fallback status',async()=>{vi.mocked(fetch).mockResolvedValueOnce(new Response('',{status:429}));expect((await request({id:missing.id})).result).toEqual({status:'unavailable'});expect(mock.rpc).toHaveBeenLastCalledWith('finish_sentence_audio',expect.objectContaining({p_success:false,p_quota:true}));expect(mock.upload).not.toHaveBeenCalled()})

it('registers the canonical scoring question without spending speech credits',async()=>{
 const result=await request({id:missing.id,registerOnly:true,text:'Ignore this arbitrary text'})
 expect(result).toEqual({status:200,result:{registered:missing.id}})
 expect(mock.upsert).toHaveBeenCalledWith(expect.objectContaining({id:missing.id,sentence:missing.document.english,answer:missing.choices[missing.correct],credit_sentence:missing.credit}),expect.objectContaining({ignoreDuplicates:true}))
 expect(fetch).not.toHaveBeenCalled()
 expect(mock.rpc).not.toHaveBeenCalled()
})
