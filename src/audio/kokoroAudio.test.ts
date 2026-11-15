// @vitest-environment happy-dom
import {afterEach,expect,it,vi} from 'vitest'
afterEach(()=>{vi.useRealTimers();vi.unstubAllGlobals();vi.restoreAllMocks()})
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

it('settles a silent worker timeout and allows a fresh retry',async()=>{
 vi.useFakeTimers();vi.resetModules();vi.stubGlobal('caches',undefined)
 let count=0;const terminated=vi.fn()
 vi.stubGlobal('Worker',class{
  onmessage?: (message:unknown)=>void
  terminate=terminated
  postMessage(message:{id:number}){count++;if(count>1)queueMicrotask(()=>this.onmessage?.({data:{id:message.id,blob:new Blob(['wav'])}}))}
 })
 vi.spyOn(URL,'createObjectURL').mockReturnValue('blob:retry')
 const {kokoroAudio,VOICE_IDLE_TIMEOUT}=await import('./kokoroAudio')
 const first=kokoroAudio('Retry after stalled loading.');const failed=expect(first).rejects.toThrow('stalled')
 await vi.advanceTimersByTimeAsync(VOICE_IDLE_TIMEOUT+1);await failed
 expect(terminated).toHaveBeenCalledOnce()
 expect(await kokoroAudio('Retry after stalled loading.')).toBe('blob:retry')
})
it('does not wait indefinitely for a hung Cache Storage operation',async()=>{
 vi.useFakeTimers();vi.resetModules();vi.stubGlobal('caches',{open:()=>new Promise(()=>{})})
 vi.stubGlobal('Worker',class{
  onmessage?: (message:unknown)=>void
  postMessage(message:{id:number}){queueMicrotask(()=>this.onmessage?.({data:{id:message.id,blob:new Blob(['wav'])}}))}
 })
 vi.spyOn(URL,'createObjectURL').mockReturnValue('blob:without-storage')
 const {kokoroAudio}=await import('./kokoroAudio');const result=kokoroAudio('Storage must not block voice.')
 await vi.advanceTimersByTimeAsync(1001)
 expect(await result).toBe('blob:without-storage')
})
it('reports download and generation phases rather than an unexplained busy state',async()=>{
 vi.resetModules();vi.stubGlobal('caches',undefined)
 vi.stubGlobal('Worker',class{
  onmessage?: (message:unknown)=>void
  postMessage(message:{id:number}){queueMicrotask(()=>{
   this.onmessage?.({data:{id:message.id,progress:{phase:'downloading',progress:42}}})
   this.onmessage?.({data:{id:message.id,progress:{phase:'generating'}}})
   this.onmessage?.({data:{id:message.id,blob:new Blob(['wav'])}})
  })}
 })
 vi.spyOn(URL,'createObjectURL').mockReturnValue('blob:progress')
 const {kokoroAudio}=await import('./kokoroAudio');const progress=vi.fn()
 await kokoroAudio('Show real preparation progress.',progress)
 expect(progress).toHaveBeenCalledWith({phase:'downloading',progress:42})
 expect(progress).toHaveBeenCalledWith({phase:'generating'})
})
