import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import type { RacePlayer } from './types'
import { laneColours } from './colours'
import { MAX_SPEED } from './rules'
import { worldCamera, WORLD_HORSE_WIDTH } from './worldCamera'
import './raceWorld.css'
import RaceVenue from './RaceVenue'
import './raceVenue.css'

type Props = { players: RacePlayer[]; finish: number; running: boolean; renderHorse: (player: RacePlayer) => ReactNode }

function HorseSpeed({ speed, targetSpeed, level, running }: { speed: number; targetSpeed: number; level: number; running: boolean }) {
  const [reading, setReading] = useState({ targetSpeed, delta: 0, change: 0 })
  if (reading.targetSpeed !== targetSpeed) setReading({ targetSpeed, delta: (targetSpeed - reading.targetSpeed) * 3.6, change: reading.change + 1 })
  return <span className="race-horse-speed"><strong>{level > 0 && <small className="race-power-level">⚡{level} </small>}{Math.round(speed * 3.6)} <small>km/h</small></strong>{running && reading.delta !== 0 && <em key={reading.change} className={reading.delta > 0 ? 'speed-up' : 'speed-down'}>{reading.delta > 0 ? '↑' : '↓'}<span className="race-speed-announcement">{reading.delta > 0 ? ' Faster' : ' Slower'}</span></em>}</span>
}

export default function RaceWorldTrack({ players, finish, running, renderHorse }: Props) {
  const viewport = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  useEffect(() => {
    const element = viewport.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }))
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  const camera = worldCamera(players, size.width || 1, size.height || 1, players.length)
  const leader = Math.max(0, ...players.map(p => p.metres))
  const markerStep = [200, 400, 800, 1600].find(step => step * camera.scale >= 100) ?? 1600
  const ticks = Array.from({ length: Math.ceil(finish / markerStep) - 1 }, (_, i) => (i + 1) * markerStep)
  return <section className="race-world-track" data-crowded={players.length > 6} data-finished={players.some(p => p.metres >= finish)} aria-label="Horse race with shared world camera">
    <div className="race-world-viewport" ref={viewport}>
      <RaceVenue/>
      {players.some(p => p.metres >= finish) && <div className="race-finish-confetti" aria-hidden="true">{Array.from({length:18},(_,i)=><i key={i} style={{left:`${i*5.8}%`,'--confetti-index':i,background:laneColours[i%laneColours.length]} as CSSProperties}/>)}</div>}
      <div className="race-world-scene" data-scale={camera.scale} style={{ '--world-pixel': `${1 / camera.scale}px`, width: finish, height: camera.trackHeight, transform: `translate(${camera.x}px,${camera.y}px) scale(${camera.scale})` } as CSSProperties}>
        <div className="race-world-field"/><div className="race-turf-motion" aria-hidden="true"/>
        {players.map((p, i) => <div className="race-world-lane" data-last={i === players.length - 1} key={p.id} style={{ top: p.lane * camera.laneHeight, height: camera.laneHeight }}/>) }
        {ticks.map(metres => <div className="race-course-marker" key={metres} style={{ left: metres, top: -18 / camera.scale, transform: `scale(${1 / camera.scale})` }}><span>{metres} m</span></div>)}
        <div className="race-world-rail is-top" aria-hidden="true"/><div className="race-world-rail is-bottom" aria-hidden="true"/>
        <div className="race-world-start"/><div className="race-course-sign is-start" style={{left:0,top:-35/camera.scale,transform:`translateX(-50%) scale(${1/camera.scale})`}}>START</div>
        <div className="race-world-finish" style={{ left: finish }}/><div className="race-course-sign is-finish" style={{left:finish,top:-40/camera.scale,transform:`translateX(-50%) scale(${1/camera.scale})`}}>FINISH<span aria-hidden="true">★</span></div>
        {players.map(p => <div className={`race-world-horse sprint-horse${running ? ' is-running' : ''}${(p.streak ?? 0) >= 5 ? ' is-on-fire' : ''}`} key={p.id} data-player={p.id} data-metres={p.metres} style={{ left: p.metres, top: (p.lane + .5) * camera.laneHeight, width: WORLD_HORSE_WIDTH, height: WORLD_HORSE_WIDTH / 1.8 }}>
          {running && p.speed >= MAX_SPEED - .25 && <span className="sprint-wind" aria-hidden="true" style={{ animationDuration: `${6 / p.speed}s` }}><i/><i/><i/><i/></span>}
          <span className="race-ground-shadow" aria-hidden="true"/><span className="sprint-horse-body">{renderHorse(p)}</span>
        </div>)}
      </div>
      {players.map(p => <span className="race-world-name" key={p.id} style={{ left: `clamp(80px, ${camera.screenX(p.metres)}px, calc(100% - 80px))`, top: Math.max(32, camera.screenY(p.lane) - WORLD_HORSE_WIDTH / 3.6 * camera.scale - 4), '--rider-colour': laneColours[p.lane] } as CSSProperties}><i>{p.lane + 1}</i><span className="race-rider-name">{p.name}</span><HorseSpeed running={running} speed={p.speed} targetSpeed={p.targetSpeed ?? p.speed} level={Math.max(0, (p.streak ?? 0) - 4)}/>{p.metres === leader && leader > 0 && <b aria-label="Leading"><svg className="race-leader-crown" viewBox="0 0 24 24" aria-hidden="true"><path d="m3 6 5 5 4-8 4 8 5-5-2 13H5Z" fill="#ffda39" stroke="#fff1a3" strokeWidth="1.5" strokeLinejoin="round"/><path d="M6 16h12" stroke="#d99513" strokeWidth="2" strokeLinecap="round"/></svg></b>}</span>)}

    </div>
  </section>
}
