import { memo, type ReactNode } from 'react'
import type { RacePlayer } from './types'
import { laneColours } from './colours'
import { coursePercent } from './trackGeometry'
import HorseMotion from './HorseMotion'

export function Horse({ colour = '#f36f4f', running = false, speed = 8 }: { colour?: string; running?: boolean; speed?: number }) {
  if (running) return <span className="race-horse-sprite" aria-hidden="true" style={{animationDuration:`${6 / speed}s`}}><i style={{background:colour}}/></span>
  return <svg viewBox="0 0 1536 1024" aria-hidden="true" className="race-horse-art">
    <image href="/images/race/clay-horse.png" width="1536" height="1024"/>
    <circle cx="773" cy="418" r="68" fill={colour} stroke="#fff4dc" strokeWidth="15"/>
    <path d="m749 418 17 18 32-36" fill="none" stroke="#fff4dc" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
}
function RaceTrack({ players, finish, running = false, laneCount = 10, minimal = false, tracking = false, renderHorse }: { players: RacePlayer[]; finish: number; running?: boolean; laneCount?: number; minimal?: boolean; tracking?: boolean; renderHorse?: (player: RacePlayer) => ReactNode }) {
  const progress = (metres: number) => coursePercent(metres, finish)
  const leader = Math.max(0, ...players.map(p => p.metres))
  const leadProgress = progress(leader)
  return <div className={`race-sprint${running ? ' is-live' : ''}${minimal ? ' race-sprint-minimal' : ''}${tracking ? ' race-sprint-tracking' : ''}`} aria-label={laneCount === 10 ? 'Ten-lane horse race' : `${laneCount}-lane horse race`} style={{ gridTemplateRows: `${tracking ? '52px ' : ''}${minimal ? '' : '30px '}repeat(${laneCount},minmax(0,1fr))` }}>
    {tracking && <div className="sprint-course-overview" aria-label={`Full race: ${finish.toLocaleString()} metres`}>
      <span>Start</span>
      <div className="sprint-course-map">
        <div className="sprint-course-rail" role="progressbar" aria-label="Race completed by the leader" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(leadProgress)}><i style={{ width: `${leadProgress}%` }}/></div>
        <span className="sprint-course-half">Halfway</span>
        {players.map(player => <i key={player.id} className="sprint-course-rider" title={player.name} aria-label={player.name} style={{ left: `${progress(player.metres)}%`, top: `${5 + player.lane % laneCount * 22 / Math.max(1, laneCount - 1)}px`, background: laneColours[player.lane] }}/>) }
      </div>
      <span className="sprint-course-end"><i aria-hidden="true"/>Finish <small>{finish.toLocaleString()} m</small></span>
    </div>}
    {!minimal && <div className="sprint-distance"><span/><div><span>START</span><span>{finish} m · FINISH</span></div></div>}
    {Array.from({ length: laneCount }, (_, lane) => {
      const player = players.find(p => p.lane === lane)
      const percent = progress(player?.metres ?? 0)
      const leading = !!player && leader > .1 && Math.abs(player.metres - leader) < .001
      return <div className="sprint-lane" data-occupied={!!player} data-leading={leading} key={lane}>
        {tracking && <div className="sprint-lane-ground" aria-hidden="true" style={{ backgroundPositionX: `${-(player?.metres ?? 0) * 8}px` }}/>} 
        {!minimal && <div className="sprint-name"><b style={{ background: laneColours[lane] }}>{lane + 1}</b><span>{player?.name ?? '—'}{player && <small>{Math.floor(player.metres)} m · {(player.speed * 3.6).toFixed(0)} km/h</small>}</span></div>}
        <div className="sprint-runway">
          {!minimal && [25, 50, 75].map(mark => <i className="sprint-marker" key={mark} style={{ left: `${mark}%` }}/>)}
          <i className="sprint-finish"/>
          {player && <>
            {!minimal && <div className="sprint-trail" style={{ width: `${percent}%`, backgroundColor: laneColours[lane] }}/>}
            <div className={`sprint-horse${running ? ' is-running' : ''}${(player.streak ?? 0) >= 3 ? ' is-on-fire' : ''}`} style={{ left: `${percent}%`, animationDuration: `${3 / (player.speed || 8)}s` }} title={minimal ? player.name : `${player.name}: ${Math.floor(player.metres)} metres`}>
              {minimal && <span className="sprint-rider-label"><i style={{ background: laneColours[lane] }}/>{player.name}{leading && <svg className="sprint-leader-crown" viewBox="0 0 24 20" role="img" aria-label="Leading"><path d="M2 4 7 9 12 1 17 9 22 4 19 17H5Z" fill="currentColor"/><path d="M6 19h12" stroke="currentColor" strokeWidth="2"/></svg>}</span>}
              {running && player.speed >= 14 && <span className="sprint-wind" aria-hidden="true" style={{ animationDuration: `${6 / player.speed}s` }}><i/><i/><i/><i/></span>}
              {(player.streak ?? 0) >= 3 && <span className="sprint-fire-aura" aria-hidden="true"><i/><i/><i/></span>}
              <i className="sprint-dust"/><span className="sprint-horse-body">{renderHorse ? renderHorse(player) : (player.streak ?? 0) >= 3 ? <HorseMotion mood={player.speed >= 14 ? 'confident' : 'steady'} speed={player.speed} onFire paused={!running}/> : <Horse colour={laneColours[lane]} running={running} speed={player.speed}/>}</span>
            </div>
          </>}
        </div>
      </div>
    })}
  </div>
}
export default memo(RaceTrack)
