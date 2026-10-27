import { useEffect, useRef, useState } from 'react'
import HorseMotion from './HorseMotion'
import RaceWorldTrack from './RaceWorldTrack'
import { laneColours } from './colours'
import { MIN_SPEED } from './rules'
import type { RaceView } from './types'
import './raceHost.css'
import './raceHostView.css'

type Props = { view: RaceView; qr: string; busy: boolean; disconnected: boolean; countdown: number; remaining: number; ready: boolean; finishTitle: string; onControl: (action: string) => void; onReset?: () => void }

export default function RaceHostView({ view, qr, busy, disconnected, countdown, remaining, ready, finishTitle, onControl }: Props) {
  const audio = useRef<HTMLAudioElement>(null)
  const [sound, setSound] = useState(true)
  const [audioError, setAudioError] = useState(false)
  const audioUrl = view.question?.audioUrl
  const running = view.phase === 'answering' && ready && !disconnected
  useEffect(() => {
    const player = audio.current
    if (!player || !running || !sound || !audioUrl) return
    let active = true
    player.src = audioUrl
    void player.play().then(() => { if (active) setAudioError(false) }).catch(() => { if (active) setAudioError(true) })
    return () => { active = false; player.pause() }
  }, [audioUrl, view.round, running, sound])
  function retryAudio() {
    const player = audio.current
    if (!player) return
    void player.play().then(() => setAudioError(false)).catch(() => setAudioError(true))
  }
  const locked = busy || disconnected
  if (view.phase === 'lobby') return <section className="race-joining" aria-label="Race lobby">
    <button className="race-close" aria-label="End race" disabled={locked} onClick={() => onControl('finish')}>×</button>
    <h1>Join the race</h1>
    {qr ? <img src={qr} alt="Scan to join this race"/> : <p>Connect the laptop to Wi-Fi to show the QR code.</p>}
    {view.joinUrl && <a href={view.joinUrl} target="_blank" rel="noreferrer">Open player screen ↗</a>}
    <p className="race-joining-count">{view.players.length} / 10 ready</p>
    <ul className="race-joining-names">{view.players.map(p => <li key={p.id}><i style={{ background: laneColours[p.lane] }}/>{p.name}</li>)}</ul>
    <button className="race-primary" disabled={locked || !view.players.length} onClick={() => onControl('start')}>Start race →</button>
    <a className="race-host-admin" href="/english/race/admin">Admin</a>
  </section>

  const status = countdown ? String(countdown) : view.phase === 'answering' ? `${remaining.toFixed(1)}s` : ''
  return <section className="race-fullscreen race-classroom-track" aria-label="Race track screen">
    <audio ref={audio} preload="auto"/>
    <header className="race-host-strip">
      <span className="race-round">{view.round + 1}</span>
      <span className="race-host-timer" role="timer">{status}</span>
      <div className="race-host-buttons">
        {audioUrl && view.phase === 'answering' && <button onClick={() => setSound(!sound)} aria-pressed={sound}>{sound ? 'Sound on' : 'Sound off'}</button>}
        {audioError && sound && view.phase === 'answering' && <button onClick={retryAudio}>Retry audio</button>}
        {view.phase === 'answering' && <span className="race-answer-count">{view.players.filter(p => p.answered).length} / {view.players.length} answered</span>}
        {view.phase === 'finished' ? <><a className="race-host-admin" href="/english/race/admin">Admin</a><a className="race-primary race-next-race" href="/english/race/admin">Next race →</a></> : <button className="race-close" aria-label="End race" disabled={locked} onClick={() => onControl('finish')}>×</button>}
      </div>
      <h1 className="race-live-question" aria-live="polite">{view.phase === 'finished' ? finishTitle : view.question?.english}</h1>
    </header>
    <RaceWorldTrack players={view.players} finish={view.finish} running={running}
      renderHorse={player => <HorseMotion mood={player.speed >= 14 ? 'confident' : player.speed > MIN_SPEED ? 'steady' : 'struggling'} speed={player.speed} onFire={(player.streak ?? 0) >= 5} charge={player.streak ?? 0} power={Math.max(1, (player.streak ?? 0) - 4)} paused={!running}/>}/>
  </section>
}
