import type {PlaybackMode} from './usePlaybackMode'
import './playbackSpeed.css'
export default function PlaybackSpeedControls({mode,onChange}:{mode:PlaybackMode;onChange:(mode:PlaybackMode)=>void}){
 return <div className="playback-speed-controls" role="group" aria-label="Speaking speed">
  <button type="button" aria-label="Slow speaking speed" aria-pressed={mode==='slow'} onClick={()=>onChange('slow')}><span aria-hidden="true">🐢</span> Slow</button>
  <button type="button" aria-label="Normal speaking speed" aria-pressed={mode==='normal'} onClick={()=>onChange('normal')}><span aria-hidden="true">🐇</span> Normal</button>
 </div>
}
