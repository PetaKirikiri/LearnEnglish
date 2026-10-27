import { useEffect, useRef, useState } from 'react'
import CartoonHorse from './CartoonHorse'
import RaceWorldTrack from './RaceWorldTrack'
import { laneColours } from './colours'
import type { RaceView } from './types'
import './raceHost.css'
import './raceHostView.css'
import './raceGameTheme.css'
import './raceVenue.css'

const identity = (text: string) => text
type Props = { translate?: (text:string)=>string; view: RaceView; qr: string; busy: boolean; disconnected: boolean; countdown: number; remaining: number; ready: boolean; finishTitle: string; onControl: (action: string) => void; onReset?: () => void }

export default function RaceHostView({ view, qr, busy, disconnected, countdown, remaining, ready, finishTitle, onControl, translate: t = identity }: Props) {
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
  if (view.phase === 'lobby') return <section className="race-joining" aria-label={t('Race lobby')}>
    <button className="race-close" aria-label={t('End race')} disabled={locked} onClick={() => onControl('finish')}>×</button>
    <h1>{t('Join the race')}</h1>
    {qr ? <img src={qr} alt={t('Scan to join this race')}/> : <p>{t('Connect the laptop to Wi-Fi to show the QR code.')}</p>}
    {view.joinUrl && <a href={view.joinUrl} target="_blank" rel="noreferrer">{t('Open player screen ↗')}</a>}
    <p className="race-joining-count">{view.players.length} / 10 {t('ready')}</p>
    <ul className="race-joining-names">{view.players.map(p => <li key={p.id}><i style={{ background: laneColours[p.lane] }}/>{p.name}</li>)}</ul>
    <button className="race-primary" disabled={locked || !view.players.length} onClick={() => onControl('start')}>{t('Start race →')}</button>
    <a className="race-host-admin" href="/english/race/admin">{t('Admin')}</a>
  </section>

  const status = countdown ? String(countdown) : view.phase === 'answering' ? `${remaining.toFixed(1)}s` : ''
  return <section data-finished={view.phase === 'finished'} className="race-fullscreen race-classroom-track" aria-label={t('Race track screen')}>
    <audio ref={audio} preload="auto"/>
    <header className="race-host-strip">
      <span className="race-round">{view.round + 1}</span>
      <span className="race-host-timer" role="timer">{status}</span>
      <div className="race-host-buttons">
        {audioUrl && view.phase === 'answering' && <button onClick={() => setSound(!sound)} aria-pressed={sound}>{sound ? t('Sound on') : t('Sound off')}</button>}
        {audioError && sound && view.phase === 'answering' && <button onClick={retryAudio}>{t('Retry audio')}</button>}
        {view.phase === 'answering' && <span className="race-answer-count">{view.players.filter(p => p.answered).length} / {view.players.length} {t('answered')}</span>}
        {view.phase === 'finished' ? <><a className="race-host-admin" href="/english/race/admin">{t('Admin')}</a><a className="race-primary race-next-race" href="/english/race/admin">{t('Next race →')}</a></> : <button className="race-close" aria-label={t('End race')} disabled={locked} onClick={() => onControl('finish')}>×</button>}
      </div>
      <h1 className="race-live-question" aria-live="polite">{view.phase === 'finished' ? finishTitle : view.question?.english}</h1>
    </header>
    <RaceWorldTrack players={view.players} finish={view.finish} running={running}
      renderHorse={player => <CartoonHorse lane={player.lane} speed={player.speed} streak={player.streak ?? 0} paused={!running || player.speed <= 0}/>}/>
  </section>
}
