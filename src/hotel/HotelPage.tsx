import { useCallback, useEffect, useRef, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { speakEnglish, stopEnglishSpeech } from '../learning/speech'
import { isSkillComplete, loadProgress, nextQuestion, recordAnswer, skills, supportOpacity, type HotelQuestion } from './course'
import './hotel.css'
import { ENGLISH_ORIGIN, hotelAccountUrl, hotelLineEntryUrl, isHotelLineEntry } from './lineEntry'
import { finishHotelReturn } from './accountHandoff'
import { bounded } from './lineAccount'
import { appDestination } from '../auth/appAccess'
import HotelContentPage from './HotelContentPage'
import HotelScoreboard from './HotelScoreboard'
import { joinHotel, queueHotelAnswer, syncHotelAnswers } from './scoring'
import Icon from '../ui/Icon'

export default function HotelPage() {
  const [user, setUser] = useState<User | null>(null)
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState(() => new URLSearchParams(window.location.search).get('line_result') === 'new' ? 'No account yet. Tap Sign up to create one.' : '')
  const entryUrl = hotelLineEntryUrl()
  const isAdmin = user ? appDestination(user.id, '/admin') === 'admin' : false
  const showContent = isAdmin && /^\/hotel\/content\/?$/.test(window.location.pathname)
  const showScores = isAdmin && /^\/hotel\/scoreboard\/?$/.test(window.location.pathname)
  function signIn(create = false) {
    if (busy) return
    if (!entryUrl) return
    window.location.assign(hotelLineEntryUrl(create)!)
  }
  useEffect(() => {
    let active = true
    const ticket = window.location.origin === ENGLISH_ORIGIN ? new URLSearchParams(window.location.hash.slice(1)).get('ticket') : null
    if (ticket) window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`)
    // LINE approval finishes at the existing registered callback. This page
    // only redeems its one-use ticket into an EnglishSuccess browser session.
    void bounded(() => finishHotelReturn(ticket)).then(value => { if (active) setUser(value) }, cause => { if (active) setError(cause.message) })
      .finally(() => { if (active) setBusy(false) })
    return () => { active = false }
  }, [])
  return <main className="hotel-shell">
    <header className="hotel-header">
      <a href={isHotelLineEntry(window.location.search) ? hotelAccountUrl() : '/hotel'}>ENGLISH<span>SUCCESS</span></a>
      {isAdmin ? <nav className="hotel-admin-nav" aria-label="Hotel tools">
        <a className="hotel-nav-icon" aria-label="Practice" title="Practice" aria-current={!showContent && !showScores ? 'page' : undefined} href="/hotel"><Icon name="play" /></a>
        <a className="hotel-content-link" aria-current={showContent ? 'page' : undefined} href="/hotel/content">Content</a>
        <a className="hotel-nav-icon" aria-label="Scoreboard" title="Scoreboard" aria-current={showScores ? 'page' : undefined} href="/hotel/scoreboard"><Icon name="trophy" /></a>
      </nav> : <span>HOTEL EDITION</span>}
    </header>
    {showScores ? <HotelScoreboard /> : showContent ? <HotelContentPage /> : import.meta.env.DEV && window.location.pathname === '/hotel/preview' ? <><p className="hotel-eyebrow" style={{ textAlign: 'center', marginTop: 16 }}>LOCAL PREVIEW · NOT SIGNED IN</p><HotelLesson userId="local-preview" /></> : user ? <HotelLesson key={user.id} userId={user.id} /> : <section className="hotel-welcome">
      <div className="hotel-monogram" aria-hidden="true">H</div><p className="hotel-eyebrow">MAKE YOURSELF AT HOME</p>
      <h1>English,<br /><em>by ear.</em></h1>
      <p>Listen. Choose. Get a little more confident.</p>
      <button className="hotel-line" disabled={busy || !entryUrl} onClick={() => void signIn(true)}>{busy ? 'Connecting…' : 'Sign up with LINE'}</button>
      <button className="hotel-reveal" disabled={busy || !entryUrl} onClick={() => void signIn(false)}>Sign in</button>
      {!entryUrl ? <p role="status">English Success LINE sign-in is being configured.</p> : null}
      {error ? <p role="alert">{error}</p> : null}
    </section>}
  </main>
}

export function HotelLesson({ userId }: { userId: string }) {
  const [progress, setProgress] = useState(() => loadProgress(userId))
  const [question, setQuestion] = useState<HotelQuestion>(() => nextQuestion(progress))
  const firstQuestion = useRef(question)
  const [flipped, setFlipped] = useState(() => Math.random() < 0.5)
  const [selected, setSelected] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [audio, setAudio] = useState('')
  const [heard, setHeard] = useState(false)
  const [storageError, setStorageError] = useState(false)
  const [scoreError, setScoreError] = useState(false)
  const sync = useCallback(() => {
    if (userId === 'local-preview') return Promise.resolve()
    return joinHotel().then(() => syncHotelAnswers(userId))
      .then(() => setScoreError(false), () => setScoreError(true))
  }, [userId])
  const round = useRef(0)
  const answered = useRef(false)
  const play = useCallback((item: HotelQuestion) => {
    speakEnglish(item.english, import.meta.env.PROD ? `${ENGLISH_ORIGIN}${item.audioUrl}` : item.audioUrl, state => {
      if (state === 'ended') setHeard(true)
      setAudio(state === 'blocked' ? 'Tap to retry audio' : state === 'playing' ? 'Listening…' : 'Listen again')
    })
  }, [])
  useEffect(() => {
    play(firstQuestion.current)
    return () => stopEnglishSpeech()
  }, [play])
  useEffect(() => {
    void sync()
    const retry = () => { if (document.visibilityState === 'visible') void sync() }
    window.addEventListener('online', retry)
    document.addEventListener('visibilitychange', retry)
    return () => { window.removeEventListener('online', retry); document.removeEventListener('visibilitychange', retry) }
  }, [sync])
  function choose(index: number) {
    if (answered.current || !heard) return
    answered.current = true
    setSelected(index)
    const updated = recordAnswer(progress, question, index === question.correct, revealed)
    setProgress(updated)
    try { localStorage.setItem(`hotel:v1:${userId}`, JSON.stringify(updated)) } catch { setStorageError(true) }
    if (userId !== 'local-preview') {
      try { queueHotelAnswer(userId, question.id, index, revealed); void sync() }
      catch { setStorageError(true) }
    }
  }
  function next() {
    const item = nextQuestion(progress, question.id, ++round.current)
    setQuestion(item); setSelected(null); setRevealed(false); setHeard(false); setFlipped(Math.random() < 0.5); answered.current = false; play(item)
  }
  const order = flipped ? [1, 0] : [0, 1]
  // Freeze fading until the next question: feedback must not move the support.
  const support = selected === null && !revealed
  return <section className="hotel-lesson">
    <div className="hotel-journey" aria-label="Listening progress">{skills.map(skill => <span key={skill} className={isSkillComplete(progress, skill) ? 'learned' : ''} />)}</div>
      <button className="hotel-listen" onClick={() => play(question)} aria-label="Play English audio"><svg viewBox="0 0 64 64" aria-hidden="true"><path d="M12 27h10l12-10v30L22 37H12zM43 23q12 9 0 18M49 15q21 17 0 34" /></svg></button>
      <p className="hotel-audio" aria-live="polite">{audio}</p>
      <div className="hotel-answers">{order.map(index => <button key={`${question.id}-${index}`} disabled={selected !== null} className={`hotel-answer ${selected !== null && index === question.correct ? 'right' : selected === index ? 'wrong' : ''}`} onClick={() => choose(index)}>
        <span lang="th">{question.answers[index].map((segment, i) => <span key={i} style={{ opacity: support ? supportOpacity(progress, segment.skill) : 1 }}>{segment.text}</span>)}</span>
      </button>)}</div>
      {selected === null ? <button className="hotel-reveal" onClick={() => setRevealed(true)} disabled={revealed}>{revealed ? 'Words visible' : 'Show words'}</button> : <div className="hotel-feedback" aria-live="polite"><p>{question.english}</p><button className="hotel-primary" onClick={next}>Next →</button></div>}
      {storageError ? <p role="alert">Progress could not be saved on this device.</p> : null}
      {scoreError ? <p role="status">Scores not synced. <button className="hotel-reveal" onClick={() => void sync()}>Retry</button></p> : null}
  </section>
}
