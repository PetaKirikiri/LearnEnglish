import { t, getLanguage } from './language'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import QRCode from 'qrcode'
import { HOST_KEY, raceRequest, useRaceConnection } from '../race/connection'
import type { RaceCredential, RaceView } from '../race/types'
import { racePools } from '../race/pools'
import { movingPlayers } from '../race/motion'
import RaceHostView from '../race/RaceHostView'
import RaceWalkthrough from '../race/RaceWalkthrough'
import { guideModes } from '../race/raceGuide'
import { laneColours } from '../race/colours'
import '../race/race.css'
import '../race/racePremium.css'
import './classroomRace.css'

export default function ClassroomRace({ lessonId = 'lesson-1' }: { lessonId?: string }) {
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
  const { credentials, view, now, connection, remember, sync, forget } = useRaceConnection(HOST_KEY)
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
    const pool = racePools.find(pool => pool.id === 'where-is-the')!
    void raceRequest<RaceCredential>('create', null, { stage: pool.id, questionIds: pool.questions.map(q => q.id) })
      .then(remember).catch(cause => setError(cause instanceof Error ? cause.message : 'Could not open the race.'))
  }, [credentials, remember])
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
    try { sync(await raceRequest<RaceView>('prepare', credentials, {stage:view.stageId,questionIds:view.questionIds,run:view.run})) }
    catch(cause) { setError(cause instanceof Error ? cause.message : 'Could not prepare the race.') }
    finally { controlLock.current = false; setBusy(false) }
  }
  const pool = racePools.find(pool => pool.id === view?.stageId)
  const failure = error || connection
  const alert = failure && <div className="cw-race-error" role="alert">{t(failure)}<button onClick={() => {opening.current=false;setError('');forget()}}>{t('Reconnect')}</button></div>
  if(view && view.phase !== 'lobby') {
    const players = movingPlayers(view,now)
    const leaders = [...players].sort((a,b)=>b.metres-a.metres)
    const winners = leaders.filter(player=>player.metres === leaders[0]?.metres)
    return createPortal(<div className="classroom-race cw-live-race race-host race-session">
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
    <header><span>{t('Lesson 01')}</span><h1 id="note-title">{t('Race together')}</h1></header>
    {alert}
    <nav className="cw-rounds" aria-label={t('Lesson races')}>
      <button className="cw-round-arrow" aria-label={t('Previous race')} disabled={selectedRace === 1} onClick={() => setSelectedRace(n => n - 1)}>‹</button>
      <div className="cw-round-rail" ref={raceRail}>
        {Array.from({length: roundCount}, (_, index) => index + 1).map(number => <button key={number} className="cw-round-card" aria-pressed={selectedRace === number} onClick={() => setSelectedRace(number)}>
          <svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M8 27V5m0 1c6-5 10 5 17 0v13c-7 5-11-5-17 0" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span>{t('Race')} <strong>{String(number).padStart(2,'0')}</strong></span>
        </button>)}
        {roundCount < 30 && <button className="cw-round-add" onClick={addRace} aria-label={t('Add race')}><span aria-hidden="true">+</span>{t('Add race')}</button>}
      </div>
      <button className="cw-round-arrow" aria-label={t('Next race')} disabled={selectedRace === roundCount} onClick={() => setSelectedRace(n => n + 1)}>›</button>
    </nav>
    <div className="cw-race-welcome" key={selectedRace}>
      {selectedRace !== 1 ? <div className="cw-race-brief cw-race-empty"><span className="cw-race-eyebrow">{t('Lesson 01')}</span><h2>{t('Race')} {String(selectedRace).padStart(2,'0')}</h2></div> : <>
      <div className="cw-race-brief"><span className="cw-race-eyebrow">{pool?.kind === 'judgement' ? t('Correct or wrong') : t('Choose the meaning')}</span>
        <h2>{view?.stageId==='tonight-slots' || !view ? 'Where is the / my / your…?' : view.title}</h2>
        <p>{t('ฟังคำถาม แล้วเลือกคำตอบบนมือถือ')}<br/>{t('ตอบถูกและเร็ว ม้าจะวิ่งเร็วขึ้น')}</p>
        <p className="cw-race-content">{pool?.kind==='judgement' ? t('Listen for the complete sentence.') : t('Listen carefully to which person or thing the question means.')}</p>
      </div>
      </>}
      <div className="cw-race-join">{qr ? <img src={qr} alt={t('Scan to join the class race')}/> : <p role="status">{failure?t('Race unavailable'):t('Opening the room…')}</p>}
        <h2>{t('สแกนเพื่อเข้าร่วม')}</h2><p>{t('ใส่ชื่อ แล้วรอเริ่มแข่ง')}</p>
        {view?.joinUrl && <a href={view.joinUrl} target="_blank" rel="noreferrer">{t('Open on phone ↗')}</a>}
      </div>
    </div>
    {selectedRace === 1 && view && guideModes.some(mode => mode.id === view.stageId) && <details className="cw-race-guide" open={location.hash === '#race-guide' || undefined}><summary>{t('ก่อนแข่ง · ดูหน้าจอและตัวอย่างคำถาม')}</summary>{view && <RaceWalkthrough translate={t} language={getLanguage()} key={`${view.stageId}:${view.questionIds?.join()}`} stageId={view.stageId} questionIds={view.questionIds}/>}</details>}
    <footer><div className="cw-race-roster"><strong>{view?.players.length ?? 0} / 10 {t('joined')}</strong><ul aria-live="polite">{view?.players.map(player=><li key={player.id}><i style={{background:laneColours[player.lane]}}/>{player.name}</li>)}</ul></div>
      <button className="cw-race-go" disabled={selectedRace !== 1 || busy || !!connection || !view?.players.length} onClick={()=>void control('start')}>{busy?t('Starting…'):t('Go →')}</button>
    </footer>
  </section>
}
