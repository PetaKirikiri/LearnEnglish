import { useCallback, useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { Horse } from './RaceTrack'
import RaceHostView from './RaceHostView'
import { laneColours } from './colours'
import type { RaceView } from './types'
import { HOST_KEY, raceRequest as request, savedRace as saved, useRaceConnection } from './connection'
import { movingPlayers } from './motion'
import { WINDOW_MS } from './rules'
import './race.css'
import './racePremium.css'

function randomToken() { return Array.from(crypto.getRandomValues(new Uint8Array(24)), n => n.toString(16).padStart(2, '0')).join('') }

export default function RacePage() {
  const roomId = location.pathname.match(/\/join\/([A-F0-9]{10})$/)?.[1]
  const participant = location.pathname.includes('/join/')
  const key = participant ? `english-race:player:${roomId}` : HOST_KEY
  const [name, setName] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false)
  const [qr, setQr] = useState(''), [pendingChoice, setPendingChoice] = useState<number | null>(null)
  const controlLock = useRef(false), answerLock = useRef(false)
  const resetAnswer = useCallback(() => {
    answerLock.current = false; setPendingChoice(null); setError('')
  }, [])
  const { credentials, view, now, connection, sync, remember, forget, currentRound } = useRaceConnection(key, resetAnswer)
  useEffect(() => { let active = true; if (view?.joinUrl) void QRCode.toDataURL(view.joinUrl, { width: 288, margin: 1, color: { dark: '#243f34', light: '#ffffff' } }).then(data => { if (active) setQr(data) }); return () => { active = false } }, [view?.joinUrl])
  async function join(event: React.FormEvent) {
    event.preventDefault(); if (busy || !roomId) return
    setBusy(true); setError('')
    const credential = saved(key) ?? { room: roomId, token: randomToken() }
    localStorage.setItem(key, JSON.stringify(credential))
    try { const next = await request<RaceView>('join', credential, { name }); remember(credential); sync(next) } catch (e) { setError((e as Error).message) } finally { setBusy(false) }
  }
  async function control(action: string) {
    if (!credentials || !view || controlLock.current) return
    controlLock.current = true; setBusy(true); setError('')
    try { sync(await request<RaceView>('control', credentials, { action, round: view.round, run: view.run })) } catch (e) { setError((e as Error).message) } finally { controlLock.current = false; setBusy(false) }
  }
  async function choose(choice: number) {
    if (!credentials || !view || answerLock.current) return
    const submittedRound = `${view.id}:${view.run}:${view.round}`
    answerLock.current = true; setPendingChoice(choice); setError('')
    try { sync(await request<RaceView>('answer', credentials, { choice, round: view.round, run: view.run })) }
    catch (e) { if (currentRound.current === submittedRound) setError((e as Error).message) }
  }
  async function retryAnswer() { if (pendingChoice === null) return; answerLock.current = false; await choose(pendingChoice) }
  function reset() { forget(); setError('') }
  const finished = view?.phase === 'finished'
  const ready = view?.phase === 'answering' && now >= view.opensAt && now <= view.closesAt
  const countdown = view?.phase === 'answering' && now < view.opensAt ? Math.ceil((view.opensAt - now) / 1000) : 0
  const remaining = view ? Math.max(0, (view.closesAt - now) / 1000) : 0
  const displayPlayers = view ? movingPlayers(view, now) : []
  const me = displayPlayers.find(p => p.id === view?.me?.id)
  const ranked = [...(view?.players ?? [])].sort((a, b) => b.metres - a.metres)
  const winners = view?.phase === 'finished' ? ranked.filter(p => p.metres === ranked[0]?.metres) : []
  const finishTitle = !winners.length ? 'Race finished' : winners.length > 1 ? 'It’s a tie!' : `${winners[0].name} wins!`
  const back = '/english/preview/learning?view=document&lesson=9a1254a8-f3d7-4b85-a312-337ffd4df090'
  return <main className={`classroom-race ${participant ? 'race-phone' : `race-host${view ? ' race-session' : ''}`}`}>
    {(participant || !view) && <header className="race-header"><a href={back} className="race-brand"><img src="/images/fimo/success-wolf-grey-clay.png" alt=""/><span>ENGLISH <strong>SUCCESS</strong></span></a><span className="race-kicker">Class 1 · Race day</span>{me && <strong>{me.name}</strong>}</header>}
    {(error || connection) && <div role="alert" className="race-error">{error || connection}{participant && pendingChoice !== null && view?.me?.choice === undefined && <button onClick={() => void retryAnswer()}>Retry answer</button>}{connection && <button onClick={reset}>{participant ? 'Rejoin' : 'New race'}</button>}</div>}
    {!credentials || (participant && view && !view.me) ? <section className="race-entry">
      <Horse/><h1>{participant ? 'What is your name?' : 'Race day'}</h1>
      {participant ? <form onSubmit={join}><input autoComplete="given-name" aria-label="Your name" placeholder="Your name" value={name} maxLength={24} onChange={e => setName(e.target.value)} required/><button className="race-primary" disabled={busy || !roomId}>Join race →</button></form> : <a className="race-primary" href="/english/race/admin">Open race settings →</a>}
    </section> : !view ? <p className="race-loading" role="status">Connecting to the race…</p> : participant ? <>
      <section className={`race-player-status${ready ? ' is-racing' : ''}`}><Horse colour={laneColours[me?.lane ?? 0]} running={!!ready && !connection} speed={me?.speed}/><div><strong>{Math.floor(me?.metres ?? 0)}<small> m</small></strong><span>{view.phase === 'lobby' ? `Lane ${(me?.lane ?? 0) + 1}` : `${((me?.speed ?? 0) * 3.6).toFixed(0)} km/h`}</span></div></section>
      <section className="race-phone-question race-phone-round" aria-live="polite">
        {view.phase === 'lobby' ? <h1>You’re in!</h1> : <span className="race-round">{view.round + 1}</span>}
        {countdown > 0 && <strong className="race-phone-countdown">{countdown}</strong>}
        {finished && <h1>{finishTitle}</h1>}
        {view.phase === 'answering' && !countdown && <progress max={WINDOW_MS / 1000} value={remaining} aria-label="Time remaining"/>}
      </section>
      {view.question && !finished && <div className="race-answers">{view.question.choices.map((choice, i) => <button key={`${view.round}:${i}`} className={(view.me?.choice ?? pendingChoice) === i ? 'is-picked' : ''} aria-pressed={(view.me?.choice ?? pendingChoice) === i} disabled={!ready || !!connection || view.me?.choice !== undefined || pendingChoice !== null} onClick={() => void choose(i)}><span lang={/[ก-๙]/.test(choice) ? 'th' : 'en'}>{choice}</span><b>{i + 1}</b></button>)}</div>}
      {finished && <ol className="race-phone-ranking">{ranked.map(p => <li key={p.id}><span>{p.name}</span><strong>{Math.floor(p.metres)} m</strong></li>)}</ol>}
    </> : <RaceHostView view={{...view,players:displayPlayers}} qr={qr} busy={busy} disconnected={!!connection} countdown={countdown} remaining={remaining} ready={!!ready} finishTitle={finishTitle} onControl={action => void control(action)} onReset={reset}/>}
  </main>
}
