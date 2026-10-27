import { t } from './language'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import QRCode from 'qrcode'
import { HOST_KEY, raceRequest, useRaceConnection } from '../race/connection'
import type { RaceCredential, RaceView } from '../race/types'
import { racePools } from '../race/pools'
import { movingPlayers } from '../race/motion'
import RaceHostView from '../race/RaceHostView'
import { WINDOW_MS, MAX_SPEED, speedFor } from '../race/rules'
import CartoonHorse from '../race/CartoonHorse'
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
  const [showJoin, setShowJoin] = useState(false)
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
    const pool = racePools.find(pool => pool.id === (stages?.[0] ?? 'class-one-judgement'))!
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
    try { sync(await raceRequest<RaceView>('prepare', credentials, {stage:view.stageId,run:view.run})) }
    catch(cause) { setError(cause instanceof Error ? cause.message : 'Could not prepare the race.') }
    finally { controlLock.current = false; setBusy(false) }
  }
  const pool = racePools.find(pool => pool.id === (view?.stageId ?? stages?.[0] ?? 'class-one-judgement'))
  const raceStages = stages ?? ['class-one-judgement', 'tonight-slots']
  const matchedRace = view ? raceStages.indexOf(view.stageId) + 1 : 0
  const activeRace = matchedRace > 0 && selectedRace <= raceStages.length ? matchedRace : selectedRace
  const shownRounds = stages?.length ?? roundCount
  async function selectRace(number: number) {
    if (!raceStages[number - 1]) {setSelectedRace(number);return}
    if (!credentials || !view || busy || connection || raceStages[number - 1] === view.stageId) return
    const next = racePools.find(pool => pool.id === raceStages[number - 1])
    if (!next || controlLock.current) return
    controlLock.current=true;setBusy(true);setError('')
    try { sync(await raceRequest<RaceView>('prepare', credentials, {stage:next.id,run:view.run}));setSelectedRace(number) }
    catch(cause) {setError(cause instanceof Error ? cause.message : 'Could not prepare the race.')}
    finally {controlLock.current=false;setBusy(false)}
  }
  useEffect(() => {
    if (stages || !credentials || !view || view.phase !== 'lobby' || controlLock.current) return
    const replacement = view.stageId === 'where-is-the' ? 'class-one-judgement' : view.stageId === 'holiday-meaning' ? 'tonight-slots' : null
    if (!replacement) return
    controlLock.current = true
    void raceRequest<RaceView>('prepare', credentials, {stage:replacement, run:view.run})
      .then(sync).catch(cause=>setError(cause instanceof Error ? cause.message : 'Could not prepare the race.'))
      .finally(()=>{controlLock.current=false;setBusy(false)})
  }, [credentials, view, stages, sync])
  const judgement = pool?.kind === 'judgement'
  const configured = !!raceStages[activeRace - 1]
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
    <div className="cw-briefing" key={selectedRace}>
      <header className="cw-briefing-title">
        <div><h2>{configured ? t(judgement ? 'Correct or wrong' : 'Choose the meaning') : t('How to play')}</h2></div>
        <div className="cw-mission-timer"><strong>{WINDOW_MS / 1000}</strong><span>{t('seconds per question')}</span></div>
      </header>
      <div className="cw-visual-briefing">
        <div className="cw-controller-preview"><iframe key={`${selectedRace}:${judgement}`} src={`/english/race/controller${configured && judgement ? '' : '?mode=meaning'}`} title={t('Your phone')} loading="lazy"/></div>
        <span className="cw-visual-arrow" aria-hidden="true">→</span>
        <div className="cw-speed-examples" aria-label={t('Answer speed examples')}>
          {[{correct:true,ms:1000},{correct:true,ms:8000},{correct:false,ms:1000}].map((example,index)=>{
            const speed = speedFor(example.correct,example.ms)
            return <div className="cw-speed-example" key={index} aria-label={t(example.correct ? index===0 ? 'Fast correct answer' : 'Slow correct answer' : 'Wrong answer')}>
              <div className="cw-example-answer"><img src={`/images/race/answer-${example.correct?'correct':'wrong'}-v2.png`} alt={t(example.correct?'Correct':'Wrong')}/><span>{example.ms/1000}<small>s</small></span></div>
              <div className="cw-example-lane" style={{'--travel': `${speed / MAX_SPEED * 100}%`} as CSSProperties}>
                <div className="cw-example-runner"><CartoonHorse speed={speed}/><span className="cw-example-speed">{(speed*3.6).toFixed(0)} <small>km/h</small></span></div>
              </div>
            </div>
          })}
        </div>
      </div>
    </div>

    <footer><div className="cw-race-roster"><strong>{view?.players.length ?? 0} / 10 {t('joined')}</strong><ul aria-live="polite">{view?.players.map(player=><li key={player.id}><i style={{background:laneColours[player.lane]}}/>{player.name}</li>)}</ul></div>
      <div className="cw-join-control"><button className="cw-join-toggle" aria-expanded={showJoin} onClick={()=>setShowJoin(value=>!value)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3h6v6H3zM15 3h6v6h-6zM3 15h6v6H3zM15 15h3v3h3v3h-6z" fill="none" stroke="currentColor" strokeWidth="2"/></svg>{t('Join · QR')}</button>
        {showJoin && <div className="cw-join-popover">{qr ? <img src={qr} alt={t('Scan to join the class race')}/> : <p role="status">{failure?t('Race unavailable'):t('Opening the room…')}</p>}<strong>{t('สแกนเพื่อเข้าร่วม')}</strong><p>{t('ใส่ชื่อ แล้วรอเริ่มแข่ง')}</p>{view?.joinUrl && <a href={view.joinUrl} target="_blank" rel="noreferrer">{t('Open on phone ↗')}</a>}</div>}
      </div>
      <button className="cw-race-go" disabled={!configured || busy || !!connection || !view?.players.length} onClick={()=>void control('start')}>{busy?t('Starting…'):t('Go →')}</button>
    </footer>
  </section>
}
