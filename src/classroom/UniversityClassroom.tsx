import {useEffect,useRef,useState} from 'react'
import QRCode from 'qrcode'
import {classroomHostCall,classroomJoinUrl,type ClassSession} from './session'
import {classroomMatrices} from './matrixLessons'
import SentenceMatrix from '../learning/sentenceMatrix/SentenceMatrix'
import {actionPracticeQuestions} from '../race/actionPracticeContent'
import LanguageQuadrant from '../learning/sentenceMatrix/LanguageQuadrant'
import {actionSeed} from '../learning/sentenceMatrix/actionSeed'
import ClassroomRace from './ClassroomRace'
const tonightStages=['classroom-action-questions','classroom-action-answers']
import Icon from '../ui/Icon'
import {LanguageSwitch} from './LanguageSwitch'
import './lesson.css'
import './university.css'
const tabs=[['join','qr','Students'],['board','whiteboard','Whiteboard'],['test','play','Testing'],['race','horse','Horse race']] as const
const patterns=[['where','Where …?'],['location','… is at …'],['ask','What … doing?'],['answer','… am/is/are …ing']] as const
type Pattern=typeof patterns[number][0]
export default function UniversityClassroom(){
 const [tab,setTab]=useState<typeof tabs[number][0]>('join'),[pattern,setPattern]=useState<Pattern>('ask')
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
 const members=session?.members.filter(m=>m.active)??[],turn=session?.turn,q=actionPracticeQuestions.find(q=>q.id===turn?.questionId),student=members.find(m=>m.id===turn?.learner)
 async function change(action:string,payload:Record<string,unknown>){if(locked.current||!id)return;locked.current=true;setBusy(true);setError('')
  try{setSession(await classroomHostCall(action,id,payload))}catch(e){setError((e as Error).message)}finally{locked.current=false;setBusy(false)}
 }
 async function next(){if(locked.current||!members.length)return;setRolling(true)
  const interval=setInterval(()=>setRollingName(members[Math.floor(Math.random()*members.length)].name),80)
  const since=Date.now();try{await change('next',{previous:turn?.id??''});await new Promise(resolve=>setTimeout(resolve,Math.max(0,750-(Date.now()-since))))}finally{clearInterval(interval);setRolling(false)}
 }
 const activePattern=tab==='test'&&q?(q.level===4?'ask':'answer'):pattern
 const action=activePattern==='ask'||activePattern==='answer'
 const lesson={...classroomMatrices['lesson-3'],pattern:action?'present-action' as const:activePattern==='location'?'people-location' as const:undefined}
 const initialAction=q?actionSeed(q,lesson):undefined
 return <div className="classroom su-classroom"><aside className="index"><div className="rail-brand"><img src="/brand/englishsuccess-cap-white.svg" alt="Success University"/><strong>Success<br/>University</strong></div><nav className="phases">{tabs.map(([key,icon,label])=><div className={`phase ${tab===key?'active':''}`} key={key}><button className="phase-button" aria-current={tab===key?'page':undefined} onClick={()=>setTab(key)}><span className="phase-icon" aria-hidden="true">{icon==='horse'?'🏇':<Icon name={icon}/>}</span><span>{label}</span></button></div>)}</nav></aside>
 <main><LanguageSwitch/>{error&&<div role="alert" className="su-error">{error}</div>}
 {tab==='join'?<section className="su-join"><div className="su-qr"><h1>Join the class</h1>{qr&&session?<img src={qr} alt="Scan to join this class"/>:<span>…</span>}<small>learn-english-coral.vercel.app</small></div><div className="su-roster"><h2>Students <span>{members.length}</span></h2>{!members.length&&<p>Waiting for students…</p>}{session?.members.map(m=><div className="su-member" key={m.id} data-active={m.active}>{m.avatar&&<img src={m.avatar} alt=""/>}<strong>{m.name}</strong><span>🪙 {m.coins}</span><button disabled={busy} aria-label={`${m.active?'Remove':'Add back'} ${m.name}`} onClick={()=>void change(m.active?'remove':'restore',{learner:m.id})}>{m.active?'×':'+'}</button></div>)}</div></section>:tab==='race'?<ClassroomRace lessonId="university-actions" stages={tonightStages}/>:<section className="su-workspace">
 {tab==='board'?<div className="su-structure-selector" role="group" aria-label="Sentence structure">{patterns.map(([key,label])=><button key={key} aria-pressed={pattern===key} onClick={()=>setPattern(key)}>{label}</button>)}</div>:<header className="su-test-header"><div><small>{turn?'YOUR TURN':'NEXT STUDENT'}</small><h1 aria-live="polite">{rolling?rollingName:student?.name??'Ready?'}</h1>{student&&<span>🪙 {student.coins}</span>}</div><button className={`su-crank ${rolling?'rolling':''}`} aria-label="Choose next student" disabled={busy||rolling||!members.length} onClick={()=>void next()}><span className="su-crank-arm"/><span className="su-crank-knob"/><strong>GO</strong></button></header>}
 {(tab==='board'||q)&&<div className="cw-sentence-workspace">{tab==='test'&&turn?.answer===null&&q?<LanguageQuadrant request={{document:{...q,construction:q.level===4?'action-question':'action-answer'},presentation:{translations:false,explanations:false,wordPicker:false}}}/>:<SentenceMatrix key={tab==='board'?pattern:turn?.id} lesson={lesson} initialAction={tab==='test'?initialAction:undefined} settings={{patternNavigation:false,initialPattern:activePattern==='answer'||activePattern==='location'?'answer':'question',translations:tab==='board'||turn?.answer!==null,explanations:tab==='board'||turn?.answer!==null,wordPicker:tab==='board'||turn?.answer!==null,fadeMode:false}}/>}</div>}
 {tab==='test'&&turn&&<div className="su-answer-grid">{turn.choices.map(choice=><div key={choice} className={turn.answer===choice?(turn.correct?'correct':'incorrect'):''}>{choice}{turn.answer===choice&&<strong>{turn.correct?' ✓ +10 🪙':' ✕'}</strong>}</div>)}</div>}
 </section>}</main></div>
}
