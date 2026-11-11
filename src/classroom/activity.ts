import {useEffect,useState} from 'react'
import {supabase} from '../lib/supabase'
export type ClassActivity={activity:'join'|'board'|'test'|'race';lesson:number}
export async function classroomActivity(sessionId:string,target?:ClassActivity){
 const {data,error}=await supabase.rpc('english_class_activity',{p_session:sessionId,p_payload:target?{...target,hostSecret:localStorage.getItem('su-classroom-host-key')}:{}})
 if(error)throw new Error(error.message)
 return data as ClassActivity
}
export function useClassActivity(sessionId:string){
 const [activity,setActivity]=useState<ClassActivity>(),[error,setError]=useState('')
 useEffect(()=>{let active=true,pending=false
  async function refresh(){if(pending||!sessionId)return;pending=true;try{const next=await classroomActivity(sessionId);if(active){setActivity(next);setError('')}}catch(e){if(active)setError((e as Error).message)}finally{pending=false}}
  void refresh();const timer=setInterval(()=>void refresh(),1200)
  return()=>{active=false;clearInterval(timer)}
 },[sessionId])
 return {activity,error}
}
