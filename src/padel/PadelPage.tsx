import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { appDestination } from '../auth/appAccess'
import { finishHotelReturn } from '../hotel/accountHandoff'
import { bounded } from '../hotel/lineAccount'
import { ENGLISH_ORIGIN } from '../hotel/lineEntry'
import { HotelLesson, type ListeningCourse } from '../hotel/HotelPage'
import HotelContentPage from '../hotel/HotelContentPage'
import Icon from '../ui/Icon'
import * as course from './course'
import PadelWordHelp, { PadelSentenceHelp } from './PadelWordHelp'
import { padelLineEntryUrl } from './lineEntry'
import { questionWordSkills, questionWordNames } from './questionWords'
import './padel.css'

const padelCourse: ListeningCourse = {
  ...course, wordMemoryKey: id => `padel:words:v1:${id}`, WordHelp: PadelSentenceHelp, presentation: 'clay',
  // Progress is learner-scoped on this device, like Hotel. No Hotel scoring RPCs.
}
const padelContent = { ...course, questions: course.padelQuestions, name:'Padel', WordHelp: PadelWordHelp }
const questionWordCourse: ListeningCourse = { ...padelCourse, skills:questionWordSkills, skillNames:questionWordNames, nextQuestion:course.nextQuestionWord }
const questionWordContent = { ...padelContent, skills:questionWordSkills, skillNames:questionWordNames, questions:course.padelQuestions.filter(q=>questionWordSkills.includes(q.skill)) }
export default function PadelPage() {
  const [user,setUser] = useState<User | null>(null)
  const [busy,setBusy] = useState(true)
  const [error,setError] = useState('')
  const admin = user ? appDestination(user.id,'/admin') === 'admin' : false
  const preview = import.meta.env.DEV && /^\/padel\/preview(?:\/content)?\/?$/.test(window.location.pathname)
  const content = (admin && /^\/padel\/content\/?$/.test(window.location.pathname)) || (preview && /\/content\/?$/.test(window.location.pathname))
  const practicePath = preview ? '/padel/preview' : '/padel'
  const questionsTopic = new URLSearchParams(window.location.search).get('topic')==='questions'
  const topicQuery = questionsTopic ? '?topic=questions' : ''
  useEffect(() => {
    document.title = 'Success Padel · English'
    let active = true
    const ticket = window.location.origin === ENGLISH_ORIGIN ? new URLSearchParams(window.location.hash.slice(1)).get('ticket') : null
    if (ticket) window.history.replaceState(null,'',`${window.location.pathname}${window.location.search}`)
    void bounded(() => finishHotelReturn(ticket)).then(value => { if (active) setUser(value) }, () => { if (active) setError('Couldn’t connect. Please try LINE again.') })
      .finally(() => { if (active) setBusy(false) })
    return () => { active = false }
  },[])
  return <main className={`hotel-shell padel-shell${!content && (user || preview) ? ' padel-practice-clay' : ''}`}>
    <header className="hotel-header">
      <a className="padel-brand" href={`${practicePath}${topicQuery}`} aria-label="Success Padel English">
        <strong>SUCCESS</strong>
        <span>PADEL</span>
      </a>
      {user || preview ? <nav className="hotel-admin-nav" aria-label="Padel tools">
        <a className="hotel-nav-icon" href={`${practicePath}${topicQuery}`} aria-label="Practice" aria-current={!content ? 'page' : undefined}><Icon name="play" /></a>
        {admin || preview ? <a className="hotel-content-link" href={`${preview ? '/padel/preview/content' : '/padel/content'}${topicQuery}`} aria-current={content ? 'page' : undefined}>Content</a> : null}
      </nav> : null}
    </header>
    {user || preview ? <select className="padel-topic" aria-label="Padel topic" value={questionsTopic?'questions':'all'} onChange={event=>{
      const url=new URL(window.location.href)
      if(event.target.value==='questions') url.searchParams.set('topic','questions')
      else url.searchParams.delete('topic')
      window.location.assign(url.pathname+url.search)
    }}><option value="all">All Padel</option><option value="questions">Question words</option></select> : null}
    {content ? <HotelContentPage course={questionsTopic?questionWordContent:padelContent} /> : user || preview ? <>
      <HotelLesson key={user?.id ?? 'local-preview'} userId={user?.id ?? 'local-preview'} course={questionsTopic?questionWordCourse:padelCourse} />
    </> : <section className="hotel-welcome padel-login">
      <h1>Padel</h1>
      <button className="hotel-line" disabled={busy} onClick={() => window.location.assign(padelLineEntryUrl(true))}>{busy ? 'Connecting…' : 'Sign in with LINE'}</button>
      {error ? <p role="alert">{error}</p> : null}
    </section>}
  </main>
}
