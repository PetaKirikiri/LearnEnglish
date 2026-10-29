import {useEffect,useState} from 'react'
import NumberFoundation from './NumberFoundationCourse'
import {loadPracticeStartingRound} from './practicePlacement'
import type {MatrixSettings} from '../learning/sentenceMatrix/model'
export {PracticeSession} from './PracticeSession'

export default function PhonePractice(props:{userId?:string;tester?:boolean;settings?:MatrixSettings}){
 const preview=import.meta.env.DEV&&new URLSearchParams(location.search).has('preview')
 if(!props.userId||preview)return <NumberFoundation {...props}/>
 return <AccountPractice key={props.userId} {...props} userId={props.userId}/>
}
function AccountPractice(props:{userId:string;tester?:boolean;settings?:MatrixSettings}){
 const [round,setRound]=useState<1|3|null>(null)
 const [failed,setFailed]=useState(false)
 const [retry,setRetry]=useState(0)
 useEffect(()=>{
  let active=true
  setFailed(false)
  void loadPracticeStartingRound(props.userId).then(value=>{if(active)setRound(value)}).catch(()=>{if(active)setFailed(true)})
  return()=>{active=false}
 },[props.userId,retry])
 if(round===null)return <main className="phone-practice" lang="th"><div className="practice-shell"><section className="practice-complete">{failed?<><p role="alert">โหลดความคืบหน้าไม่ได้</p><button onClick={()=>setRetry(value=>value+1)}>ลองอีกครั้ง</button></>:<p role="status">กำลังโหลด…</p>}</section></div></main>
 return <NumberFoundation {...props} minimumModule={round}/>
}
