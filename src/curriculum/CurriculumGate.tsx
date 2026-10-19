import { useEffect, useState, type ReactNode } from 'react'
import { initializeCurriculum, selectLearningCourse } from './database'
import type { LearningCourse } from './courseScope'

export default function CurriculumGate({children, course = 'hotel'}:{children:ReactNode; course?: LearningCourse}) {
  const [state,setState]=useState<'loading'|'database'|'cache'|'error'>('loading')
  const [attempt,setAttempt]=useState(0)
  useEffect(()=>{
    let active=true
    void initializeCurriculum().then(source=>{if(active){selectLearningCourse(course);setState(source)}}).catch(()=>{if(active)setState('error')})
    return ()=>{active=false}
  },[attempt,course])
  if(state==='loading') return <p role="status">Loading course…</p>
  if(state==='error') return <section className="hotel-content"><p role="alert">Couldn’t load the course.</p><button className="hotel-primary" onClick={()=>{setState('loading');setAttempt(n=>n+1)}}>Retry</button></section>
  return <div data-curriculum-source={state}>{state==='cache'?<p role="status">Using saved course</p>:null}{children}</div>
}
