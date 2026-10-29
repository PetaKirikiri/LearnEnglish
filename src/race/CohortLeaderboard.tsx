import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { flushWordAttempts } from '../learning/wordProgress/store'
import MemberAvatar from '../ui/MemberAvatar'
import Icon from '../ui/Icon'
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
 const [period,setPeriod]=useState<Period>('all')
 const [result,setResult]=useState<Result|null>(null)
 const [retry,setRetry]=useState(0)
 useEffect(()=>{
  let active=true, refreshing=false
  async function refresh(){
   if(refreshing)return
   refreshing=true
   try {
    const learner=userId??(await supabase.auth.getUser()).data.user?.id
    if(!learner){if(active)setResult({period,signIn:true});return}
    // A failed offline upload must not hide everybody else's saved scores.
    let syncError=false
    try {await flushWordAttempts(learner)}catch{syncError=true}
    const response=await supabase.rpc('english_success_leaderboard',{p_period:period})
    if(response.error)throw response.error
    if(active)setResult({period,board:response.data as Board,learner,syncError})
   }catch{if(active)setResult(old=>({...((old?.period===period)?old:{}),period,error:true}))}
   finally{refreshing=false}
  }
  void refresh()
  const update=()=>{if(document.visibilityState!=='hidden')void refresh()}
  const timer=setInterval(update,30000)
  window.addEventListener('focus',update)
  window.addEventListener('online',update)
  return()=>{active=false;clearInterval(timer);window.removeEventListener('focus',update);window.removeEventListener('online',update)}
 },[userId,period,retry])
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
     {periods.map(item=><button key={item.id} type="button" aria-label={item.name} aria-pressed={period===item.id} onClick={()=>onPeriod(item.id)}>{item.label}</button>)}
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
