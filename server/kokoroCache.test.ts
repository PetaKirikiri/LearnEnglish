import {beforeEach,expect,it,vi} from 'vitest'
const mock=vi.hoisted(()=>({voice:vi.fn(),download:vi.fn(),upload:vi.fn()}))
vi.mock('./kokoroVoice',()=>({synthesizeKokoro:mock.voice}))
import {cachedKokoro,kokoroIdentity} from './kokoroCache'
const db={storage:{from:()=>({download:mock.download,upload:mock.upload,getPublicUrl:(path:string)=>({data:{publicUrl:'https://audio.invalid/'+path}})})}}
beforeEach(()=>{vi.resetAllMocks();mock.download.mockResolvedValue({error:new Error('missing')});mock.upload.mockResolvedValue({error:null});mock.voice.mockResolvedValue({bytes:Buffer.from('wav-data'),timing:{version:1,text:'I am',words:[{text:'I',start:0,end:1,startTime:0,endTime:.2},{text:'am',start:2,end:4,startTime:.3,endTime:.5}]}})})
it('deduplicates concurrent requests and publishes matching immutable audio and timing',async()=>{
 const [a,b]=await Promise.all([cachedKokoro(db as never,'I am'),cachedKokoro(db as never,'I am')])
 expect(a).toEqual(b);expect(a.url).toMatch(/kokoro-v1\/[a-f0-9]{64}\/[a-f0-9]{64}\.wav$/)
 expect(a.timingUrl).toBe(a.url.replace('.wav','.timing.json'))
 expect(mock.voice).toHaveBeenCalledTimes(1);expect(mock.upload).toHaveBeenCalledTimes(3)
})
it('serves a shared cache without synthesizing again',async()=>{
 const prefix='kokoro-v1/'+kokoroIdentity('I am'),hash='a'.repeat(64)
 mock.download.mockResolvedValue({data:new Blob([JSON.stringify({text:'I am',audioPath:`${prefix}/${hash}.wav`,timingPath:`${prefix}/${hash}.timing.json`})])})
 const result=await cachedKokoro(db as never,'I am')
 expect(result.cached).toBe(true);expect(mock.voice).not.toHaveBeenCalled();expect(mock.upload).not.toHaveBeenCalled()
})
it('does not publish a cache pointer when audio upload fails',async()=>{
 mock.upload.mockResolvedValueOnce({error:new Error('storage failed')})
 await expect(cachedKokoro(db as never,'I am')).rejects.toThrow('storage failed')
 expect(mock.upload).toHaveBeenCalledTimes(1)
})
