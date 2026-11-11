import {DrawingStudent} from '../drawing/DrawingGame'
import {useDrawingGame} from '../drawing/game'
import {useEffect,useRef,useState} from 'react'
import {classroomCall,type ClassSession} from './session'
import {actionPracticeQuestions} from '../race/actionPracticeContent'
import ClassroomPractice from './ClassroomPractice'
import PracticeHeader from '../race/PracticeHeader'
import {awardPracticeGold} from '../race/PracticeGold'
import '../classroom/sentenceLine.css'
import './university.css'
export default function ClassroomStudent({sessionId,userId}:{sessionId:string;userId:string}){
 const drawing=useDrawingGame(sessionId)
 const [session,setSession]=useState<ClassSession>(),[error,setError]=useState(''),[busy,setBusy]=useState(false)
 const mounted=useRef(true),lock=useRef(false)
 useEffect(()=>{mounted.current=true;let pending=false
  const refresh=async(action='state')=>{if(pending)return;pending=true;try{const next=await classroomCall(action,sessionId);if(mounted.current){setSession(next);setError('')}}catch(e){if(mounted.current)setError((e as Error).message)}finally{pending=false}}
  void refresh('join');const timer=setInterval(()=>void refresh(),1500)
  return()=>{mounted.current=false;clearInterval(timer)}
 },[sessionId])
 const turn=session?.turn, mine=turn?.learner===userId,q=actionPracticeQuestions.find(q=>q.id===turn?.questionId)
 async function answer(value:string){if(!turn||lock.current)return;lock.current=true;setBusy(true)
  try{const next=await classroomCall('answer',sessionId,{turn:turn.id,answer:value});setSession(next);awardPracticeGold(turn.id,next.turn?.correct===true,userId);setError('')}catch(e){setError((e as Error).message)}finally{lock.current=false;setBusy(false)}
 }
 if(drawing.game?.active)return <DrawingStudent game={{...drawing.game,drawings:drawing.game.drawings.map(d=>({...d,avatar:session?.members.find(m=>m.id===d.artist)?.avatar})),scores:drawing.game.scores.map(s=>({...s,avatar:session?.members.find(m=>m.id===s.id)?.avatar}))}} userId={userId} busy={drawing.busy} error={drawing.error} act={drawing.act} offset={drawing.offset.current}/>
 return <main className="phone-practice foundation-practice su-student"><div className="practice-shell"><PracticeHeader level={q?.level??4} label={session?.members.find(m=>m.id===userId)?.name??'Class'} userId={userId}/>{error&&<p role="alert">{error}</p>}
 {!mine?<section className="su-wait"><h1>{session?.members.find(m=>m.id===userId)?.name??'…'}</h1><p>รอรอบของคุณ</p>{turn&&<div className="su-current-student" aria-live="polite"><small>ตอนนี้เป็นรอบของ</small><strong>{session?.members.find(m=>m.id===turn.learner)?.name??'…'}</strong></div>}</section>:q&&turn?<ClassroomPractice question={q} turn={turn} busy={busy} onAnswer={value=>void answer(value)}/>:<p role="alert">กรุณาโหลดหน้านี้ใหม่</p>}
 </div></main>
}
