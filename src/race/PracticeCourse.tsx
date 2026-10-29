import {useState} from 'react'
import {PracticeSession} from './PracticeSession'
import {practiceModules} from './practiceModules'
import type {MatrixSettings} from '../learning/sentenceMatrix/model'
export default function PracticeCourse(props:{userId?:string;tester?:boolean;settings?:MatrixSettings}){
 const lesson=new URLSearchParams(location.search).get('lesson')==='2'?2:1
 const modules=practiceModules(lesson),key=`englishsuccess:modules:v1:l${lesson}:${props.userId??'guest'}`
 const [completed,setCompleted]=useState<string[]>(()=>{try{const ids=JSON.parse(localStorage.getItem(key)??'[]');return Array.isArray(ids)?ids.filter(id=>modules.some(m=>m.id===id)):[]}catch{return []}})
 const [active,setActive]=useState(()=>modules.findIndex(module=>!completed.includes(module.id)))
 const [run,setRun]=useState(0)
 function finish(){
  const next=[...new Set([...completed,modules[active].id])]
  setCompleted(next);try{localStorage.setItem(key,JSON.stringify(next))}catch{/* Optional persistence. */}
  setActive(active+1<modules.length?active+1:-1)
 }
 if(active<0)return <main className="phone-practice" lang="th"><div className="practice-shell"><section className="practice-complete"><h1>จบบทเรียนแล้ว!</h1><p>ผ่านครบ {modules.length} ชุด</p><a className="practice-module-break" href={`/english/notes?lesson=${lesson}`}>กลับบทเรียน</a><button onClick={()=>{modules.forEach(module=>{try{localStorage.removeItem(`homework-v3-lesson-${lesson}${props.userId?':'+props.userId:''}:module:${module.id}`)}catch{/* Optional persistence. */}});setActive(0);setRun(value=>value+1)}}>ทบทวนอีกครั้ง</button></section></div></main>
 return <PracticeSession key={`${modules[active].id}:${run}`} {...props} module={modules[active]} onCompleteModule={finish} onRestartModule={()=>setRun(value=>value+1)}/>
}
