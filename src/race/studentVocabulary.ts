import {useEffect,useState} from 'react'
import {supabase} from '../lib/supabase'
import {flushWordAttempts} from '../learning/wordProgress/store'
import type {WordProgress} from '../learning/wordProgress/model'
export type StudentVocabulary={selected:string;students:{id:string;name:string}[];rows:WordProgress[]}
export function useStudentVocabulary(viewerId:string,learnerId:string|null,diagnostic=false){
 const [snapshot,setSnapshot]=useState<StudentVocabulary|null>(null),[error,setError]=useState(''),[retry,setRetry]=useState(0)
 useEffect(()=>{
  let active=true,pending=false
  async function refresh(){
   if(pending)return;pending=true
   try{
    let data:StudentVocabulary
    if(diagnostic){
     const response=await fetch('/__diagnostics/vocabulary',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({learner:learnerId})})
     if(!response.ok)throw new Error('Diagnostic unavailable')
     data=await response.json()
    }else{
     // Only synchronize the signed-in learner's own pending answers.
     await flushWordAttempts(viewerId).catch(()=>{})
     const response=await supabase.rpc('english_vocabulary_student_progress',{p_learner:learnerId})
     if(response.error)throw response.error
     data=response.data as StudentVocabulary
    }
    if(active){setSnapshot(data);setError('')}
   }catch{if(active)setError('Could not load student progress.')}
   finally{pending=false}
  }
  void refresh();const timer=setInterval(()=>void refresh(),30000)
  const update=()=>void refresh();window.addEventListener('focus',update);window.addEventListener('online',update)
  return()=>{active=false;clearInterval(timer);window.removeEventListener('focus',update);window.removeEventListener('online',update)}
 },[viewerId,learnerId,retry,diagnostic])
 return {snapshot,error,retry:()=>setRetry(n=>n+1)}
}
