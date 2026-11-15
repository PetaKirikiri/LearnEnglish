import PlaybackSpeedControls from './PlaybackSpeedControls'
import {usePlaybackMode} from './usePlaybackMode'

/** Each speed button immediately replays using the shared speed preference. */
export default function PlaybackButtons({onPlay,label='Sentence playback',busy=false}:{busy?:boolean;onPlay:()=>void;label?:string}){
 const [mode,choose]=usePlaybackMode()
 return <span className="playback-buttons" aria-label={label}><PlaybackSpeedControls busy={busy} mode={mode} onChange={next=>{choose(next);onPlay()}}/></span>
}
