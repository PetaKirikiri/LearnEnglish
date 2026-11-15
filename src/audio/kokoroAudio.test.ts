// @vitest-environment happy-dom
import {afterEach,expect,it,vi} from 'vitest'
afterEach(()=>{vi.unstubAllGlobals();vi.restoreAllMocks()})
it('synthesizes and replays when Cache Storage is unavailable',async()=>{
 vi.resetModules();vi.stubGlobal('caches',undefined)
 const post=vi.fn()
 vi.stubGlobal('Worker',class{
  onmessage?: (message:unknown)=>void
  postMessage(message:{id:number}){post(message);queueMicrotask(()=>this.onmessage?.({data:{id:message.id,blob:new Blob(['wav'])}}))}
 })
 vi.spyOn(URL,'createObjectURL').mockReturnValue('blob:local-kokoro')
 const {kokoroAudio}=await import('./kokoroAudio')
 expect(await kokoroAudio('No browser cache required.')).toBe('blob:local-kokoro')
 expect(await kokoroAudio('No browser cache required.')).toBe('blob:local-kokoro')
 expect(post).toHaveBeenCalledOnce()
})
