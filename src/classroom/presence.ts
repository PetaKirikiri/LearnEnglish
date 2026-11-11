import {useEffect,useState} from 'react'
import type {ClassMember,ClassSession} from './session'

// Keep in sync with english_class_member_online in the presence migration.
export const CLASS_PRESENCE_TIMEOUT=20_000
export function memberIsOnline(member:ClassMember,now=Date.now()){
 return member.active&&Number.isFinite(Date.parse(member.lastSeen))&&Date.parse(member.lastSeen)>now-CLASS_PRESENCE_TIMEOUT
}
export function useClassroomClock(session:ClassSession|undefined){
 const [now,setNow]=useState(Date.now)
 useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer)},[])
 // Use server time, allowing it to advance even when the teacher's polling fails.
 return session?.serverNow&&session.receivedAt!==undefined
  ? Date.parse(session.serverNow)+Math.max(0,now-session.receivedAt):now
}
