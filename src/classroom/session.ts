import {supabase} from '../lib/supabase'
export type ClassMember={id:string;name:string;avatar?:string;active:boolean;turns:number;coins:number;lastSeen:string}
export type ClassTurn={id:string;learner:string;questionId:string;english:string;choices:string[];answer:string|null;correct:boolean|null;scores?:Readonly<Record<string,number>>}
export type ClassSession={id:string;host:boolean;me:string;members:ClassMember[];turn:ClassTurn|null;serverNow?:string;receivedAt?:number}
export async function classroomCall(action:string,session?:string,payload:Record<string,unknown>={},signal?:AbortSignal){
 const request=supabase.rpc('english_classroom',{p_action:action,p_session:session??null,p_payload:payload})
 const {data,error}=await (signal?request.abortSignal(signal):request)
 if(error)throw new Error(error.message)
 return {...data,receivedAt:Date.now()} as ClassSession
}
export function classroomSessionId(search=location.search){
 const query=new URLSearchParams(search),nested=query.get('liff.state')??''
 return query.get('class')??new URLSearchParams(nested.includes('?')?nested.slice(nested.indexOf('?')+1):nested).get('class')
}
export const classroomJoinUrl=(id:string)=>`https://learn-english-coral.vercel.app/english/practice?class=${encodeURIComponent(id)}`

export function classroomHostCall(action:string,session?:string,payload:Record<string,unknown>={}){
 let secret=localStorage.getItem('su-classroom-host-key');
 if(!secret){secret=Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');localStorage.setItem('su-classroom-host-key',secret)}
 return classroomCall(action,session,{...payload,hostSecret:secret})
}
