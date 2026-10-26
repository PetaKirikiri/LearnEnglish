import { useState } from 'react'
import HorseMotion from './HorseMotion'
import { horseMoods, horseStyles, type HorseMood } from './horseGait'
import './horsePreview.css'

export default function HorsePreviewPage() {
  const [mood, setMood] = useState<HorseMood>('confident')
  const [compare, setCompare] = useState(true)
  const [paused, setPaused] = useState(false)
  const [slow, setSlow] = useState(false)
  const [onFire, setOnFire] = useState(true)
  const showComparison = compare && !onFire
  return <main className="horse-preview">
    <header><a href="/english/race">← Race</a><h1>Find your stride.</h1><p>Three correct in a row. On fire.</p></header>
    <div className="horse-toolbar" aria-label="Animation controls">
      {!onFire && <button aria-pressed={compare} onClick={() => setCompare(!compare)}>{compare ? 'Side by side' : 'One horse'}</button>}
      <button aria-pressed={paused} onClick={() => setPaused(!paused)}>{paused ? 'Play' : 'Pause'}</button>
      <button aria-pressed={slow} onClick={() => setSlow(!slow)}>Slow motion</button>
      <button aria-pressed={onFire} onClick={() => setOnFire(!onFire)}>Golden form</button>
    </div>
    {!compare && !onFire && <div className="horse-state-picker" aria-label="Horse state">{horseMoods.map(state => <button key={state} aria-pressed={state === mood} onClick={() => setMood(state)}>{horseStyles[state].label}</button>)}</div>}
    <div className={`horse-lineup ${showComparison ? '' : 'single'}`}>
      {(onFire ? ['confident'] as const : compare ? horseMoods : [mood]).map((state, index) => <section className={`horse-state horse-state-${state}`} key={showComparison ? state : 'single'}>
        <div className="horse-state-heading">{!onFire && <span>0{showComparison ? index + 1 : horseMoods.indexOf(state) + 1}</span>}<h2>{onFire ? 'Super fast' : horseStyles[state].label}</h2>{!onFire && <b>{Math.round(horseStyles[state].speed * 3.6)}<small> km/h</small></b>}</div>
        <div className={`horse-stage ${paused ? 'paused' : ''}`} style={{ '--track-duration': `${(slow ? 4 : 1) * 18 / (onFire ? 23 : horseStyles[state].speed)}s` } as React.CSSProperties}>
          <HorseMotion mood={state} paused={paused} slow={slow} onFire={onFire}/><div className="horse-ground"/>
        </div>
        <div className="horse-small-view"><span>Race size</span><div><HorseMotion mood={state} paused={paused} slow={slow} onFire={onFire}/></div></div>
      </section>)}
    </div>
  </main>
}
