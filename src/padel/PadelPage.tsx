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
import PadelWordHelp from './PadelWordHelp'
import { padelLineEntryUrl } from './lineEntry'
import './padel.css'

const padelCourse: ListeningCourse = {
  ...course, wordMemoryKey: id => `padel:words:v1:${id}`, WordHelp: PadelWordHelp,
  // Progress is learner-scoped on this device, like Hotel. No Hotel scoring RPCs.
}
const padelContent = { ...course, questions: course.padelQuestions, name:'Padel & Pilates', WordHelp: PadelWordHelp }
export default function PadelPage() {
  const [user,setUser] = useState<User | null>(null)
  const [busy,setBusy] = useState(true)
  const [error,setError] = useState(() => new URLSearchParams(window.location.search).get('line_result') === 'new' ? 'No account yet. Tap Sign up.' : '')
  const admin = user ? appDestination(user.id,'/admin') === 'admin' : false
  const preview = import.meta.env.DEV && /^\/padel\/preview(?:\/content)?\/?$/.test(window.location.pathname)
  const content = (admin && /^\/padel\/content\/?$/.test(window.location.pathname)) || (preview && /\/content\/?$/.test(window.location.pathname))
  const practicePath = preview ? '/padel/preview' : '/padel'
  useEffect(() => {
    document.title = 'Success Padel & Pilates · English'
    let active = true
    const ticket = window.location.origin === ENGLISH_ORIGIN ? new URLSearchParams(window.location.hash.slice(1)).get('ticket') : null
    if (ticket) window.history.replaceState(null,'',`${window.location.pathname}${window.location.search}`)
    void bounded(() => finishHotelReturn(ticket)).then(value => { if (active) setUser(value) }, cause => { if (active) setError(cause.message) })
      .finally(() => { if (active) setBusy(false) })
    return () => { active = false }
  },[])
  return <main className="hotel-shell padel-shell">
    <header className="hotel-header">
      <a className="padel-brand" href={practicePath} aria-label="Success Padel & Pilates English">
        <strong>SUCCESS</strong>
        <span>PADEL <i>&amp;</i> PILATES</span>
      </a>
      {admin || preview ? <nav className="hotel-admin-nav" aria-label="Padel & Pilates tools">
        <a className="hotel-nav-icon" href={practicePath} aria-label="Practice" aria-current={!content ? 'page' : undefined}><Icon name="play" /></a>
        <a className="hotel-content-link" href={preview ? '/padel/preview/content' : '/padel/content'} aria-current={content ? 'page' : undefined}>Content</a>
      </nav> : null}
    </header>
    {content ? <HotelContentPage course={padelContent} /> : user || preview ? <>
      {preview ? <p className="padel-preview">LOCAL PREVIEW</p> : null}
      <HotelLesson key={user?.id ?? 'local-preview'} userId={user?.id ?? 'local-preview'} course={padelCourse} />
    </> : <section className="hotel-welcome padel-login">
      <h1>Padel & Pilates</h1>
      <button className="hotel-line" disabled={busy} onClick={() => window.location.assign(padelLineEntryUrl(true))}>{busy ? 'Connecting…' : 'Sign up with LINE'}</button>
      <button className="hotel-reveal" disabled={busy} onClick={() => window.location.assign(padelLineEntryUrl())}>Sign in</button>
      {error ? <p role="alert">{error}</p> : null}
    </section>}
  </main>
}
