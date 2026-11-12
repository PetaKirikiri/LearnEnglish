import {useClassActivity} from './activity'
import {DrawingStudent} from '../drawing/DrawingGame'
import {useDrawingGame} from '../drawing/game'
import {useWordAttemptOutbox} from '../learning/wordProgress/useWordAttemptOutbox'
import {useRef,useState} from 'react'
import {classroomCall} from './session'
import {useStudentSession} from './useStudentSession'
import {classroomTestingQuestions} from './testingQuestions'
import ClassroomPractice from './ClassroomPractice'
import PracticeHeader from '../race/PracticeHeader'
import {awardPracticeGold} from '../race/PracticeGold'
import '../classroom/sentenceLine.css'
import './university.css'
export default function ClassroomStudent({sessionId,userId}:{sessionId:string;userId:string}){
 const tracking=useWordAttemptOutbox(userId),shownAt=useRef(new Map<string,string>())
 const drawing=useDrawingGame(sessionId)
 const {activity,error:activityError}=useClassActivity(sessionId)
 const {session,setSession,error,setError}=useStudentSession(sessionId)
 const [busy,setBusy]=useState(false),lock=useRef(false)
 const turn=session?.turn, mine=turn?.learner===userId,q=turn?.question??classroomTestingQuestions.find(q=>q.id===turn?.questionId)
 function presented(){
  if(!turn||!q||!mine)return false
  try{
   const at=shownAt.current.get(turn.id)??new Date().toISOString();shownAt.current.set(turn.id,at)
   tracking.record({event:'presented',id:turn.id,questionId:q.id,version:1,answer:'',occurredAt:at,modality:'visible',replays:0,ruleVersion:1})
   return true
  }catch{setError('Retry saving progress');return false}
 }
 async function answer(value:string,evidence?:{heard:boolean;plays:number;assisted:boolean}){if(!turn||lock.current)return;lock.current=true;setBusy(true)
  try{const next=await classroomCall('answer',sessionId,{turn:turn.id,answer:value,evidence});setSession(next);awardPracticeGold(turn.id,next.turn?.correct===true,userId);setError('')}catch(e){setError((e as Error).message)}finally{lock.current=false;setBusy(false)}
 }
 if(activity?.activity==='race'&&drawing.game?.active)return <DrawingStudent game={{...drawing.game,drawings:drawing.game.drawings.map(d=>({...d,avatar:session?.members.find(m=>m.id===d.artist)?.avatar})),scores:drawing.game.scores.map(s=>({...s,avatar:session?.members.find(m=>m.id===s.id)?.avatar}))}} userId={userId} busy={drawing.busy} error={drawing.error} act={drawing.act} offset={drawing.offset.current}/>
 return <main className="phone-practice foundation-practice su-student"><div className="practice-shell"><PracticeHeader level={q?.level??4} label={session?.members.find(m=>m.id===userId)?.name??'Class'} userId={userId}/>{tracking.error&&<button onClick={()=>void tracking.retry()}>Retry saving progress</button>}{(error||activityError)&&<p role="alert">{error||activityError}</p>}
 {activity?.activity!=='test'||!mine?<section className="su-wait"><h1>{session?.members.find(m=>m.id===userId)?.name??'…'}</h1><p>รอรอบของคุณ</p>{activity?.activity==='test'&&turn&&<div className="su-current-student" aria-live="polite"><small>ตอนนี้เป็นรอบของ</small><strong>{session?.members.find(m=>m.id===turn.learner)?.name??'…'}</strong></div>}</section>:q&&turn?<ClassroomPractice question={q} turn={turn} busy={busy} onPresented={presented} onAnswer={(value,evidence)=>void answer(value,evidence)}/>:<p role="alert">กรุณาโหลดหน้านี้ใหม่</p>}
 </div></main>
}
