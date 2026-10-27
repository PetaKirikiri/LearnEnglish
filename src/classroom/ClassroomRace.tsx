import { t } from './language'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import QRCode from 'qrcode'
import { HOST_KEY, raceRequest, useRaceConnection } from '../race/connection'
import type { RaceCredential, RaceView } from '../race/types'
import { racePools } from '../race/pools'
import { movingPlayers } from '../race/motion'
import RaceHostView from '../race/RaceHostView'
import { WINDOW_MS } from '../race/rules'
import { laneColours } from '../race/colours'
import '../race/race.css'
import '../race/racePremium.css'
import './classroomRace.css'

export default function ClassroomRace({ lessonId = 'lesson-1', stages }: { lessonId?: string; stages?: string[] }) {
  const lessonTwo = lessonId === 'lesson-2'
  const lessonLabel = lessonTwo ? 'Lesson 02' : 'Lesson 01'
  const roundsKey = `classroom-race-rounds:${lessonId}`
  const [roundCount, setRoundCount] = useState(() => {
    try { const count = Number(localStorage.getItem(roundsKey)); return Number.isInteger(count) && count >= 3 && count <= 30 ? count : 3 } catch { return 3 }
  })
  const [selectedRace, setSelectedRace] = useState(1)
  const raceRail = useRef<HTMLDivElement>(null)
  function addRace() {
    const count = roundCount + 1
    setRoundCount(count); setSelectedRace(count)
    try { localStorage.setItem(roundsKey, String(count)) } catch { /* Keep the current session usable. */ }
  }
  useEffect(() => {
    raceRail.current?.querySelector('[aria-pressed="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [selectedRace])
  const { credentials, view, now, connection, remember, sync, forget } = useRaceConnection(lessonTwo ? `${HOST_KEY}:lesson-2` : HOST_KEY)
  const [qr, setQr] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const opening = useRef(false)
  const controlLock = useRef(false)
  useEffect(() => {
    if (!view && /This race has ended|This race was not found/.test(connection)) {
      opening.current = false; forget()
    }
  }, [connection, view, forget])
  const onTrack = !!view && view.phase !== 'lobby'
  useEffect(() => {
    const shell = document.querySelector<HTMLElement>('.classroom')
    if (shell) shell.inert = onTrack
    return () => { if(shell) shell.inert = false }
  }, [onTrack])
  // Resume the same room, including students who have already joined.
  useEffect(() => {
    if (credentials || opening.current) return
    opening.current = true
    const pool = racePools.find(pool => pool.id === (stages?.[0] ?? 'where-is-the'))!
    void raceRequest<RaceCredential>('create', null, { stage: pool.id })
      .then(remember).catch(cause => setError(cause instanceof Error ? cause.message : 'Could not open the race.'))
  }, [credentials, remember, stages])
  useEffect(() => {
    let active = true
    if (view?.joinUrl) void QRCode.toDataURL(view.joinUrl, { width: 320, margin: 2, color: {dark:'#18385e',light:'#ffffff'} })
      .then(value => { if (active) setQr(value) }).catch(() => { if(active) setError('Could not show the QR code. Please retry.') })
    return () => { active = false }
  }, [view?.joinUrl])
  async function control(action: string) {
    if (!credentials || !view || controlLock.current) return
    controlLock.current = true; setBusy(true); setError('')
    try { sync(await raceRequest<RaceView>('control', credentials, {action,round:view.round,run:view.run})) }
    catch(cause) { setError(cause instanceof Error ? cause.message : 'Could not update the race.') }
    finally { controlLock.current = false; setBusy(false) }
  }
  async function nextRace() {
    if(!credentials || !view || controlLock.current) return
    controlLock.current = true; setBusy(true); setError('')
    try { sync(await raceRequest<RaceView>('prepare', credentials, {stage:view.stageId,questionIds:stages ? undefined : view.questionIds,run:view.run})) }
    catch(cause) { setError(cause instanceof Error ? cause.message : 'Could not prepare the race.') }
    finally { controlLock.current = false; setBusy(false) }
  }
  const pool = racePools.find(pool => pool.id === (view?.stageId ?? stages?.[0] ?? 'where-is-the'))
  const activeRace = stages && view ? stages.indexOf(view.stageId) + 1 : selectedRace
  const shownRounds = stages?.length ?? roundCount
  async function selectRace(number: number) {
    if (!stages) {setSelectedRace(number);return}
    if (!credentials || !view || busy || connection || number === activeRace) return
    const next = racePools.find(pool => pool.id === stages[number - 1])
    if (!next || controlLock.current) return
    controlLock.current=true;setBusy(true);setError('')
    try { sync(await raceRequest<RaceView>('prepare', credentials, {stage:next.id,run:view.run}));setSelectedRace(number) }
    catch(cause) {setError(cause instanceof Error ? cause.message : 'Could not prepare the race.')}
    finally {controlLock.current=false;setBusy(false)}
  }
  const judgement = pool?.kind === 'judgement'
  const configured = !!stages || selectedRace === 1
  const failure = error || connection
  const alert = failure && <div className="cw-race-error" role="alert">{t(failure)}<button onClick={() => {opening.current=false;setError('');forget()}}>{t('Reconnect')}</button></div>
  if(view && view.phase !== 'lobby') {
    const players = movingPlayers(view,now)
    const leaders = [...players].sort((a,b)=>b.metres-a.metres)
    const winners = leaders.filter(player=>player.metres === leaders[0]?.metres)
    return createPortal(<div className="classroom-race race-game-surface cw-live-race race-host race-session">
      {alert}
      <RaceHostView translate={t} view={{...view,players}} qr={qr} busy={busy} disconnected={!!connection}
        countdown={now < view.opensAt ? Math.ceil((view.opensAt-now)/1000) : 0}
        remaining={Math.max(0,(view.closesAt-now)/1000)} ready={view.phase==='answering' && now>=view.opensAt && now<=view.closesAt}
        finishTitle={winners.length>1?t('It’s a tie!'):winners[0]?`${winners[0].name} ${t('wins!')}`:t('Race finished')}
        onControl={action=>void control(action)}/>
      {view.phase==='finished' && <button className="cw-race-again" disabled={busy} onClick={()=>void nextRace()}>{t('Back to lobby')}</button>}
    </div>,document.body)
  }
  return <section className="cw-race-lobby" aria-label={t('Class race')}>
    <header><span>{t(lessonLabel)}</span><h1 id="note-title">{t('Race together')}</h1></header>
    {alert}
    <nav className="cw-rounds" aria-label={t('Lesson races')}>
      <button className="cw-round-arrow" aria-label={t('Previous race')} disabled={activeRace <= 1 || busy} onClick={() => void selectRace(activeRace - 1)}>‹</button>
      <div className="cw-round-rail" ref={raceRail}>
        {Array.from({length: shownRounds}, (_, index) => index + 1).map(number => <button key={number} className="cw-round-card" disabled={busy || !!connection} aria-pressed={activeRace === number} onClick={() => void selectRace(number)}>
          <svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M8 27V5m0 1c6-5 10 5 17 0v13c-7 5-11-5-17 0" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span>{t('Race')} <strong>{String(number).padStart(2,'0')}</strong></span>
        </button>)}
        {!stages && roundCount < 30 && <button className="cw-round-add" onClick={addRace} aria-label={t('Add race')}><span aria-hidden="true">+</span>{t('Add race')}</button>}
      </div>
      <button className="cw-round-arrow" aria-label={t('Next race')} disabled={activeRace === shownRounds || busy} onClick={() => void selectRace(activeRace + 1)}>›</button>
    </nav>
    <div className="cw-mission" key={selectedRace}>
      <div className="cw-mission-copy">
        <span className="cw-mission-number">{t('Race')} {String(activeRace).padStart(2,'0')}</span>
        <h2>{configured ? t(judgement ? 'Correct or wrong' : 'Choose the meaning') : t('How to play')}</h2>
        <p className="cw-mission-lead">{t(configured ? judgement ? 'Listen. Is the English sentence correct?' : 'Listen. Which Thai meaning matches?' : 'Listen to the question. Answer on your phone.')}</p>
        <div className="cw-mission-steps">
          <div><span className="cw-step-number">1</span><div><h3>{t('Listen')}</h3><p>{t('English on the main screen')}</p></div></div>
          <div><span className="cw-step-number">2</span><div><h3>{t('Choose')}</h3><p>{t(configured ? judgement ? 'Swipe left for wrong. Right for correct.' : 'Tap one of the two Thai answers.' : 'Follow the answer controls on your phone.')}</p></div></div>
          <div><span className="cw-step-number">3</span><div><h3>{t('Race ahead')}</h3><p>{t('Fast, correct answers build speed.')}</p></div></div>
        </div>
      </div>
      <div className="cw-mission-demo" aria-label={t('Answer controls')}>
        <div className="cw-demo-caption">{t('Your phone')}</div>
        <div className="cw-demo-phone">
          <div className="cw-demo-speaker" aria-hidden="true"></div>
          <div className="cw-demo-sound" aria-hidden="true"><span/><span/><span/><span/><span/></div>
          <div className="cw-demo-prompt">{t('Your answer')}</div>
          {configured && judgement ? <div className="cw-demo-judgement"><div><b>×</b><span>{t('Wrong')}</span><small>←</small></div><div><b>✓</b><span>{t('Correct')}</span><small>→</small></div></div> : <div className="cw-demo-choices"><div><b>A</b>{t('Meaning 1')}</div><div><b>B</b>{t('Meaning 2')}</div></div>}
          <div className="cw-demo-home" aria-hidden="true"/>
        </div>
        <div className="cw-mission-timer"><strong>{WINDOW_MS / 1000}</strong><span>{t('seconds per question')}</span></div>
      </div>
    </div>
    <footer><div className="cw-race-roster"><strong>{view?.players.length ?? 0} / 10 {t('joined')}</strong><ul aria-live="polite">{view?.players.map(player=><li key={player.id}><i style={{background:laneColours[player.lane]}}/>{player.name}</li>)}</ul></div>
      <details className="cw-join-control"><summary><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3h6v6H3zM15 3h6v6h-6zM3 15h6v6H3zM15 15h3v3h3v3h-6z" fill="none" stroke="currentColor" strokeWidth="2"/></svg>{t('Join · QR')}</summary>
        <div className="cw-join-popover">{qr ? <img src={qr} alt={t('Scan to join the class race')}/> : <p role="status">{failure?t('Race unavailable'):t('Opening the room…')}</p>}<strong>{t('สแกนเพื่อเข้าร่วม')}</strong><p>{t('ใส่ชื่อ แล้วรอเริ่มแข่ง')}</p>{view?.joinUrl && <a href={view.joinUrl} target="_blank" rel="noreferrer">{t('Open on phone ↗')}</a>}</div>
      </details>
      <button className="cw-race-go" disabled={(!stages && selectedRace !== 1) || busy || !!connection || !view?.players.length} onClick={()=>void control('start')}>{busy?t('Starting…'):t('Go →')}</button>
    </footer>
  </section>
}
