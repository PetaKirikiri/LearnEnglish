import {useEffect,useState} from 'react'
import {classroomCall,type ClassSession} from './session'

/** Only a visible, responding student page renews its classroom presence. */
export function useStudentSession(sessionId:string){
 const [session,setSession]=useState<ClassSession>(),[error,setError]=useState('')
 useEffect(()=>{
  let disposed=false,joined=false,hidden=false,request:AbortController|undefined
  async function refresh(){
   if(disposed||request||hidden||document.visibilityState==='hidden'||!navigator.onLine)return
   const controller=new AbortController();request=controller
   const timeout=setTimeout(()=>controller.abort(),8000)
   try{
    const next=await classroomCall(joined?'state':'join',sessionId,{},controller.signal)
    if(!disposed&&request===controller&&!controller.signal.aborted){joined=true;setSession(next);setError('')}
   }catch(e){if(!disposed&&request===controller&&!controller.signal.aborted)setError((e as Error).message)}
   finally{clearTimeout(timeout);if(request===controller)request=undefined}
  }
  const suspend=()=>{hidden=true;request?.abort();request=undefined}
  const resume=()=>{hidden=false;void refresh()}
  const visibility=()=>document.visibilityState==='hidden'?suspend():resume()
  document.addEventListener('visibilitychange',visibility)
  window.addEventListener('pagehide',suspend)
  window.addEventListener('pageshow',resume)
  window.addEventListener('offline',suspend)
  window.addEventListener('online',resume)
  void refresh();const timer=setInterval(()=>void refresh(),1500)
  return()=>{
   disposed=true;suspend();clearInterval(timer)
   document.removeEventListener('visibilitychange',visibility)
   window.removeEventListener('pagehide',suspend)
   window.removeEventListener('pageshow',resume)
   window.removeEventListener('offline',suspend)
   window.removeEventListener('online',resume)
  }
 },[sessionId])
 return {session,setSession,error,setError}
}
