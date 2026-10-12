import { useEffect, useRef, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import QRCode from 'qrcode'
import { speakEnglish, stopEnglishSpeech } from '../learning/speech'
import { loadProgress, nextQuestion, recordAnswer, skills, supportOpacity, type HotelQuestion } from './course'
import './hotel.css'
import { ENGLISH_ORIGIN, hotelAccountUrl, hotelLineEntryUrl, isHotelLineEntry } from './lineEntry'
import { finishHotelReturn } from './accountHandoff'
import { bounded, resolveLineAccount } from './lineAccount'

let recognition: ReturnType<typeof resolveLineAccount> | undefined
function recognise() {
  recognition ??= resolveLineAccount().finally(() => { recognition = undefined })
  return recognition
}

export default function HotelPage() {
  const [user, setUser] = useState<User | null>(null)
  const [busy, setBusy] = useState(() => isHotelLineEntry(window.location.search) && window.location.origin === ENGLISH_ORIGIN)
  const [error, setError] = useState('')
  const [guest, setGuest] = useState(false)
  const [qr, setQr] = useState('')
  const [entryUrl] = useState(() => {
    // This ID makes a saved signup link distinct, not an account credential.
    const entry = hotelLineEntryUrl()
    if (!entry) return null
    const url = new URL(entry)
    url.searchParams.set('request', crypto.randomUUID())
    return url.href
  })
  const callback = isHotelLineEntry(window.location.search) && window.location.origin === ENGLISH_ORIGIN
  async function signIn(create = false) {
    if (busy) return
    if (!entryUrl) return
    if (!callback) { window.location.assign(entryUrl); return }
    setBusy(true); setError('')
    try {
      const result = await resolveLineAccount(create)
      if (result.kind === 'member') window.location.replace(result.url)
      else if (result.kind === 'guest') setGuest(true)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Please try again.') }
    finally { setBusy(false) }
  }
  useEffect(() => {
    if (!entryUrl) return
    let active = true
    void QRCode.toDataURL(entryUrl, { width: 280, margin: 3, errorCorrectionLevel: 'H' })
      .then(value => { if (active) setQr(value) }, () => { if (active) setError('Could not load QR. Use Open LINE below.') })
    return () => { active = false }
  }, [entryUrl])
  useEffect(() => {
    let active = true
    const ticket = window.location.origin === ENGLISH_ORIGIN ? new URLSearchParams(window.location.hash.slice(1)).get('ticket') : null
    if (ticket) window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`)
    void (async () => {
      // Old saved links must leave the Padel host before doing any auth work.
      if (isHotelLineEntry(window.location.search) && window.location.origin !== ENGLISH_ORIGIN) {
        window.location.replace(hotelAccountUrl())
        return null
      }
      const account = await bounded(() => finishHotelReturn(ticket))
      if (account || ticket) return account
      if (callback) {
        const result = await recognise()
        if (!active) return null
        if (result.kind === 'member') window.location.replace(result.url)
        else if (result.kind === 'guest') setGuest(true)
        return null
      }
      if (active && entryUrl && /Line\//i.test(navigator.userAgent) && !sessionStorage.getItem('hotel:recognition-attempt')) {
        sessionStorage.setItem('hotel:recognition-attempt', '1')
        window.location.assign(entryUrl)
      }
      return account
    })().then(value => { if (active) setUser(value) }, cause => { if (active) setError(cause.message) })
      .finally(() => { if (active) setBusy(false) })
    return () => { active = false }
  }, [callback, entryUrl])
  return <main className="hotel-shell">
    <header className="hotel-header"><a href={isHotelLineEntry(window.location.search) ? hotelAccountUrl() : '/hotel'}>ENGLISH<span>SUCCESS</span></a><span>HOTEL EDITION</span></header>
    {import.meta.env.DEV && window.location.pathname === '/hotel/preview' ? <><p className="hotel-eyebrow" style={{ textAlign: 'center', marginTop: 16 }}>LOCAL PREVIEW · NOT SIGNED IN</p><HotelLesson userId="local-preview" /></> : user ? <HotelLesson key={user.id} userId={user.id} /> : <section className="hotel-welcome">
      <div className="hotel-monogram" aria-hidden="true">H</div><p className="hotel-eyebrow">MAKE YOURSELF AT HOME</p>
      <h1>English,<br /><em>by ear.</em></h1>
      <p>Listen. Choose. Get a little more confident.</p>
      {!callback && qr ? <div className="hotel-qr"><img src={qr} width="240" height="240" alt="Scan in LINE to sign in or create your account" /><a href={qr} download="english-success-line.png">Save QR</a><small>LINE → Add friends → QR → choose this image</small></div> : null}
      <button className="hotel-line" disabled={busy || !entryUrl} onClick={() => void signIn(guest)}>{busy ? 'Connecting…' : guest ? 'Create my account' : callback ? 'Retry LINE' : 'Open LINE'}</button>
      {!entryUrl ? <p role="status">English Success LINE sign-in is being configured.</p> : null}
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
