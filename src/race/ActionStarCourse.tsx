import {useCallback,useState} from 'react'
import type {MatrixSettings} from '../learning/sentenceMatrix/model'
import {starAvailable,type ActionStar} from './actionStarContent'
import PracticeHeader from './PracticeHeader'
import type {PracticeLevel} from './PracticeLevelPicker'
import './phonePractice.css'
import './numberFoundation.css'
import './actionStars.css'
import {actionStarKey as key,loadActionStarProgress as loadCourse,completeAdaptiveStar} from './actionStarProgress'
import GeneratedPractice from './GeneratedPractice'
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
  const next={...saved,progress:completeAdaptiveStar(saved.progress,stars,score,total,unassisted),reported:[...saved.reported.slice(-19),runId]}
  try{localStorage.setItem(key(userId),JSON.stringify(next));setSaveError(false)}catch{setSaveError(true)}
  setSaved(next);setResult({score,total});setActive(null)
  if(stars===3&&(next.progress[3]?.passes??0)>=2)onComplete?.(([1,2,3] as const).reduce((sum,s)=>sum+(next.progress[s]?.best??0),0),90)
 },[saved,userId,onComplete])
 if(active)return <GeneratedPractice key={`${active}:${run}`} level={6} scope={`star-${active}`} settings={settings} onLevel={onLevel} userId={userId} onExit={onExit??(()=>setActive(null))} onComplete={(_level,score,total,_passed,runId,unassisted)=>finish(active,score,total,runId,unassisted)}/>

 return <main className="phone-practice foundation-practice" lang="th"><div className="practice-shell"><PracticeHeader level={6} onLevel={onLevel} userId={userId} onExit={onExit} exitHref={onExit?undefined:"/english/notes?lesson=4"} exitLabel={onExit?"กลับแผนที่":"กลับบทเรียน"}/><section className="action-stars-menu"><h1>ใครทำอะไร กับของใคร</h1>{result&&<p role="status">{result.score} / {result.total}</p>}<p>30 ข้อต่อดาว · Listen → choose the pictures</p><p>ผ่าน 27/30 สองครั้ง เพื่อปลดล็อกดาวถัดไป</p>{saveError&&<p role="alert">บันทึกความคืบหน้าไม่ได้ กรุณาลองอีกครั้ง</p>}{([1,2,3] as const).map(stars=><button className="action-star-choice" key={stars} disabled={!starAvailable(stars,saved.progress)} onClick={()=>{setRun(n=>n+1);setActive(stars);setResult(null)}} aria-label={`${stars} star · 30 questions`}><strong>{'★'.repeat(stars)}</strong><span>{stars===1?'คำศัพท์ตามลำดับ':stars===2?'ฝึกต่อจากความคืบหน้า':'ทบทวนและผสมคำ'}</span><small>{Math.min(2,saved.progress[stars]?.passes??0)} / 2 · {saved.progress[stars]?.best??0} / 30</small></button>)}</section></div></main>
}
