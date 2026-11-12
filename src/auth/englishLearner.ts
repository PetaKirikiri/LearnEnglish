import {supabase} from '../lib/supabase'

const prefixes=['english-word-outbox:v1:','english:number-recall:v1:','english:gold-pending:','englishsuccess:composed-evidence:v1:','englishsuccess:journey:v1:','englishsuccess:action-stars:v1:','englishsuccess:composed-run:','englishsuccess:modules:','englishsuccess:vocabulary-profile:']
const unique=(items:unknown[])=>[...new Map(items.map(item=>[typeof item==='object'&&item!==null&&'id' in item?String(item.id):JSON.stringify(item),item])).values()]
type LevelResult={best?:number;score?:number;total?:number;passes?:number;cleared?:boolean;stars?:number}
function mergeLevels(a:Record<string,LevelResult>,b:Record<string,LevelResult>){
 const result={...a,...b}
 for(const level of Object.keys(a))if(b[level]){
  const x=a[level],y=b[level],best=(x.best??x.score??0)/(x.total??1)>(y.best??y.score??0)/(y.total??1)?x:y
  result[level]={...best,passes:Math.max(x.passes??0,y.passes??0),cleared:!!x.cleared||!!y.cleared,stars:Math.max(x.stars??0,y.stars??0)}
 }
 return result
}
/** Copy pending work and local milestones; retain the original keys for recovery. */
export function copyLinkedLearnerCache(source:string,target:string){
 if(source===target)return
 const keys=Array.from({length:localStorage.length},(_,i)=>localStorage.key(i)!).filter(key=>prefixes.some(prefix=>key.startsWith(prefix))&&key.includes(source))
 for(const key of keys){
  const destination=key.replace(source,target),raw=localStorage.getItem(key)!,previous=localStorage.getItem(destination)
  if(previous===null){localStorage.setItem(destination,raw);continue}
  let incoming:unknown,existing:unknown
  try{incoming=JSON.parse(raw);existing=JSON.parse(previous)}catch{continue}
  if(Array.isArray(incoming)&&Array.isArray(existing))localStorage.setItem(destination,JSON.stringify(unique([...incoming,...existing])))
  else if(!incoming||!existing||typeof incoming!=='object'||typeof existing!=='object'||Array.isArray(incoming)||Array.isArray(existing))continue
  else if(key.startsWith('english:gold-pending:'))localStorage.setItem(destination,JSON.stringify({...incoming as object,...existing as object}))
  else if(key.startsWith('englishsuccess:journey:'))localStorage.setItem(destination,JSON.stringify(mergeLevels(incoming as Record<string,LevelResult>,existing as Record<string,LevelResult>)))
  else if(key.startsWith('englishsuccess:action-stars:')){
   const a=incoming as {version:string;progress:Record<string,LevelResult>;reported:string[]},b=existing as typeof a
   if(a.version===b.version&&a.progress&&b.progress&&Array.isArray(a.reported)&&Array.isArray(b.reported))localStorage.setItem(destination,JSON.stringify({...b,progress:mergeLevels(a.progress,b.progress),reported:unique([...a.reported,...b.reported])}))
  }
  // Keep an already active target round rather than replacing it with another run.
 }
}

export async function connectEnglishLearnerAccount(source:string):Promise<string>{
 const {data,error}=await supabase.functions.invoke('english-learner-session',{body:{},signal:AbortSignal.timeout(15000)})
 if(error||!data)throw new Error('เชื่อมต่อบัญชีนักเรียนไม่ได้ กรุณาลองอีกครั้ง')
 if(data.linked===false)return source
 if(data.linked!==true||!data.learner_id||!data.access_token||!data.refresh_token)throw new Error('Invalid learner session')
 copyLinkedLearnerCache(source,data.learner_id)
 const result=await supabase.auth.setSession({access_token:data.access_token,refresh_token:data.refresh_token})
 const user=result.data.user
 if(result.error||!user||user.id!==data.learner_id)throw new Error('Could not connect the learner account')
 return user.id
}
