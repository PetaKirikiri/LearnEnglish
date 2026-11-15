export type VoiceProgress={phase:'downloading'|'generating';progress?:number}
type Request={resolve:(blob:Blob)=>void;reject:(error:Error)=>void;progress:(value:VoiceProgress)=>void;idle:ReturnType<typeof setTimeout>;deadline:ReturnType<typeof setTimeout>}
let worker:Worker|undefined,nextId=0
const requests=new Map<number,Request>(),cache=new Map<string,Promise<string>>()
const listeners=new Map<string,Set<(value:VoiceProgress)=>void>>(),statuses=new Map<string,VoiceProgress>()
export const VOICE_IDLE_TIMEOUT=45000
function resetWorker(){
 worker?.terminate();worker=undefined
 for(const request of requests.values()){clearTimeout(request.idle);clearTimeout(request.deadline);request.reject(new Error('Voice preparation stalled'))}
 requests.clear()
}
async function optionalStorage<T>(operation:Promise<T>):Promise<T|undefined>{
 let timer:ReturnType<typeof setTimeout>|undefined
 try{return await Promise.race([operation,new Promise<undefined>(resolve=>{timer=setTimeout(()=>resolve(undefined),1000)})])}catch{return undefined}finally{clearTimeout(timer)}
}
/** Local synthesis only. Storage and worker failures always settle and allow retry. */
export function kokoroAudio(text:string,onProgress?:(value:VoiceProgress)=>void):Promise<string>{
 if(onProgress){const subscribers=listeners.get(text)??new Set();subscribers.add(onProgress);listeners.set(text,subscribers);const status=statuses.get(text);if(status)onProgress(status)}
 const old=cache.get(text);if(old)return old
 const notify=(status:VoiceProgress)=>{statuses.set(text,status);for(const listener of listeners.get(text)??[])listener(status)}
 const work=(async()=>{
  const stored=typeof caches==='undefined'?undefined:await optionalStorage(caches.open('kokoro-heart-v1'))
  const key=new URL('/__kokoro_audio/'+encodeURIComponent(text),location.origin).href
  const hit=stored?await optionalStorage(stored.match(key)):undefined
  if(hit){const blob=await optionalStorage(hit.blob());if(blob)return URL.createObjectURL(blob)}
  if(!worker){
   worker=new Worker(new URL('./kokoro.worker.ts',import.meta.url),{type:'module'})
   worker.onmessage=({data}:{data:{id:number;blob?:Blob;error?:boolean;progress?:VoiceProgress}})=>{
    const request=requests.get(data.id);if(!request)return
    if(data.progress){clearTimeout(request.idle);request.idle=setTimeout(resetWorker,VOICE_IDLE_TIMEOUT);request.progress(data.progress);return}
    clearTimeout(request.idle);clearTimeout(request.deadline);requests.delete(data.id)
    if(data.error||!data.blob)request.reject(new Error('Voice unavailable'));else request.resolve(data.blob)
   }
   worker.onerror=resetWorker
   worker.onmessageerror=resetWorker
  }
  notify({phase:'downloading'})
  const blob=await new Promise<Blob>((resolve,reject)=>{const id=++nextId;requests.set(id,{resolve,reject,progress:notify,idle:setTimeout(resetWorker,VOICE_IDLE_TIMEOUT),deadline:setTimeout(resetWorker,120000)});worker!.postMessage({id,text})})
  if(stored)void optionalStorage(stored.put(key,new Response(blob)))
  return URL.createObjectURL(blob)
 })()
 cache.set(text,work)
 const settled=()=>{listeners.delete(text);statuses.delete(text)}
 void work.then(settled,()=>{cache.delete(text);settled()})
 return work
}
