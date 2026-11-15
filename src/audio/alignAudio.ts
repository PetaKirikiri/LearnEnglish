import {parseSentenceTiming,type SentenceTiming} from './sentenceTiming'
let worker:Worker|undefined,sequence=0
const requests=new Map<number,{resolve:(timing:SentenceTiming)=>void;reject:(error:Error)=>void}>()
const pending=new Map<string,Promise<SentenceTiming>>()
/** Run once per recording/text pair, cache exact timings on the learner's device. */
export function alignAudio(url:string,text:string):Promise<SentenceTiming>{
 const key=text+'\n'+url,old=pending.get(key);if(old)return old
 const promise=(async()=>{
  const response=await fetch(url);if(!response.ok)throw new Error('Recording unavailable')
  const bytes=await response.arrayBuffer()
  const identity=new Uint8Array([...new Uint8Array(bytes),...new TextEncoder().encode(text)])
  const digest=await crypto.subtle.digest('SHA-256',identity)
  const hash=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('')
  const store=await caches.open('english-word-alignment-v1').catch(()=>undefined)
  const cacheKey=new URL('/__word_alignment/'+hash,location.origin).href
  const cached=await store?.match(cacheKey)
  if(cached){const timing=parseSentenceTiming(await cached.json(),text);if(timing)return timing}
  const decoder=new AudioContext({sampleRate:16000})
  let audio:AudioBuffer
  try{audio=await decoder.decodeAudioData(bytes)}finally{void decoder.close()}
  const offline=new OfflineAudioContext(1,Math.ceil(audio.duration*16000),16000)
  const source=offline.createBufferSource();source.buffer=audio;source.connect(offline.destination);source.start()
  const samples=(await offline.startRendering()).getChannelData(0)
  if(!worker){
   worker=new Worker(new URL('./align.worker.ts',import.meta.url),{type:'module'})
   worker.onmessage=({data}:{data:{id:number;timing?:SentenceTiming;error?:boolean}})=>{
    const request=requests.get(data.id);requests.delete(data.id)
    if(data.error||!data.timing)request?.reject(new Error('Alignment unavailable'));else request?.resolve(data.timing)
   }
   worker.onerror=()=>{for(const request of requests.values())request.reject(new Error('Alignment unavailable'));requests.clear();worker?.terminate();worker=undefined}
  }
  const timing=await new Promise<SentenceTiming>((resolve,reject)=>{const id=++sequence;requests.set(id,{resolve,reject});worker!.postMessage({id,text,samples})})
  if(!parseSentenceTiming(timing,text))throw new Error('Alignment does not match recording')
  await store?.put(cacheKey,new Response(JSON.stringify(timing))).catch(()=>{})
  return timing
 })()
 pending.set(key,promise);void promise.catch(()=>pending.delete(key));return promise
}
