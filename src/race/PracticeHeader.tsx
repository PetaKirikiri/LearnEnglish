import PlaybackButtons from '../audio/PlaybackButtons'
import PracticeGold from './PracticeGold'
import PracticeLevelPicker,{type PracticeLevel} from './PracticeLevelPicker'
import './practiceHeader.css'

type Props={
 label?:string
 level:PracticeLevel
 onLevel?:(level:PracticeLevel)=>void
 value?:number
 total?:number
 userId?:string
 onExit?:()=>void
 exitLabel?:string
 exitHref?:string
 onReplay?:()=>void
}

/** One fixed-height HUD for every exercise; the question owns the rest of the screen. */
export default function PracticeHeader({level,label,onLevel,value,total,userId,onExit,exitLabel='กลับแผนที่',exitHref,onReplay}:Props){
 return <header className="practice-header">
  {onExit?<button type="button" className="practice-header-exit" aria-label={exitLabel} onClick={onExit}>←</button>:exitHref?<a className="practice-header-exit" aria-label={exitLabel} href={exitHref}>←</a>:null}
  {onLevel?<PracticeLevelPicker level={level} onChange={onLevel}/>:<strong className="practice-header-level" aria-label={label??`Level ${level}`}>{label??String(level).padStart(2,'0')}</strong>}
  {value!==undefined&&total!==undefined?<progress className="foundation-progress" value={value} max={total} aria-label="ความคืบหน้าของบทฝึก" aria-valuetext={`ตอบแล้ว ${value} จาก ${total} ข้อ`}/>:<span className="practice-header-spacer"/>}
  <span className="practice-header-tools" data-practice-toolbar-host/>
  <PracticeGold userId={userId}/>
  {onReplay&&<PlaybackButtons onPlay={onReplay}/>}
 </header>
}
