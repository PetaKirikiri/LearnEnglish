import { useEffect, useState, type ReactNode } from 'react'
import { initializeCurriculum } from './database'

export default function CurriculumGate({children}:{children:ReactNode}) {
  const [state,setState]=useState<'loading'|'database'|'cache'|'error'>('loading')
  const [attempt,setAttempt]=useState(0)
  useEffect(()=>{
    let active=true
    void initializeCurriculum().then(source=>{if(active)setState(source)},()=>{if(active)setState('error')})
    return ()=>{active=false}
  },[attempt])
  if(state==='loading') return <p role="status">Loading course…</p>
  if(state==='error') return <section className="hotel-content"><p role="alert">Couldn’t load the course.</p><button className="hotel-primary" onClick={()=>{setState('loading');setAttempt(n=>n+1)}}>Retry</button></section>
  return <div data-curriculum-source={state}>{state==='cache'?<p role="status">Using saved course</p>:null}{children}</div>
}
