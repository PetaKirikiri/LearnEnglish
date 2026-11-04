import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { flushWordAttempts } from '../learning/wordProgress/store'
import { syncRecall } from './numberRecallStore'
import MemberAvatar from '../ui/MemberAvatar'
import Icon from '../ui/Icon'
import { PETA_ACCOUNT_ID } from '../auth/appAccess'
import { homeworkLiffId } from '../auth/homeworkLine'
import './cohortLeaderboard.css'

type Period = 'today'|'week'|'month'|'all'
type Row = {id:string;name:string;rank:number|null;points:number;avatarUrl?:string|null}
type Board = {period:Period;rows:Row[];periodStart:string|null;periodEnd:string|null}
type Result = {period:Period;board?:Board;error?:boolean;signIn?:boolean;syncError?:boolean;learner?:string}
const periods: {id:Period;label:string;name:string}[] = [
 {id:'today',label:'วันนี้',name:'Today'}, {id:'week',label:'สัปดาห์นี้',name:'Week'},
 {id:'month',label:'เดือนนี้',name:'Month'}, {id:'all',label:'ทั้งหมด',name:'All time'},
]

export default function CohortLeaderboard({userId}:{userId?:string}) {
 const [selection,setPeriod]=useState<Period|null>(null)
 const [resolvedUser,setResolvedUser]=useState<string|undefined>(userId)
 const period=selection??((userId??resolvedUser)===PETA_ACCOUNT_ID?'today':'all')
 const [result,setResult]=useState<Result|null>(null)
 const [retry,setRetry]=useState(0)
 useEffect(()=>{
  let active=true, refreshing=false
  async function refresh(){
   if(refreshing)return
   refreshing=true
   let requestedPeriod=period
   try {
    const learner=userId??(await supabase.auth.getUser()).data.user?.id
    if(!learner){if(active)setResult({period,signIn:true});return}
    if(active)setResolvedUser(learner)
    requestedPeriod=selection??(learner===PETA_ACCOUNT_ID?'today':'all')
    // A failed offline upload must not hide everybody else's saved scores.
    const uploads=await Promise.allSettled([flushWordAttempts(learner),syncRecall(learner)])
    const syncError=uploads.some(upload=>upload.status==='rejected')
    const response=await supabase.rpc('english_success_leaderboard',{p_period:requestedPeriod})
    if(response.error)throw response.error
    if(active)setResult({period:requestedPeriod,board:response.data as Board,learner,syncError})
   }catch{if(active)setResult(old=>({...((old?.period===requestedPeriod)?old:{}),period:requestedPeriod,error:true}))}
   finally{refreshing=false}
  }
  void refresh()
  const update=()=>{if(document.visibilityState!=='hidden')void refresh()}
  const timer=setInterval(update,30000)
  window.addEventListener('focus',update)
  window.addEventListener('online',update)
  return()=>{active=false;clearInterval(timer);window.removeEventListener('focus',update);window.removeEventListener('online',update)}
 },[userId,selection,retry])
 return <CohortLeaderboardView period={period} result={result} onPeriod={setPeriod} onRetry={()=>setRetry(n=>n+1)}/>
}

export function CohortLeaderboardView({period,result,onPeriod,onRetry}:{period:Period;result:Result|null;onPeriod:(period:Period)=>void;onRetry:()=>void}) {
 const current=result?.period===period?result:null
 const board=current?.board
 return <main className="cohort-board" lang="th">
  <div className="cohort-shell">
   <header className="cohort-header"><a href="/english/practice" aria-label="กลับไปฝึก"><Icon name="back"/></a><span>ENGLISH SUCCESS</span><img src="/brand/englishsuccess-cap.svg" alt=""/></header>
   <section className="cohort-sheet" aria-labelledby="leaderboard-title">
    <div className="cohort-title"><span className="cohort-title-icon"><Icon name="trophy"/></span><h1 id="leaderboard-title">อันดับคะแนน</h1></div>
    <div className="cohort-periods" role="group" aria-label="Leaderboard period">
     {periods.map(item=><button key={item.id} type="button" aria-label={item.name} aria-pressed={period===item.id} title={`${item.name} · ${item.label}`} onClick={()=>onPeriod(item.id)}><PeriodIcon period={item.id}/></button>)}
    </div>
    {current?.signIn?<div className="cohort-message"><p>เปิดใน LINE เพื่อดูอันดับนักเรียน</p><a href={`https://liff.line.me/${homeworkLiffId}?view=scoreboard`}>เปิดใน LINE <Icon name="arrow"/></a></div>:<>
     <div className="cohort-list-heading"><span>นักเรียน{board?` · ${board.rows.length}`:''}</span><span>คะแนน</span></div>
     {!current&&<p className="cohort-message" role="status">กำลังโหลดอันดับ…</p>}
     {current?.error&&<div className="cohort-message" role="alert"><p>โหลดอันดับไม่ได้</p><button type="button" onClick={onRetry}>ลองอีกครั้ง</button></div>}
     {current?.syncError&&<p className="cohort-sync" role="status">บางคำตอบยังส่งไม่สำเร็จ คะแนนจะแสดงเมื่อเชื่อมต่ออีกครั้ง</p>}
     {board&&<ol className="cohort-rankings" aria-label="Student rankings">{board.rows.map(row=><li key={row.id} className={row.id===current?.learner?'is-you':''}>
      <span className={`cohort-rank${row.rank&&row.rank<=3?' is-podium':''}`} data-rank={row.rank} aria-label={row.rank?`Rank ${row.rank}`:'No points yet'}>{row.rank??'—'}</span>
      <MemberAvatar name={row.name} url={row.avatarUrl} size={40}/>
      <span className="cohort-student"><strong>{row.name}</strong>{row.id===current?.learner&&<small>คุณ</small>}</span>
      <b className="cohort-points">{row.points.toLocaleString('en-US')}</b>
     </li>)}</ol>}
     {board?.rows.length===0&&<p className="cohort-message">ยังไม่มีนักเรียนในรายชื่อ</p>}
    </>}
   </section>
   <a className="cohort-train" href="/english/practice">ฝึกต่อ <Icon name="arrow"/></a>
  </div>
 </main>
}

function PeriodIcon({period}:{period:Period}) {
 return <svg className="cohort-period-icon" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
  {period==='all'?<path d="M16 16c-3-5-5-7-8-7a7 7 0 0 0 0 14c3 0 5-2 8-7s5-7 8-7a7 7 0 0 1 0 14c-3 0-5-2-8-7Z"/>:<><rect x="4" y="6" width="24" height="23" rx="4"/><path d="M10 3v6M22 3v6M4 12h24"/><text x="16" y="25" textAnchor="middle" fill="currentColor" stroke="none" fontSize="12" fontWeight="900">{period==='today'?'1':period==='week'?'7':'31'}</text></>}
 </svg>
}
