import {supabase} from '../lib/supabase'
export type ClassMember={id:string;name:string;avatar?:string;active:boolean;turns:number;coins:number;lastSeen:string}
export type ClassTurn={id:string;learner:string;questionId:string;english:string;choices:string[];answer:string|null;correct:boolean|null}
export type ClassSession={id:string;host:boolean;me:string;members:ClassMember[];turn:ClassTurn|null}
export async function classroomCall(action:string,session?:string,payload:Record<string,unknown>={}){
 const {data,error}=await supabase.rpc('english_classroom',{p_action:action,p_session:session??null,p_payload:payload})
 if(error)throw new Error(error.message)
 return data as ClassSession
}
export function classroomSessionId(search=location.search){
 const query=new URLSearchParams(search),nested=query.get('liff.state')??''
 return query.get('class')??new URLSearchParams(nested.includes('?')?nested.slice(nested.indexOf('?')+1):nested).get('class')
}
export const classroomJoinUrl=(id:string)=>`https://learn-english-coral.vercel.app/english/practice?class=${encodeURIComponent(id)}`
