import type {PlaybackMode} from './usePlaybackMode'
import './playbackSpeed.css'
export default function PlaybackSpeedControls({mode,onChange}:{mode:PlaybackMode;onChange:(mode:PlaybackMode)=>void}){
 return <span className="playback-speed-controls" role="group" aria-label="Speaking speed">
  <button type="button" aria-label="Slow speaking speed" aria-pressed={mode==='slow'} onClick={()=>onChange('slow')}><span className="playback-art playback-art-slow" data-playback-animal="turtle" aria-hidden="true"/></button>
  <button type="button" aria-label="Fast speaking speed" aria-pressed={mode==='normal'} onClick={()=>onChange('normal')}><span className="playback-art playback-art-fast" data-playback-animal="hare" aria-hidden="true"/></button>
 </span>
}
