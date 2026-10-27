import { memo, useId, useState, type CSSProperties } from 'react'
import './cartoonHorse.css'
import { horsePowerVisuals } from './horsePowerVisuals'

// The illustrated atlas is not a uniform grid. Trace the transparent gutters
// and align the saddle anchors so adjacent hooves cannot leak into a frame.
const frames = [
  { x:265, y:270, edge:'0,0 450,0 450,310 510,340 510,430 0,430' },
  { x:700, y:270, edge:'450,0 895,0 895,435 510,435 510,320 450,310' },
  { x:1130, y:270, edge:'895,0 1330,0 1330,435 895,435' },
  { x:1585, y:270, edge:'1330,0 1774,0 1774,435 1330,435' },
  { x:255, y:650, edge:'0,440 445,440 445,887 0,887' },
  { x:700, y:650, edge:'445,440 885,440 885,887 445,887' },
  { x:1130, y:650, edge:'885,440 1325,440 1325,887 885,887' },
  { x:1575, y:650, edge:'1325,440 1774,440 1774,887 1325,887' },
]
export default memo(function CartoonHorse({ speed = 10, paused = false, powered = false, streak, lane }: { speed?: number; paused?: boolean; powered?: boolean; streak?: number; lane?: number }) {
  const id = useId().replace(/:/g, '')
  const power = horsePowerVisuals(speed, streak ?? (powered ? 5 : 0))
  // A restored/already-golden horse must not explode on mount or every poll.
  const [transition, setTransition] = useState({ powered: power.powered, burst: 0, visible: false })
  if (transition.powered !== power.powered) {
    setTransition({ powered: power.powered, burst: transition.burst + 1, visible: power.powered && !paused })
  }
  const sheet = `/images/race/cartoon-${power.powered ? 'golden-' : ''}gallop-v2.png`
  return <span className={`cartoon-horse${power.powered ? ' is-powered' : ''}${paused ? ' is-paused' : ''}`} role="img" aria-label={power.powered ? 'Golden powered-up running horse' : 'Cartoon running horse'} data-charge={power.charge} data-power-level={power.level} style={{ '--gallop-duration': `${power.gallopSeconds}s`, '--charge-duration': `${power.pulseSeconds}s`, '--energy-duration': `${power.flowSeconds}s`, '--aura-scale': power.auraScale, '--wake-scale': power.wakeScale } as CSSProperties}>
    {(power.charge > 0 || power.powered) && <span className="cartoon-energy" aria-hidden="true"><i className="cartoon-energy-halo"/>{power.powered && <><i className="cartoon-energy-wake"/><span className="cartoon-energy-sparks">{Array.from({length:6},(_,i)=><i key={i} style={{'--spark':i} as CSSProperties}/>)}</span></>}</span>}
    {transition.visible && <span key={transition.burst} className="cartoon-transform" aria-hidden="true" onAnimationEnd={() => setTransition(current => ({...current,visible:false}))}><i/><b/>{Array.from({length:8},(_,i)=><span key={i} style={{'--ray':i} as CSSProperties}/>)}</span>}
    <svg className="cartoon-horse-art" viewBox={lane === undefined ? "0 0 560 430" : "40 65 480 315"} aria-hidden="true">
      <defs>{frames.map((frame, i) => <clipPath id={`${id}-${i}`} key={i}><polygon points={frame.edge}/></clipPath>)}</defs>
      {frames.map((frame, i) => <g className="cartoon-horse-frame" key={i} style={{ '--frame-delay': i === 0 ? 0 : (i - 8) / 8 } as CSSProperties} transform={`translate(${280-frame.x} ${240-frame.y})`}><image clipPath={`url(#${id}-${i})`} href={sheet} width="1774" height="887"/></g>)}
    </svg>
  </span>
})
