import { useEffect, useState, type ReactNode } from 'react'
import { initializeCurriculum, installCurriculum, selectLearningCourse } from './database'
import type { LearningCourse } from './courseScope'

export default function CurriculumGate({children, course = 'hotel',preview=false}:{children:ReactNode; course?: LearningCourse;preview?:boolean}) {
  const [state,setState]=useState<'loading'|'database'|'cache'|'error'>('loading')
  const [attempt,setAttempt]=useState(0)
  useEffect(()=>{
    let active=true
    const load=preview?import('./syllabus.snapshot.json').then(module=>{if(active)installCurriculum(module.default);return 'cache' as const}):initializeCurriculum()
    void load.then(source=>{if(active){selectLearningCourse(course);setState(source)}}).catch(()=>{if(active)setState('error')})
    return ()=>{active=false}
  },[attempt,course,preview])
  if(state==='loading') return <p role="status">Loading course…</p>
  if(state==='error') return <section className="hotel-content"><p role="alert">Couldn’t load the course.</p><button className="hotel-primary" onClick={()=>{setState('loading');setAttempt(n=>n+1)}}>Retry</button></section>
  return <div data-curriculum-source={preview?'preview':state}>{!preview&&state==='cache'?<p role="status">Using saved course</p>:null}{children}</div>
}
