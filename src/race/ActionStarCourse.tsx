import {useCallback,useEffect,useRef,useState} from 'react'
import ActionPracticeStage from './ActionPracticeStage'
import type {MatrixSettings} from '../learning/sentenceMatrix/model'
import {actionStarDeck,actionStarsVersion,completeStar,starAvailable,type ActionStar} from './actionStarContent'
import {useWordProgress} from '../learning/wordProgress/useWordProgress'
import {QUESTION_VERSION,WORD_RULE_VERSION,sentenceModality} from '../learning/wordProgress/model'
import {awardPracticeGold} from './PracticeGold'
import PracticeHeader from './PracticeHeader'
import type {PracticeLevel} from './PracticeLevelPicker'
import './phonePractice.css'
import './numberFoundation.css'
import './actionStars.css'
import {actionStarKey as key,loadActionStarProgress as loadCourse} from './actionStarProgress'
type CourseProps={settings?:MatrixSettings;userId?:string;onExit?:()=>void;onLevel?:(level:PracticeLevel)=>void;onComplete?:(score:number,total:number)=>void}
export default function ActionStarCourse(props:CourseProps){
 return <Course key={props.userId??'guest'} {...props}/>
}
function Course({settings,userId,onExit,onLevel,onComplete}:CourseProps){
 const [saved,setSaved]=useState(()=>loadCourse(userId))
 const [active,setActive]=useState<ActionStar|null>(()=>(
  ([3,2,1] as const).find(stars=>starAvailable(stars,saved.progress)) ?? 1
 ))
 const [run,setRun]=useState(0),[result,setResult]=useState<{score:number;total:number}|null>(null),[saveError,setSaveError]=useState(false)
 const finish=useCallback((stars:ActionStar,score:number,total:number,runId:string,unassisted:boolean)=>{
  if(saved.reported.includes(runId))return
  const next={...saved,progress:completeStar(saved.progress,stars,score,total,unassisted),reported:[...saved.reported.slice(-19),runId]}
  try{localStorage.setItem(key(userId),JSON.stringify(next));setSaveError(false)}catch{setSaveError(true)}
  setSaved(next);setResult({score,total});setActive(null)
  if(stars===3&&(next.progress[3]?.passes??0)>=2)onComplete?.(([1,2,3] as const).reduce((sum,s)=>sum+(next.progress[s]?.best??0),0),150)
 },[saved,userId,onComplete])
 if(active)return <StarRun key={`${active}:${run}`} stars={active} settings={settings} onLevel={onLevel} userId={userId} onExit={onExit??(()=>setActive(null))} exitLabel={onExit?"กลับแผนที่":"กลับดาว"} onFinish={finish}/>
 return <main className="phone-practice foundation-practice" lang="th"><div className="practice-shell"><PracticeHeader level={6} onLevel={onLevel} userId={userId} onExit={onExit} exitHref={onExit?undefined:"/english/notes?lesson=4"} exitLabel={onExit?"กลับแผนที่":"กลับบทเรียน"}/><section className="action-stars-menu"><h1>ใครทำอะไร กับของใคร</h1>{result&&<p role="status">{result.score} / {result.total}{result.total<50&&' · ทบทวนการกระทำนี้ แล้วลองอีกครั้ง'}</p>}<p>50 ข้อต่อดาว · Listen → choose the pictures</p><p>ผ่าน 45/50 สองครั้ง เพื่อปลดล็อกดาวถัดไป</p>{saveError&&<p role="alert">บันทึกความคืบหน้าไม่ได้ กรุณาลองอีกครั้ง</p>}{([1,2,3] as const).map(stars=><button className="action-star-choice" key={stars} disabled={!starAvailable(stars,saved.progress)} onClick={()=>{setRun(n=>n+1);setActive(stars);setResult(null)}} aria-label={`${stars} star · 50 questions`}><strong>{'★'.repeat(stars)}</strong><span>{stars===1?'eating · reading · drinking':stars===2?'holding · opening · washing':'ทบทวนและผสมคำ'}</span><small>{Math.min(2,saved.progress[stars]?.passes??0)} / 2 · {saved.progress[stars]?.best??0} / 50</small></button>)}</section></div></main>
}
type RunSave={assisted?:boolean;version:string;runId:string;index:number;answers:boolean[];picked:number|null;attemptId:string}
const runKey=(stars:ActionStar,user?:string)=>`${key(user)}:run:${stars}`
function newRun():RunSave{return {version:actionStarsVersion,runId:crypto.randomUUID(),index:0,answers:[],picked:null,attemptId:crypto.randomUUID()}}
function loadRun(stars:ActionStar,user?:string):RunSave{
 try{const s=JSON.parse(localStorage.getItem(runKey(stars,user))??'null');if(!s?.done&&s?.version===actionStarsVersion&&typeof s.runId==='string'&&typeof s.attemptId==='string'&&Number.isInteger(s.index)&&s.index>=0&&s.index<50&&Array.isArray(s.answers)&&s.answers.every((a:unknown)=>typeof a==='boolean')&&[null,0,1].includes(s.picked)&&s.answers.length===s.index+(s.picked===null?0:1))return s}catch{/* Start a new attempt when no valid run is saved. */}
 return newRun()
}
function StarRun({stars,userId,settings,onExit,exitLabel,onLevel,onFinish }:{stars:ActionStar;settings?:MatrixSettings;userId?:string;exitLabel:string;onLevel?:(level:PracticeLevel)=>void;onExit:()=>void;onFinish:(stars:ActionStar,score:number,total:number,runId:string,unassisted:boolean)=>void}){
 const [saved,setSaved]=useState(()=>loadRun(stars,userId)),[heard,setHeard]=useState(false),[audioError,setAudioError]=useState(false),[saveError,setSaveError]=useState(false)
 const progress=useWordProgress(userId),player=useRef<HTMLAudioElement|null>(null),request=useRef(0),locked=useRef(saved.picked!==null),replays=useRef(0)
 const deck=actionStarDeck(stars,saved.runId),q=deck[saved.index],score=saved.answers.filter(Boolean).length
 useEffect(()=>{try{localStorage.setItem(runKey(stars,userId),JSON.stringify(saved));setSaveError(false)}catch{setSaveError(true)}},[saved,stars,userId])
 const play=useCallback(()=>{
  if(!q)return
  const current=++request.current;player.current?.pause();setAudioError(false)
  const audio=new Audio(q.audioUrl);player.current=audio
  audio.onended=()=>{if(current===request.current)setHeard(true)}
  audio.onerror=()=>{if(current===request.current)setAudioError(true)}
  void audio.play().then(()=>{if(current===request.current)replays.current++}).catch(()=>{if(current===request.current)setAudioError(true)})
 },[q?.id,q?.audioUrl])
 useEffect(()=>{play();return()=>{request.current++;player.current?.pause()}},[play])
 function choose(side:number){
  if(locked.current||!heard||!progress.ready||!q)return
  try{progress.record({id:saved.attemptId,questionId:q.id,version:QUESTION_VERSION,answer:q.choices[side],occurredAt:new Date().toISOString(),modality:sentenceModality(q.english,progress.scores,{fadeMode:true,...settings}),replays:Math.max(0,replays.current-1),ruleVersion:WORD_RULE_VERSION})}catch{setSaveError(true);return}
  locked.current=true;awardPracticeGold(saved.attemptId,side===q.correct,userId)
  setSaved(s=>({...s,picked:side,answers:[...s.answers,side===q.correct]}))
 }
 function next(){
  if(!locked.current)return
  const upcoming=deck[saved.index+1],action=q.provenance.action,newAction=upcoming&&upcoming.provenance.action!==action
  const start=deck.findIndex(item=>item.provenance.action===action),block=saved.answers.slice(start,saved.index+1)
  const failedStage=stars===2&&newAction&&['holding','opening','washing'].includes(action)&&block.filter(Boolean).length<Math.max(3,Math.ceil(block.length*.9))
  if(!upcoming||failedStage){try{localStorage.setItem(runKey(stars,userId),JSON.stringify({...saved,done:true}))}catch{setSaveError(true)};onFinish(stars,score,saved.answers.length,saved.runId,!saved.assisted);return}
  locked.current=false;request.current++;player.current?.pause();setHeard(false);replays.current=0
  setSaved(s=>({...s,index:s.index+1,picked:null,attemptId:crypto.randomUUID()}))
 }
 const reveal=saved.picked!==null
 return <main className="phone-practice foundation-practice" lang="th"><div className="practice-shell"><PracticeHeader level={6} onLevel={onLevel} value={saved.answers.length} total={50} userId={userId} onExit={onExit} exitLabel={exitLabel}/><ActionPracticeStage onReplay={play} question={q} scores={progress.scores} settings={settings} picked={saved.picked} disabled={!heard||reveal||!progress.ready} onChoose={choose} onNext={next} onHelp={()=>{if(!reveal)setSaved(s=>({...s,assisted:true}))}} review={reveal}>
 {audioError&&<button role="alert" onClick={play}>🔊 ↻ Tap to listen</button>}{(saveError||progress.error)&&<p role="alert">บันทึกคำตอบไม่ได้ กรุณาลองอีกครั้ง</p>}</ActionPracticeStage></div></main>
}
