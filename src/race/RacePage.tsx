import { useCallback, useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import RacePhoneAnswers from './RacePhoneAnswers'
import RacePhoneProgress from './RacePhoneProgress'
import { demoAt } from './demoRace'
import { FINISH } from './rules'
import './racePhoneThai.css'
import CartoonHorse from './CartoonHorse'
import RaceHostView from './RaceHostView'
import type { RaceView } from './types'
import { HOST_KEY, raceRequest as request, savedRace as saved, useRaceConnection } from './connection'
import { movingPlayers } from './motion'
import './race.css'
import './racePremium.css'
import './raceController.css'
import './raceGameTheme.css'

function randomToken() { return Array.from(crypto.getRandomValues(new Uint8Array(24)), n => n.toString(16).padStart(2, '0')).join('') }

function LiveRacePage() {
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
  const ranked = [...(view?.players ?? [])].sort((a, b) => b.metres - a.metres)
  const winners = view?.phase === 'finished' ? ranked.filter(p => p.metres === ranked[0]?.metres) : []
  const finishTitle = !winners.length ? 'Race finished' : winners.length > 1 ? 'It’s a tie!' : `${winners[0].name} wins!`
  const back = '/english/preview/learning?view=document&lesson=9a1254a8-f3d7-4b85-a312-337ffd4df090'
  return <main lang={participant ? 'th' : 'en'} className={`classroom-race race-game-surface ${participant ? 'race-phone' : `race-host${view ? ' race-session' : ''}`}`}>
    {(!participant && !view) && <header className="race-header"><a href={back} className="race-brand"><img src="/brand/englishsuccess-cap.svg" alt=""/><span>ENGLISH <strong>SUCCESS</strong></span></a><span className="race-kicker">Class 1 · Race day</span></header>}
    {(error || connection) && <div role="alert" className="race-error">{participant ? 'เชื่อมต่อไม่สำเร็จ กรุณาลองอีกครั้ง' : error || connection}{participant && pendingChoice !== null && view?.me?.choice === undefined && <button onClick={() => void retryAnswer()}>ส่งคำตอบอีกครั้ง</button>}{connection && <button onClick={reset}>{participant ? 'เข้าร่วมอีกครั้ง' : 'New race'}</button>}</div>}
    {!credentials || (participant && view && !view.me) ? <section className="race-entry">
      <CartoonHorse paused/><h1>{participant ? 'คุณชื่ออะไร?' : 'Race day'}</h1>
      {participant ? <form onSubmit={join}><input autoComplete="given-name" aria-label="ชื่อของคุณ" placeholder="ชื่อของคุณ" value={name} maxLength={24} onChange={e => setName(e.target.value)} required/><button className="race-primary" disabled={busy || !roomId}>เข้าร่วมแข่ง →</button></form> : <a className="race-primary" href="/english/race/admin">Open race settings →</a>}
    </section> : !view ? <p className="race-loading" role="status">{participant ? 'กำลังเชื่อมต่อ…' : 'Connecting to the race…'}</p> : participant ? <div className="controller-shell" data-racers={view.players.length} data-density={view.players.length > 7 ? 'dense' : view.players.length > 4 ? 'compact' : 'normal'}>
      <RacePhoneProgress players={displayPlayers} finish={view.finish} me={view.me?.id}/>
      <section className="race-phone-question race-phone-round" aria-live="polite">
        {view.phase === 'lobby' ? <h1>เข้าร่วมแล้ว รอครูเริ่มแข่ง</h1> : <span className="race-round">ข้อ {view.round + 1}</span>}
        {countdown > 0 && <strong className="race-phone-countdown">{countdown}</strong>}
        {finished && <h1>{!winners.length ? 'จบการแข่งขัน' : winners.length > 1 ? 'เสมอกัน!' : `${winners[0].name} ชนะ!`}</h1>}
        {view.phase === 'answering' && !countdown && <span className="controller-time" aria-label="เวลาที่เหลือ">◷ {Math.ceil(remaining)} วินาที</span>}
      </section>
      {view.phase === 'answering' && !countdown && view.question?.english && <h1 className="controller-question" lang="en" aria-live="polite">{view.question.english}</h1>}
      {view.question && !finished && <RacePhoneAnswers choices={view.question.choices} picked={view.me?.choice ?? pendingChoice} disabled={!ready || !!connection || view.me?.choice !== undefined || pendingChoice !== null} onChoose={i => void choose(i)}/>}
      {!finished && <p className="controller-feedback" role="status">{view.me?.choice !== undefined ? 'ส่งคำตอบแล้ว · รอข้อถัดไป' : pendingChoice !== null ? 'กำลังส่งคำตอบ…' : ''}</p>}
      {finished && <ol className="race-phone-ranking">{ranked.map(p => <li key={p.id}><span>{p.name}</span><strong>{Math.floor(p.metres)} เมตร</strong></li>)}</ol>}
    </div> : <RaceHostView view={{...view,players:displayPlayers}} qr={qr} busy={busy} disconnected={!!connection} countdown={countdown} remaining={remaining} ready={!!ready} finishTitle={finishTitle} onControl={action => void control(action)} onReset={reset}/>}
  </main>
}

function PhonePreview() {
  const params = new URLSearchParams(location.search)
  const meaning = params.get('mode') === 'meaning'
  const playerCount = Math.min(10, Math.max(4, Number(params.get('players')) || 4))
  const [picked, setPicked] = useState<number | null>(null)
  const [round, setRound] = useState(1)
  const [raceTime, setRaceTime] = useState(60_000)
  const race = demoAt(raceTime)
  const previewPlayers = [...race.players, ...['Fifa','Peta','Mali','Nok','Bia','May'].slice(0,playerCount-4).map((name,index)=>({
    ...race.players[index%4],id:`preview-${index}`,name,lane:index+4,metres:race.players[index%4].metres*(.9-index*.04),
  }))]
  useEffect(()=>{const timer=window.setInterval(()=>setRaceTime(time=>race.finished ? 0 : time+100),100);return()=>window.clearInterval(timer)},[race.finished])
  return <main lang="th" className="classroom-race race-game-surface race-phone race-phone-preview"><div className="controller-shell" data-racers={previewPlayers.length} data-density={previewPlayers.length > 7 ? 'dense' : previewPlayers.length > 4 ? 'compact' : 'normal'}>
    <RacePhoneProgress players={previewPlayers} finish={FINISH} me="chai"/>
    <section className="race-phone-question race-phone-round"><span className="race-round">ข้อ {round}</span></section>
    <h1 className="controller-question" lang="en">Where is the hotel?</h1>
    <RacePhoneAnswers choices={meaning ? ['โรงแรมอยู่ที่ไหน','โรงแรมราคาเท่าไหร่'] : ['Correct','Wrong']} picked={picked} disabled={picked !== null} onChoose={setPicked}/>
    <div className="controller-feedback" aria-live="polite">{picked !== null && <><span>ส่งคำตอบแล้ว</span><button onClick={() => {setPicked(null);setRound(round + 1)}}>ถัดไป →</button></>}</div>
  </div></main>
}
export default function RacePage() { return location.pathname === '/english/race/controller' ? <PhonePreview/> : <LiveRacePage/> }
