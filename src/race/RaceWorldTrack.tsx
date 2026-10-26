import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import type { RacePlayer } from './types'
import { laneColours } from './colours'
import { worldCamera, WORLD_HORSE_WIDTH } from './worldCamera'
import './raceWorld.css'

type Props = { players: RacePlayer[]; finish: number; running: boolean; renderHorse: (player: RacePlayer) => ReactNode }

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
  const ticks = Array.from({ length: Math.floor(finish / camera.ruler) + 1 }, (_, i) => i * camera.ruler)
  return <section className="race-world-track" aria-label="Horse race with shared world camera">
    <div className="race-world-viewport" ref={viewport}>
      <div className="race-world-scene" data-scale={camera.scale} style={{ width: finish, height: camera.trackHeight, transform: `translate(${camera.x}px,${camera.y}px) scale(${camera.scale})` }}>
        <div className="race-world-field"/>
        {players.map((p, i) => <div className="race-world-lane" data-last={i === players.length - 1} key={p.id} style={{ top: p.lane * camera.laneHeight, height: camera.laneHeight }}/>) }
        {ticks.map(metres => <div className="race-world-post" key={metres} style={{ left: metres }}><span style={{ fontSize: 9 / camera.scale }}>{metres} m</span></div>)}
        <div className="race-world-start"/>
        <div className="race-world-finish" style={{ left: finish }}/>
        {players.map(p => <div className={`race-world-horse sprint-horse${running ? ' is-running' : ''}${(p.streak ?? 0) >= 3 ? ' is-on-fire' : ''}`} key={p.id} data-player={p.id} data-metres={p.metres} style={{ left: p.metres, top: (p.lane + .5) * camera.laneHeight, width: WORLD_HORSE_WIDTH, height: WORLD_HORSE_WIDTH / 1.5 }}>
          {running && p.speed >= 14 && <span className="sprint-wind" aria-hidden="true" style={{ animationDuration: `${6 / p.speed}s` }}><i/><i/><i/><i/></span>}
          {(p.streak ?? 0) >= 3 && <span className="sprint-fire-aura" aria-hidden="true"><i/><i/><i/></span>}
          <span className="sprint-horse-body">{renderHorse(p)}</span>
        </div>)}
      </div>
      {players.map(p => <span className="race-world-name" key={p.id} style={{ left: camera.screenX(p.metres), top: camera.screenY(p.lane) - WORLD_HORSE_WIDTH / 3 * camera.scale - 4, '--rider-colour': laneColours[p.lane] } as CSSProperties}><i/>{p.name}{p.metres === leader && leader > 0 && <b aria-label="Leading">♛</b>}</span>)}
      <div className="race-world-scale"><span>{camera.ruler} m</span><i style={{ width: camera.ruler * camera.scale }}/></div>
    </div>
  </section>
}
