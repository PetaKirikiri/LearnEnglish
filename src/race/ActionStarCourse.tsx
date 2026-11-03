import {useCallback,useEffect,useRef,useState} from 'react'
import SentenceMatrix from '../learning/sentenceMatrix/SentenceMatrix'
import LanguageQuadrant from '../learning/sentenceMatrix/LanguageQuadrant'
import {actionSeed} from '../learning/sentenceMatrix/actionSeed'
import {actionStarDeck,actionStarTeachingExample,actionStarLesson,actionStarsVersion,completeStar,starAvailable,type ActionStar,type StarProgress} from './actionStarContent'
import {useWordProgress} from '../learning/wordProgress/useWordProgress'
import {QUESTION_VERSION,WORD_RULE_VERSION} from '../learning/wordProgress/model'
import PracticeStage from './PracticeStage'
import BinaryAnswerZone,{type BinaryChoice} from './BinaryAnswerZone'
import PracticeGold,{awardPracticeGold} from './PracticeGold'
import './phonePractice.css'
import './numberFoundation.css'
import './actionStars.css'
type CourseSave={version:string;progress:StarProgress;reported:string[]}
const key=(user?:string)=>`englishsuccess:action-stars:v1:${user??'guest'}`
function loadCourse(user?:string):CourseSave{
 try{const saved=JSON.parse(localStorage.getItem(key(user))??'null');if(saved?.version===actionStarsVersion&&Array.isArray(saved.reported))return {...saved,progress:Object.fromEntries(Object.entries(saved.progress??{}).filter(([star,result])=>{const r=result as {passes:number;best:number};return ['1','2','3'].includes(star)&&Number.isInteger(r?.passes)&&r.passes>=0&&Number.isInteger(r.best)&&r.best>=0&&r.best<=50}))}}catch{/* Storage is optional. */}
 return {version:actionStarsVersion,progress:{},reported:[]}
}
export default function ActionStarCourse(props:{userId?:string;onExit?:()=>void;onComplete?:(score:number,total:number)=>void}){
 return <Course key={props.userId??'guest'} {...props}/>
}
function Course({userId,onExit,onComplete}:{userId?:string;onExit?:()=>void;onComplete?:(score:number,total:number)=>void}){
 const [saved,setSaved]=useState(()=>loadCourse(userId)),[active,setActive]=useState<ActionStar|null>(null),[run,setRun]=useState(0),[result,setResult]=useState<{score:number;total:number}|null>(null),[saveError,setSaveError]=useState(false)
 const finish=useCallback((stars:ActionStar,score:number,total:number,runId:string)=>{
  if(saved.reported.includes(runId))return
  const next={...saved,progress:completeStar(saved.progress,stars,score,total,true),reported:[...saved.reported.slice(-19),runId]}
  try{localStorage.setItem(key(userId),JSON.stringify(next));setSaveError(false)}catch{setSaveError(true)}
  setSaved(next);setResult({score,total});setActive(null)
  if(stars===3&&(next.progress[3]?.passes??0)>=2)onComplete?.(([1,2,3] as const).reduce((sum,s)=>sum+(next.progress[s]?.best??0),0),150)
 },[saved,userId,onComplete])
 if(active)return <StarRun key={`${active}:${run}`} stars={active} userId={userId} onExit={()=>setActive(null)} onFinish={finish}/>
 return <main className="phone-practice foundation-practice" lang="th"><div className="practice-shell"><header>{onExit?<button aria-label="กลับแผนที่" onClick={onExit}>←</button>:<a href="/english/notes?lesson=4" aria-label="กลับบทเรียน">←</a>}<strong>Lesson 4</strong><PracticeGold userId={userId}/></header><section className="action-stars-menu"><h1>ใครทำอะไร กับของใคร</h1>{result&&<p role="status">{result.score} / {result.total}{result.total<50&&' · ทบทวนการกระทำนี้ แล้วลองอีกครั้ง'}</p>}<p>50 ข้อต่อดาว · ฟังแล้วเลือกคำแปล</p><p>ผ่าน 45/50 สองครั้ง เพื่อปลดล็อกดาวถัดไป</p>{saveError&&<p role="alert">บันทึกความคืบหน้าไม่ได้ กรุณาลองอีกครั้ง</p>}{([1,2,3] as const).map(stars=><button className="action-star-choice" key={stars} disabled={!starAvailable(stars,saved.progress)} onClick={()=>{setRun(n=>n+1);setActive(stars);setResult(null)}} aria-label={`${stars} star · 50 questions`}><strong>{'★'.repeat(stars)}</strong><span>{stars===1?'eating · reading · drinking':stars===2?'holding · opening · washing':'ทบทวนและผสมคำ'}</span><small>{Math.min(2,saved.progress[stars]?.passes??0)} / 2 · {saved.progress[stars]?.best??0} / 50</small></button>)}</section></div></main>
}
type RunSave={version:string;runId:string;index:number;answers:boolean[];picked:number|null;attemptId:string;teaching:boolean}
const runKey=(stars:ActionStar,user?:string)=>`${key(user)}:run:${stars}`
function newRun():RunSave{return {version:actionStarsVersion,runId:crypto.randomUUID(),index:0,answers:[],picked:null,attemptId:crypto.randomUUID(),teaching:true}}
function loadRun(stars:ActionStar,user?:string):RunSave{
 try{const s=JSON.parse(localStorage.getItem(runKey(stars,user))??'null');if(!s?.done&&s?.version===actionStarsVersion&&typeof s.runId==='string'&&typeof s.attemptId==='string'&&Number.isInteger(s.index)&&s.index>=0&&s.index<50&&Array.isArray(s.answers)&&s.answers.every((a:unknown)=>typeof a==='boolean')&&[null,0,1].includes(s.picked)&&s.answers.length===s.index+(s.picked===null?0:1)&&typeof s.teaching==='boolean')return s}catch{/* Start a new attempt when no valid run is saved. */}
 return newRun()
}
function StarRun({stars,userId,onExit,onFinish}:{stars:ActionStar;userId?:string;onExit:()=>void;onFinish:(stars:ActionStar,score:number,total:number,runId:string)=>void}){
 const [saved,setSaved]=useState(()=>loadRun(stars,userId)),[heard,setHeard]=useState(false),[audioError,setAudioError]=useState(false),[saveError,setSaveError]=useState(false)
 const progress=useWordProgress(userId),player=useRef<HTMLAudioElement|null>(null),request=useRef(0),locked=useRef(saved.picked!==null),replays=useRef(0)
 const deck=actionStarDeck(stars,saved.runId),q=deck[saved.index],score=saved.answers.filter(Boolean).length
 const example=stars===2&&['holding','opening','washing'].includes(q.provenance.action)?actionStarTeachingExample(q.provenance.action):undefined
 const spoken=saved.teaching&&example?example:q
 useEffect(()=>{try{localStorage.setItem(runKey(stars,userId),JSON.stringify(saved));setSaveError(false)}catch{setSaveError(true)}},[saved,stars,userId])
 const play=useCallback(()=>{
  if(!q)return
  const current=++request.current;player.current?.pause();setAudioError(false)
  const audio=new Audio(spoken.audioUrl);player.current=audio
  audio.onended=()=>{if(current===request.current&&!saved.teaching)setHeard(true)}
  audio.onerror=()=>{if(current===request.current)setAudioError(true)}
  void audio.play().then(()=>{if(current===request.current)replays.current++}).catch(()=>{if(current===request.current)setAudioError(true)})
 },[spoken.id,saved.teaching])
 useEffect(()=>{if(!saved.teaching)play();return()=>{request.current++;player.current?.pause()}},[play,saved.teaching])
 function choose(side:number){
  if(locked.current||!heard||!progress.ready||!q)return
  try{progress.record({id:saved.attemptId,questionId:q.id,version:QUESTION_VERSION,answer:q.choices[side],occurredAt:new Date().toISOString(),modality:'audio',replays:Math.max(0,replays.current-1),ruleVersion:WORD_RULE_VERSION})}catch{setSaveError(true);return}
  locked.current=true;awardPracticeGold(saved.attemptId,side===q.correct,userId)
  setSaved(s=>({...s,picked:side,answers:[...s.answers,side===q.correct]}))
 }
 function next(){
  if(!locked.current)return
  const upcoming=deck[saved.index+1],action=q.provenance.action,newAction=upcoming&&upcoming.provenance.action!==action
  const start=deck.findIndex(item=>item.provenance.action===action),block=saved.answers.slice(start,saved.index+1)
  const failedStage=stars===2&&newAction&&['holding','opening','washing'].includes(action)&&block.filter(Boolean).length<Math.max(3,Math.ceil(block.length*.9))
  if(!upcoming||failedStage){try{localStorage.setItem(runKey(stars,userId),JSON.stringify({...saved,done:true}))}catch{setSaveError(true)};onFinish(stars,score,saved.answers.length,saved.runId);return}
  locked.current=false;request.current++;player.current?.pause();setHeard(false);replays.current=0
  setSaved(s=>({...s,index:s.index+1,picked:null,attemptId:crypto.randomUUID(),teaching:stars!==3&&!!newAction}))
 }
 const reveal=saved.picked!==null
 return <main className="phone-practice foundation-practice" lang="th"><div className="practice-shell"><header><button onClick={onExit} aria-label="กลับดาว">←</button><strong>{'★'.repeat(stars)} · {saved.index+1}/50</strong><PracticeGold userId={userId}/><button aria-label="ฟังเสียง" onClick={play}>▶</button></header><progress value={saved.index} max={50} aria-label="ความคืบหน้า"/>{saved.teaching?<section className="action-star-teaching"><div className="classroom">{example?<SentenceMatrix lesson={{...actionStarLesson,actions:[example.provenance.action]}} initialAction={actionSeed(example,actionStarLesson)} settings={{initialPattern:'answer',patternNavigation:false,wordPicker:false,explanationSelection:false,audio:false,layout:{density:'content',maxWidth:800}}}/>:<p>ฟังประโยค แล้วเลือกคำแปลภาษาไทย · 50 ข้อ</p>}</div><button onClick={()=>{replays.current=0;setHeard(false);setSaved(s=>({...s,teaching:false}))}}>เริ่มฟัง →</button></section>:<PracticeStage question={<><div className="classroom foundation-noun"><div className="cw-sentence-board"><div className="cw-sentence-display"><LanguageQuadrant request={{document:{...q,construction:'action-answer'},presentation:{size:'phone',english:reveal,icons:reveal,thaiMeanings:reveal,thaiTranslation:reveal,explanations:false,wordPicker:false}}}/></div></div></div>{!heard&&!reveal&&<p>ฟังเสียงให้จบก่อนตอบ</p>}{audioError&&<button role="alert" onClick={play}>เล่นเสียงไม่ได้ · ลองอีกครั้ง</button>}{(saveError||progress.error)&&<p role="alert">บันทึกคำตอบไม่ได้ กรุณาลองอีกครั้ง</p>}</>} answers={<><BinaryAnswerZone choices={q.choices.map((text,side)=>({id:String(side),label:text,content:text,state:reveal?(side===q.correct?'correct':saved.picked===side?'incorrect':undefined):undefined})) as [BinaryChoice,BinaryChoice]} disabled={!heard||reveal||!progress.ready} selected={saved.picked} onChoose={choose}/><button className="foundation-next" disabled={!reveal} onClick={next}>ถัดไป →</button></>}/>}</div></main>
}
