import { useEffect, useRef, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import liff from '@line/liff'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { speakEnglish, stopEnglishSpeech } from '../learning/speech'
import { loadProgress, nextQuestion, recordAnswer, skills, supportOpacity, type HotelQuestion } from './course'
import './hotel.css'
import { ENGLISH_ORIGIN, PADEL_ORIGIN, SHARED_LINE_ID, hotelAccountUrl, hotelLineEntryUrl, isHotelLineEntry } from './lineEntry'
import { finishHotelReturn, prepareHotelReturn } from './accountHandoff'

let loginRequest: Promise<User | null> | undefined
function loginWithLine(): Promise<User | null> {
  loginRequest ??= (async () => {
    if (!isSupabaseConfigured) throw new Error('Account service is unavailable.')
    if (window.location.origin !== PADEL_ORIGIN && !isHotelLineEntry(window.location.search)) {
      window.location.assign(hotelAccountUrl())
      return null
    }
    if (window.location.origin === PADEL_ORIGIN) {
      window.location.assign(hotelLineEntryUrl())
      return null
    }
    if (!isHotelLineEntry(window.location.search) || window.location.origin === ENGLISH_ORIGIN || window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost') {
      window.location.assign(hotelLineEntryUrl())
      return null
    }
    await liff.init({ liffId: SHARED_LINE_ID, withLoginOnExternalBrowser: false })
    if (!liff.isLoggedIn()) {
      const redirect = new URL('/login', window.location.origin)
      redirect.search = new URLSearchParams({ app: 'englishsuccess', mode: 'hotel', line_login: '1' }).toString()
      liff.login({ redirectUri: redirect.href })
      return null
    }
    const token = liff.getIDToken()
    if (!token) throw new Error('Please sign in to LINE again.')
    const { data, error } = await supabase.functions.invoke('line-liff-auth', { body: { id_token: token, access_token: liff.getAccessToken() } })
    if (error || data?.error) throw new Error(error?.message ?? data.error)
    if (!data?.access_token || !data?.refresh_token) throw new Error('LINE did not return a login session.')
    // Finish on the canonical domain, using Padel's one-use ticket mechanism.
    // Do not persist a second account session on the legacy LIFF host.
    window.location.replace(await prepareHotelReturn(token))
    return null
  })().catch(error => { loginRequest = undefined; throw error })
  return loginRequest
}

export default function HotelPage() {
  const [user, setUser] = useState<User | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function signIn() {
    setBusy(true); setError('')
    try { setUser(await loginWithLine()) } catch (cause) { setError(cause instanceof Error ? cause.message : 'Please try again.') }
    finally { setBusy(false) }
  }
  useEffect(() => {
    let active = true
    const ticket = window.location.origin === PADEL_ORIGIN ? new URLSearchParams(window.location.hash.slice(1)).get('ticket') : null
    if (ticket) window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`)
    void (async () => {
      if (window.location.origin === PADEL_ORIGIN) {
        const account = await finishHotelReturn(ticket)
        if (account || ticket) return account
        if (/Line\//i.test(navigator.userAgent)) return loginWithLine()
        return null
      }
      if (isHotelLineEntry(window.location.search) || /Line\//i.test(navigator.userAgent)) return loginWithLine()
      // Reuse a server-validated existing EnglishSuccess/Padel account session.
      const { data: session } = await supabase.auth.getSession()
      if (!session.session) return null
      const { data, error } = await supabase.auth.getUser()
      return error ? null : data.user
    })().then(value => { if (active) setUser(value) }, cause => { if (active) setError(cause.message) })
    return () => { active = false }
  }, [])
  return <main className="hotel-shell">
    <header className="hotel-header"><a href={isHotelLineEntry(window.location.search) ? hotelAccountUrl() : '/hotel'}>ENGLISH<span>SUCCESS</span></a><span>HOTEL EDITION</span></header>
    {import.meta.env.DEV && window.location.pathname === '/hotel/preview' ? <><p className="hotel-eyebrow" style={{ textAlign: 'center', marginTop: 16 }}>LOCAL PREVIEW · NOT SIGNED IN</p><HotelLesson userId="local-preview" /></> : user ? <HotelLesson key={user.id} userId={user.id} /> : <section className="hotel-welcome">
      <div className="hotel-monogram" aria-hidden="true">H</div><p className="hotel-eyebrow">MAKE YOURSELF AT HOME</p>
      <h1>English,<br /><em>by ear.</em></h1>
      <p>Listen. Choose. Get a little more confident.</p>
      <button className="hotel-line" disabled={busy} onClick={() => void signIn()}>{busy ? 'Opening LINE…' : 'Continue with LINE'}</button>
      {error ? <p role="alert">{error}</p> : null}
    </section>}
  </main>
}

export function HotelLesson({ userId }: { userId: string }) {
  const [progress, setProgress] = useState(() => loadProgress(userId))
  const [question, setQuestion] = useState<HotelQuestion>(() => nextQuestion(progress))
  const [started, setStarted] = useState(false)
  const [flipped, setFlipped] = useState(() => Math.random() < 0.5)
  const [selected, setSelected] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [audio, setAudio] = useState('')
  const [heard, setHeard] = useState(false)
  const [storageError, setStorageError] = useState(false)
  const round = useRef(0)
  const answered = useRef(false)
  useEffect(() => () => stopEnglishSpeech(), [])
  function play(item = question) {
    speakEnglish(item.english, import.meta.env.PROD ? `${ENGLISH_ORIGIN}${item.audioUrl}` : item.audioUrl, state => {
      if (state === 'ended') setHeard(true)
      setAudio(state === 'blocked' ? 'Tap to retry audio' : state === 'playing' ? 'Listening…' : 'Listen again')
    })
  }
  function choose(index: number) {
    if (answered.current || !heard) return
    answered.current = true
    setSelected(index)
    const updated = recordAnswer(progress, question, index === question.correct, revealed)
    setProgress(updated)
    try { localStorage.setItem(`hotel:v1:${userId}`, JSON.stringify(updated)) } catch { setStorageError(true) }
  }
  function next() {
    const item = nextQuestion(progress, question.id, ++round.current)
    setQuestion(item); setSelected(null); setRevealed(false); setHeard(false); setFlipped(Math.random() < 0.5); answered.current = false; play(item)
  }
  const order = flipped ? [1, 0] : [0, 1]
  // Freeze fading until the next question: feedback must not move the support.
  const support = selected === null && !revealed
  return <section className="hotel-lesson">
    <div className="hotel-journey" aria-label="Listening progress">{skills.map(skill => <span key={skill} className={(progress[skill]?.seen.length ?? 0) >= 4 ? 'learned' : ''} />)}</div>
    {!started ? <div className="hotel-start"><p className="hotel-eyebrow">YOUR LISTENING ROOM</p><h1>A little English.<br /><em>Every day.</em></h1><button className="hotel-primary" onClick={() => { setStarted(true); play() }}>Start listening →</button><small>Progress stays on this device.</small></div> : <>
      <button className="hotel-listen" onClick={() => play()} aria-label="Play English audio"><svg viewBox="0 0 64 64" aria-hidden="true"><path d="M12 27h10l12-10v30L22 37H12zM43 23q12 9 0 18M49 15q21 17 0 34" /></svg></button>
      <p className="hotel-audio" aria-live="polite">{audio}</p>
      <div className="hotel-answers">{order.map(index => <button key={`${question.id}-${index}`} disabled={selected !== null} className={`hotel-answer ${selected !== null && index === question.correct ? 'right' : selected === index ? 'wrong' : ''}`} onClick={() => choose(index)}>
        <span lang="th">{question.answers[index].map((segment, i) => <span key={i} style={{ opacity: support ? supportOpacity(progress, segment.skill) : 1 }}>{segment.text}</span>)}</span>
      </button>)}</div>
      {selected === null ? <button className="hotel-reveal" onClick={() => setRevealed(true)} disabled={revealed}>{revealed ? 'Words visible' : 'Show words'}</button> : <div className="hotel-feedback" aria-live="polite"><p>{question.english}</p><button className="hotel-primary" onClick={next}>Next →</button></div>}
      {storageError ? <p role="alert">Progress could not be saved on this device.</p> : null}
    </>}
  </section>
}
