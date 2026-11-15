let worker:Worker|undefined,nextId=0
const requests=new Map<number,{resolve:(blob:Blob)=>void;reject:(error:Error)=>void}>()
const cache=new Map<string,Promise<string>>()
/** Local synthesis only on playback. Replays reuse the same recording. */
export function kokoroAudio(text:string):Promise<string>{
 const old=cache.get(text);if(old)return old
 const work=(async()=>{
  const stored=typeof caches==='undefined'?undefined:await caches.open('kokoro-heart-v1').catch(()=>undefined)
  const key=new URL('/__kokoro_audio/'+encodeURIComponent(text),location.origin).href
  const hit=await stored?.match(key).catch(()=>undefined)
  if(hit)return URL.createObjectURL(await hit.blob())
  if(!worker){
   worker=new Worker(new URL('./kokoro.worker.ts',import.meta.url),{type:'module'})
   worker.onmessage=({data}:{data:{id:number;blob:Blob;error?:boolean}})=>{
    const request=requests.get(data.id);requests.delete(data.id)
    if(data.error)request?.reject(new Error('Kokoro unavailable'));else request?.resolve(data.blob)
   }
   worker.onerror=()=>{for(const request of requests.values())request.reject(new Error('Kokoro unavailable'));requests.clear();worker?.terminate();worker=undefined}
  }
  const blob=await new Promise<Blob>((resolve,reject)=>{const id=++nextId;requests.set(id,{resolve,reject});worker!.postMessage({id,text})})
  await stored?.put(key,new Response(blob)).catch(()=>{})
  return URL.createObjectURL(blob)
 })()
 cache.set(text,work);void work.catch(()=>cache.delete(text));return work
}
