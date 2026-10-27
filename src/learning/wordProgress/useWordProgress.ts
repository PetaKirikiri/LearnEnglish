import { useCallback, useEffect, useRef, useState } from 'react'
import { flushWordAttempts,loadWordProgress,queueAttempt } from './store'
import { scoresFromProgress,type WordAttempt,type WordProgress } from './model'
type Snapshot={userId:string;rows:WordProgress[];ready:boolean;error:string}
export function useWordProgress(userId?:string,tracking=true){
 const [snapshot,setSnapshot]=useState<Snapshot|null>(null)
 const current=useRef(userId)
 const retry=useCallback(()=>{
  if(!userId)return Promise.resolve()
  return (tracking?flushWordAttempts(userId):Promise.resolve()).then(()=>loadWordProgress(userId)).then(rows=>{
   if(current.current===userId)setSnapshot({userId,rows,ready:true,error:''})
  }).catch(()=>{
   if(current.current===userId)setSnapshot(previous=>({userId,rows:previous?.userId===userId?previous.rows:[],ready:previous?.userId===userId&&previous.ready,error:'บันทึกหรือโหลดความคืบหน้าไม่ได้ กรุณาลองอีกครั้ง'}))
  })
 },[userId,tracking])
 useEffect(()=>{current.current=userId;void retry();const timer=setInterval(()=>void retry(),30000);window.addEventListener('online',retry);window.addEventListener('focus',retry);return()=>{current.current=undefined;clearInterval(timer);window.removeEventListener('online',retry);window.removeEventListener('focus',retry)}},[userId,retry])
 function record(attempt:WordAttempt){if(!userId||!tracking)return;queueAttempt(userId,attempt);void retry()}
 const visible=snapshot?.userId===userId?snapshot:null
 return{rows:visible?.rows??[],scores:scoresFromProgress(visible?.rows??[]),ready:!userId||Boolean(visible?.ready),error:visible?.error??'',retry,record}
}
