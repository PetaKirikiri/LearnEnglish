import {useCallback,useEffect,useRef,useState} from 'react'
import {classroomCall,type ClassSession} from './session'
import {actionPracticeQuestions} from '../race/actionPracticeContent'
import LanguageQuadrant from '../learning/sentenceMatrix/LanguageQuadrant'
import PracticeGold,{awardPracticeGold} from '../race/PracticeGold'
import '../classroom/sentenceLine.css'
import './university.css'
export default function ClassroomStudent({sessionId,userId}:{sessionId:string;userId:string}){
 const [session,setSession]=useState<ClassSession>(),[error,setError]=useState(''),[busy,setBusy]=useState(false)
 const mounted=useRef(true),lock=useRef(false),audio=useRef<HTMLAudioElement|null>(null)
 useEffect(()=>{mounted.current=true;let pending=false
  const refresh=async(action='state')=>{if(pending)return;pending=true;try{const next=await classroomCall(action,sessionId);if(mounted.current){setSession(next);setError('')}}catch(e){if(mounted.current)setError((e as Error).message)}finally{pending=false}}
  void refresh('join');const timer=setInterval(()=>void refresh(),1500)
  return()=>{mounted.current=false;clearInterval(timer)}
 },[sessionId])
 const turn=session?.turn, mine=turn?.learner===userId,q=actionPracticeQuestions.find(q=>q.id===turn?.questionId)
 const play=useCallback(()=>{audio.current?.pause();if(!mine||!q)return;const player=new Audio(q.audioUrl);audio.current=player;void player.play().catch(()=>{})},[mine,q])
 useEffect(()=>{play();return()=>audio.current?.pause()},[play])
 async function answer(value:string){if(!turn||lock.current)return;lock.current=true;setBusy(true)
  try{const next=await classroomCall('answer',sessionId,{turn:turn.id,answer:value});setSession(next);awardPracticeGold(turn.id,next.turn?.correct===true,userId);setError('')}catch(e){setError((e as Error).message)}finally{lock.current=false;setBusy(false)}
 }
 return <main className="su-student classroom"><header><strong>Success University</strong><PracticeGold userId={userId}/></header>{error&&<p role="alert">{error}</p>}
 {!mine?<section className="su-wait"><span aria-hidden="true">🎓</span><h1>{session?.members.find(m=>m.id===userId)?.name??'…'}</h1><p>รอรอบของคุณ</p>{turn&&<div className="su-current-student" aria-live="polite"><small>ตอนนี้เป็นรอบของ</small><strong>{session?.members.find(m=>m.id===turn.learner)?.name??'…'}</strong></div>}</section>:<>
 <button className="su-replay" onClick={play} aria-label="ฟังอีกครั้ง">🔊</button><div className="cw-sentence-board">{q?<LanguageQuadrant request={{document:{...q,construction:q.level===4?'action-question':'action-answer'},presentation:{size:'phone',translations:false,explanations:false,wordPicker:false}}}/>:<p role="alert">กรุณาโหลดหน้านี้ใหม่</p>}</div>
 <div className="su-answer-grid">{turn.choices.map(choice=><button key={choice} disabled={busy||turn.answer!==null} aria-pressed={turn.answer===choice} onClick={()=>void answer(choice)}>{choice}</button>)}</div>
 {turn.answer!==null&&<div className="su-result" role="status">{turn.correct?'✓ 🪙 +10':'✕'}<p>ดูคำอธิบายจากครู</p></div>}
 </>}</main>
}
