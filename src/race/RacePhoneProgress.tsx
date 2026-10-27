import type { CSSProperties } from 'react'
import type { RacePlayer } from './types'
import { laneColours } from './colours'
import './racePhoneProgress.css'

/** Phone overview: every lane shares the same start-to-finish distance scale. */
export default function RacePhoneProgress({players,finish,me}:{players:readonly RacePlayer[];finish:number;me?:string}) {
  if (!players.length) return null
  return <section className="phone-race-progress" data-density={players.length > 7 ? 'dense' : players.length > 4 ? 'compact' : 'normal'} aria-label="ความคืบหน้าการแข่ง">
    <div className="phone-progress-ends" aria-hidden="true"><span>เริ่ม</span><span>เส้นชัย <i/></span></div>
    <div className="phone-progress-lanes">
      {[...players].sort((a,b)=>a.lane-b.lane).map(player=>{
        const progress=finish>0 ? Math.min(100,Math.max(0,player.metres/finish*100)) : 0
        const own=player.id===me
        return <div className={`phone-progress-lane${own?' is-me':''}`} key={player.id} data-player={player.id} role="progressbar" aria-label={`${player.name}${own?' (คุณ)':''}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.floor(progress)} aria-valuetext={`${Math.floor(player.metres)} / ${finish} เมตร`} style={{'--rider-colour':laneColours[player.lane%laneColours.length], '--progress':`${progress}%`} as CSSProperties}>
          <span className="phone-progress-fill"/>
          <span className="phone-progress-name" title={player.name}>{player.name}</span>
          <i className="phone-progress-dot"/>
        </div>
      })}
    </div>
  </section>
}
