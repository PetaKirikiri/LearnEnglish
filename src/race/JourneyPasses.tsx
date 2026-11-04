import {useEffect,useState} from 'react'
import {supabase} from '../lib/supabase'
import type {JourneyRecord} from './PracticeJourney'
export type JourneyPass={level:number;id:string;name:string}
// Existing device clears are retained until the server acknowledges them.
export function useJourneyPasses(userId:string|undefined,records:JourneyRecord){
 const [passes,setPasses]=useState<JourneyPass[]>([])
 const [unavailable,setUnavailable]=useState(false)
 useEffect(()=>{
  if(!userId)return
  let disposed=false,busy=false
  const refresh=async()=>{
   if(busy)return
   busy=true
   try{
    const {data:{user}}=await supabase.auth.getUser()
    if(user?.id!==userId)return
    const clears=Object.entries(records).filter(([,r])=>r?.cleared).map(([level,r])=>({learner_id:userId,level:Number(level),score:r!.best,total:r!.total}))
    if(clears.length){const saved=await supabase.from('english_journey_clears').upsert(clears,{onConflict:'learner_id,level',ignoreDuplicates:true});if(saved.error)throw saved.error}
    const response=await supabase.rpc('english_journey_passes')
    if(response.error)throw response.error
    if(!disposed){setPasses(response.data??[]);setUnavailable(false)}
   }catch{if(!disposed)setUnavailable(true)}finally{busy=false}
  }
  void refresh()
  const timer=setInterval(()=>void refresh(),30000)
  const resume=()=>{if(document.visibilityState!=='hidden')void refresh()}
  window.addEventListener('focus',resume);window.addEventListener('online',resume);document.addEventListener('visibilitychange',resume)
  return()=>{disposed=true;clearInterval(timer);window.removeEventListener('focus',resume);window.removeEventListener('online',resume);document.removeEventListener('visibilitychange',resume)}
 },[userId,records])
 return {passes,unavailable}
}
export function JourneyPassNames({level,passes,unavailable}:{level:number;passes:JourneyPass[];unavailable:boolean}){
 const students=passes.filter(p=>p.level===level)
 if(!students.length&&!unavailable)return null
 return <div className="journey-pass-names" aria-label="ผู้ที่ผ่านแล้ว"><span aria-hidden="true">★</span>{students.map(student=><span className="journey-pass-name" key={student.id}>{student.name}</span>)}{unavailable&&<small role="status">โหลดรายชื่อไม่ได้</small>}</div>
}
