import MemberAvatar from '../ui/MemberAvatar'
import {whiteboardWords} from './whiteboardWords'
import PanelHeader from './PanelHeader'
import {memberIsOnline,useClassroomClock} from './presence'
import {useEffect,useRef,useState} from 'react'
import QRCode from 'qrcode'
import {classroomHostCall,classroomJoinUrl,type ClassSession} from './session'
import {structuresForLesson,structureForLesson,lessonForStructure,type ClassroomStructureId} from '../learning/lessonRegistry'
import StructureNavigation from '../learning/sentenceMatrix/StructureNavigation'
import {lessonNumbers,type LessonId} from '../learning/lessonRequests'
import SentenceMatrix from '../learning/sentenceMatrix/SentenceMatrix'
import {classroomTestingQuestions} from './testingQuestions'
import ClassroomPractice from './ClassroomPractice'
import {classroomActivity} from './activity'
import DrawingHost from '../drawing/DrawingGame'
import ClassroomNavIcon from './ClassroomNavIcon'
import {LanguageSwitch} from './LanguageSwitch'
import './lesson.css'
import './university.css'
const tabs=[['join','students','Students'],['board','whiteboard','Whiteboard'],['test','testing','Testing'],['race','game','Game']] as const
export default function UniversityClassroom({requestedLesson}:{requestedLesson?:LessonId}){
 const [selectedLesson,setSelectedLesson]=useState<LessonId>(requestedLesson??'lesson-3')
 const [tab,setTab]=useState<typeof tabs[number][0]>(requestedLesson?'board':'join'),[pattern,setPattern]=useState<ClassroomStructureId>(()=>structureForLesson(requestedLesson))
 function selectLesson(next:LessonId){
  setSelectedLesson(next);setPattern(structureForLesson(next))
  const url=new URL(location.href);url.searchParams.set('lesson',next.slice(7));history.replaceState(history.state,'',url)
 }
 const lessonIndex=lessonNumbers.indexOf(selectedLesson.slice(7) as typeof lessonNumbers[number])
 const [session,setSession]=useState<ClassSession>(),[id,setId]=useState(()=>localStorage.getItem('su-classroom-host-session')??'')
 const [qr,setQr]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false),[rolling,setRolling]=useState(false),[rollingName,setRollingName]=useState('')
 const locked=useRef(false),mounted=useRef(true)
 useEffect(()=>{mounted.current=true;let pending=false
  const refresh=async()=>{if(pending)return;pending=true;try{
   if(!id){const created=await classroomHostCall('create');if(mounted.current){localStorage.setItem('su-classroom-host-session',created.id);setId(created.id)}}
   else {const next=await classroomHostCall('state',id);if(mounted.current){setSession(next);setError('')}}
  }catch(e){if(mounted.current){const message=(e as Error).message;if(message.includes('Class has ended')){localStorage.removeItem('su-classroom-host-session');setId('')}else setError(message)}}finally{pending=false}}
  void refresh();const timer=setInterval(()=>void refresh(),1500);return()=>{mounted.current=false;clearInterval(timer)}
 },[id])
 useEffect(()=>{if(id)void QRCode.toDataURL(classroomJoinUrl(id),{width:420,margin:2}).then(setQr)},[id])
 const now=useClassroomClock(session)
 const members=session?.members.filter(m=>memberIsOnline(m,now))??[],turn=session?.turn,q=turn?.question??classroomTestingQuestions.find(q=>q.id===turn?.questionId),student=session?.members.find(m=>m.id===turn?.learner)
 async function change(action:string,payload:Record<string,unknown>){if(locked.current||!id)return;locked.current=true;setBusy(true);setError('')
  try{setSession(await classroomHostCall(action,id,payload))}catch(e){setError((e as Error).message)}finally{locked.current=false;setBusy(false)}
 }
 // Keep navigation immediate; serialize and retry delivery to joined phones.
 const activitySync=useRef(Promise.resolve())
 const [activityError,setActivityError]=useState('')
 useEffect(()=>{
  if(!id)return
  let current=true,timer:ReturnType<typeof setTimeout>|undefined
  const deliver=()=>{activitySync.current=activitySync.current.catch(()=>{}).then(async()=>{
   if(!current)return
   try{await classroomActivity(id,{activity:tab,lesson:Number(selectedLesson.slice(7))});if(current){setActivityError('')}}
   catch(e){if(current){setActivityError((e as Error).message);timer=setTimeout(deliver,1500)}}
  })}
  deliver();return()=>{current=false;clearTimeout(timer)}
 },[tab,id,selectedLesson])
 function selectTab(nextTab:typeof tabs[number][0]){setTab(nextTab)}
 async function next(){if(locked.current||!members.length)return;setRolling(true)
  const interval=setInterval(()=>setRollingName(members[Math.floor(Math.random()*members.length)].name),80)
  const since=Date.now();try{await change('next',{previous:turn?.id??'',lesson:selectedLesson});await new Promise(resolve=>setTimeout(resolve,Math.max(0,750-(Date.now()-since))))}finally{clearInterval(interval);setRolling(false)}
 }
 const lesson=whiteboardWords(lessonForStructure(pattern,selectedLesson))
 return <div className="classroom su-classroom"><aside className="index"><div className="rail-brand"><nav className="su-lesson-nav" aria-label="Lesson navigation"><button type="button" aria-label="Previous lesson" disabled={lessonIndex===0} onClick={()=>selectLesson(`lesson-${lessonNumbers[lessonIndex-1]}`)}>‹</button><span className="su-lesson-label" aria-live="polite">Lesson {selectedLesson.slice(7).padStart(2,'0')}</span><button type="button" aria-label="Next lesson" disabled={lessonIndex===lessonNumbers.length-1} onClick={()=>selectLesson(`lesson-${lessonNumbers[lessonIndex+1]}`)}>›</button></nav><img src="/brand/englishsuccess-cap-white.svg" alt="Success University"/><strong>Success<br/>University</strong></div><nav className="phases">{tabs.map(([key,icon,label])=><div className={`phase ${tab===key?'active':''}`} key={key}><button className="phase-button" aria-current={tab===key?'page':undefined} onClick={()=>selectTab(key)}><span className="phase-icon" aria-hidden="true"><ClassroomNavIcon name={icon}/></span><span>{label}</span></button></div>)}</nav></aside>
 <main><LanguageSwitch/><div className="cw-sentence-panel su-class-panel"><PanelHeader page="example" lessonNumber={Number(selectedLesson.slice(7))}/>{(error||activityError)&&<div role="alert" className="su-error">{error||activityError}</div>}
 {tab==='join'?<section className="su-join"><div className="su-qr"><h1>Join the class</h1>{qr&&session?<img src={qr} alt="Scan to join this class"/>:<span>…</span>}<small>learn-english-coral.vercel.app</small></div><div className="su-roster"><h2>Students <span>{members.length} online</span></h2>{!members.length&&<p>Waiting for students…</p>}{session?.members.map(m=><div className="su-member" key={m.id} data-active={m.active} data-online={memberIsOnline(m,now)}>{m.avatar&&<MemberAvatar name={m.name} url={m.avatar} size={48}/>}<strong>{m.name}<small className="su-presence">{!m.active?'Removed':memberIsOnline(m,now)?'Online':'Offline'}</small></strong><span>🪙 {m.coins}</span><button disabled={busy} aria-label={`${m.active?'Remove':'Add back'} ${m.name}`} onClick={()=>void change(m.active?'remove':'restore',{learner:m.id})}>{m.active?'×':'+'}</button></div>)}</div></section>:tab==='race'?<DrawingHost sessionId={id} players={session?.members.filter(m=>m.active)}/>:<section className="su-workspace">
 {tab==='board'?<div className="su-whiteboard"><StructureNavigation structures={structuresForLesson(selectedLesson)} selected={pattern} onChange={setPattern}/><div className="cw-sentence-workspace"><SentenceMatrix key={`${selectedLesson}:${pattern}`} lesson={lesson} initialAction={undefined} settings={{patternNavigation:true,initialPattern:'question',translations:true,explanations:true,wordPicker:true,fadeMode:false}}/></div></div>:<header className="su-test-header"><div><small>{turn?'YOUR TURN':'NEXT STUDENT'}</small><h1 aria-live="polite">{rolling?rollingName:student?.name??'Ready?'}</h1>{student&&<><span>🪙 {student.coins}</span>{!memberIsOnline(student,now)&&<p className="su-disconnected" role="status">{student.name} is offline. Choose the next student or wait for them to return.</p>}</>}</div><button className={`su-crank ${rolling?'rolling':''}`} aria-label="Choose next student" disabled={busy||rolling||!members.length} onClick={()=>void next()}><span className="su-crank-arm"/><span className="su-crank-knob"/><strong>GO</strong></button></header>}
 {tab!=='board'&&q&&turn?<div className="phone-practice foundation-practice su-classroom-practice"><div className="practice-shell"><ClassroomPractice question={q} turn={turn}/></div></div>:null}

 </section>}</div></main></div>
}
