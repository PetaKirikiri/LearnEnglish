import { useEffect, useRef, useState } from 'react'
import CartoonHorse from './CartoonHorse'
import RaceWorldTrack from './RaceWorldTrack'
import { demoAt, demoRoster } from './demoRace'
import { FINISH } from './rules'
import { laneColours } from './colours'
import './race.css'
import './raceHost.css'
import './racePremium.css'
import './raceDemo.css'
import './raceGameTheme.css'
import './raceVenue.css'

export default function RaceDemoPage() {
  const [started, setStarted] = useState(false)
  const [paused, setPaused] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [sound, setSound] = useState(true)
  const [audioError, setAudioError] = useState(false)
  const audio = useRef<HTMLAudioElement>(null)
  const clock = useRef(0)
  const snapshot = demoAt(elapsed)
  const running = started && !paused && !snapshot.finished && !snapshot.countdown
  useEffect(() => {
    if (!started || paused || snapshot.finished) return
    let last = performance.now()
    const timer = window.setInterval(() => {
      const now = performance.now()
      clock.current += now - last
      last = now
      setElapsed(clock.current)
    }, 50)
    return () => window.clearInterval(timer)
  }, [started, paused, snapshot.finished])
  useEffect(() => {
    const player = audio.current
    if (!player || !running || !sound) return
    player.src = snapshot.question.audioUrl ?? ''
    void player.play().catch(() => setAudioError(true))
    return () => player.pause()
  }, [snapshot.round, snapshot.question.audioUrl, running, sound])
  function restart() { clock.current = 0; setElapsed(0); setPaused(false); setStarted(true); setAudioError(false) }
  const winner = snapshot.players.find(p => p.metres === FINISH)
  return <main className="classroom-race race-game-surface race-host race-session race-demo">
    <audio ref={audio} preload="auto"/>
    {!started ? <section className="demo-ready">
      <a href="/english/race/horses">← Horses</a><h1>Four horses. One race.</h1>
      <p>Where is the…? · Correct or wrong</p>
      <div className="demo-roster">{demoRoster.map((p, lane) => <article key={p.id}><i style={{ background: laneColours[lane] }}>{lane + 1}</i><h2>{p.name}</h2><p>{p.description}</p><CartoonHorse powered={lane === 0} paused/></article>)}</div>
      <button className="race-primary" onClick={restart}>Start test race →</button>
    </section> : <section className="race-fullscreen" data-finished={snapshot.finished}>
      <header className="race-host-strip">
        <span className="race-round">{snapshot.round + 1}</span>
        <span className="race-host-timer">{snapshot.finished ? '' : snapshot.countdown || `${snapshot.remaining.toFixed(1)}s`}</span>
        <div className="race-host-buttons">
          <button onClick={() => setSound(!sound)} aria-pressed={sound}>{sound ? 'Sound on' : 'Sound off'}</button>
          {!snapshot.finished && <button onClick={() => setPaused(!paused)}>{paused ? 'Resume' : 'Pause'}</button>}
          <button onClick={restart}>Replay</button>
        </div>
        <h1 className="race-live-question">{snapshot.finished ? `${winner?.name ?? 'Alex'} wins!` : snapshot.countdown ? 'Ready?' : snapshot.question.english}</h1>
        {audioError && <button className="demo-audio-error" onClick={() => { setAudioError(false); void audio.current?.play().catch(() => setAudioError(true)) }}>Audio unavailable · Retry</button>}
      </header>
      <RaceWorldTrack players={snapshot.players} finish={FINISH} running={running}
        renderHorse={player => <CartoonHorse lane={player.lane} speed={player.speed} streak={player.streak ?? 0} paused={!running || player.speed <= 0}/>}/>
    </section>}
  </main>
}
