import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { appDestination } from '../auth/appAccess'
import { finishHotelReturn } from '../hotel/accountHandoff'
import { bounded } from '../hotel/lineAccount'
import { ENGLISH_ORIGIN } from '../hotel/lineEntry'
import Icon from '../ui/Icon'
import CoachLesson from './CoachLesson'
import CoachContent from './CoachContent'
import { coachLineEntryUrl } from './lineEntry'
import '../hotel/hotel.css'
import '../hotel/hotel-content.css'
import '../padel/padel.css'
import './coach.css'

export default function CoachPage() {
  const [user, setUser] = useState<User | null>(null)
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState(() => new URLSearchParams(window.location.search).get('line_result') === 'new' ? 'Aucun compte. Choisissez « S’inscrire avec LINE ».' : '')
  const preview = import.meta.env.DEV && /^\/padel-coach\/preview(?:\/content)?\/?$/.test(window.location.pathname)
  const admin = user ? appDestination(user.id, '/admin') === 'admin' : false
  const content = (admin && /^\/padel-coach\/content\/?$/.test(window.location.pathname)) || (preview && /\/content\/?$/.test(window.location.pathname))
  const practicePath = preview ? '/padel-coach/preview' : '/padel-coach'
  useEffect(() => {
    document.title = 'Success · Padel Coach'
    let active = true
    const ticket = window.location.origin === ENGLISH_ORIGIN ? new URLSearchParams(window.location.hash.slice(1)).get('ticket') : null
    if (ticket) window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`)
    void bounded(() => finishHotelReturn(ticket)).then(value => { if (active) setUser(value) }, () => { if (active) setError('Connexion indisponible. Réessayez.') })
      .finally(() => { if (active) setBusy(false) })
    return () => { active = false }
  }, [])
  return <main className="hotel-shell padel-shell coach-shell" lang="fr">
    <header className="hotel-header"><a className="padel-brand" href={practicePath} aria-label="Success Padel Coach"><strong>SUCCESS</strong><span>PADEL COACH</span></a>
      {admin || preview ? <nav className="hotel-admin-nav" aria-label="Outils du coach">
        <a className="hotel-nav-icon" href={practicePath} aria-label="Pratique" aria-current={!content ? 'page' : undefined}><Icon name="play" /></a>
        <a className="hotel-content-link" href={`${practicePath}/content`} aria-current={content ? 'page' : undefined}>Contenu</a>
      </nav> : null}</header>
    {content ? <CoachContent /> : user || preview ? <>
      {preview ? <p className="padel-preview">APERÇU LOCAL</p> : null}
      <CoachLesson key={user?.id ?? 'local-preview'} userId={user?.id ?? 'local-preview'} />
    </> : <section className="hotel-welcome padel-login"><h1>Padel Coach</h1>
      <button className="hotel-line" disabled={busy} onClick={() => window.location.assign(coachLineEntryUrl(true))}>{busy ? 'Connexion…' : 'S’inscrire avec LINE'}</button>
      <button className="hotel-reveal" disabled={busy} onClick={() => window.location.assign(coachLineEntryUrl())}>Se connecter</button>
      {error ? <p role="alert">{error}</p> : null}
    </section>}
  </main>
}
