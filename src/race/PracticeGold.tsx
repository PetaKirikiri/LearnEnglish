import {useEffect,useState} from 'react'
import {supabase} from '../lib/supabase'
import './practiceGold.css'
const eventName='english-practice-gold'
const storageKey=(user?:string)=>`english:gold-pending:${user??'guest'}`
export function pendingGold(user?:string):Record<string,number>{try{return JSON.parse(localStorage.getItem(storageKey(user))??'{}')}catch{return {}}}
export function awardPracticeGold(id:string,correct:boolean,user?:string){
 if(!correct)return
 const pending=pendingGold(user)
 if(id in pending)return
 try{localStorage.setItem(storageKey(user),JSON.stringify({...pending,[id]:10}))}catch{/* Saved attempts remain authoritative. */}
 window.dispatchEvent(new CustomEvent(eventName,{detail:{user}}))
}
export default function PracticeGold({userId}:{userId?:string}){
 const [balance,setBalance]=useState<number|null>(null),[burst,setBurst]=useState(0),[error,setError]=useState(false)
 useEffect(()=>{
  let active=true,busy=false;let confirmed:number|null=userId?null:0
  setBalance(null);setError(false)
  const display=()=>{if(active&&confirmed!==null)setBalance(confirmed+Object.values(pendingGold(userId)).reduce((a,b)=>a+b,0))}
  async function refresh(){
   if(busy)return
   if(!userId){display();return}
   busy=true
   try{
    const {data,error}=await supabase.rpc('english_practice_gold',{p_pending:Object.keys(pendingGold(userId))})
    if(error)throw error
    if(!active)return
    const pending=pendingGold(userId)
    for(const id of data.settled??[])delete pending[id]
    localStorage.setItem(storageKey(userId),JSON.stringify(pending))
    confirmed=Number(data.earned);setError(false);display()
   }catch{if(active)setError(true)}finally{busy=false}
  }
  const award=(e:Event)=>{if((e as CustomEvent).detail.user!==userId)return;setBurst(n=>n+1);display();void refresh()}
  const retry=()=>void refresh()
  window.addEventListener(eventName,award);window.addEventListener('online',retry);window.addEventListener('focus',retry)
  const timer=setInterval(retry,4000);void refresh()
  return()=>{active=false;clearInterval(timer);window.removeEventListener(eventName,award);window.removeEventListener('online',retry);window.removeEventListener('focus',retry)}
 },[userId])
 return <div className="practice-gold" role="status" aria-label={`Gold: ${balance??'loading'}${error?', syncing':''}`}><span className="practice-gold-coin" aria-hidden="true">✦</span><strong>{balance===null?'…':balance.toLocaleString()}</strong>{burst>0&&<span key={burst} className="practice-gold-gain" aria-hidden="true">+10</span>}{error&&<span className="practice-gold-sync" title="กำลังรอเชื่อมต่อ">↻</span>}</div>
}
