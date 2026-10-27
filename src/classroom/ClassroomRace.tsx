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

export default function ClassroomRace() {
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
  const alert = failure && <div className="cw-race-error" role="alert">{failure}<button onClick={() => {opening.current=false;setError('');forget()}}>Reconnect</button></div>
  if(view && view.phase !== 'lobby') {
    const players = movingPlayers(view,now)
    const leaders = [...players].sort((a,b)=>b.metres-a.metres)
    const winners = leaders.filter(player=>player.metres === leaders[0]?.metres)
    return createPortal(<div className="classroom-race cw-live-race race-host race-session">
      {alert}
      <RaceHostView view={{...view,players}} qr={qr} busy={busy} disconnected={!!connection}
        countdown={now < view.opensAt ? Math.ceil((view.opensAt-now)/1000) : 0}
        remaining={Math.max(0,(view.closesAt-now)/1000)} ready={view.phase==='answering' && now>=view.opensAt && now<=view.closesAt}
        finishTitle={winners.length>1?'It’s a tie!':winners[0]?`${winners[0].name} wins!`:'Race finished'}
        onControl={action=>void control(action)}/>
      {view.phase==='finished' && <button className="cw-race-again" disabled={busy} onClick={()=>void nextRace()}>Back to lobby</button>}
    </div>,document.body)
  }
  return <section className="cw-race-lobby" aria-label="Class race">
    <header><span>Lesson 01</span><h1 id="note-title">Race together</h1></header>
    {alert}
    <div className="cw-race-welcome">
      <div className="cw-race-brief"><span className="cw-race-eyebrow">{pool?.kind === 'judgement' ? 'รอบ 1 · ถูกหรือไม่ถูก' : 'Choose the meaning'}</span>
        <h2>{view?.stageId==='tonight-slots' || !view ? 'Where is the / my / your…?' : view.title}</h2>
        <p lang="th">ฟังคำถาม แล้วเลือกคำตอบบนมือถือ<br/>ตอบถูกและเร็ว ม้าจะวิ่งเร็วขึ้น</p>
        <p className="cw-race-content">{pool?.kind==='judgement' ? 'Listen for the complete sentence.' : 'Listen carefully to which person or thing the question means.'}</p>
      </div>
      <div className="cw-race-join">{qr ? <img src={qr} alt="Scan to join the class race"/> : <p role="status">{failure?'Race unavailable':'Opening the room…'}</p>}
        <h2 lang="th">สแกนเพื่อเข้าร่วม</h2><p lang="th">ใส่ชื่อ แล้วรอเริ่มแข่ง</p>
        {view?.joinUrl && <a href={view.joinUrl} target="_blank" rel="noreferrer">Open on phone ↗</a>}
      </div>
    </div>
    {view && guideModes.some(mode => mode.id === view.stageId) && <details className="cw-race-guide"><summary>ก่อนแข่ง · ดูหน้าจอและตัวอย่างคำถาม</summary>{view && <RaceWalkthrough key={`${view.stageId}:${view.questionIds?.join()}`} stageId={view.stageId} questionIds={view.questionIds}/>}</details>}
    <footer><div className="cw-race-roster"><strong>{view?.players.length ?? 0} / 10 joined</strong><ul aria-live="polite">{view?.players.map(player=><li key={player.id}><i style={{background:laneColours[player.lane]}}/>{player.name}</li>)}</ul></div>
      <button className="cw-race-go" disabled={busy || !!connection || !view?.players.length} onClick={()=>void control('start')}>{busy?'Starting…':'Go →'}</button>
    </footer>
  </section>
}
