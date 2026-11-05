import PracticeGold from './PracticeGold'
import PracticeLevelPicker,{type PracticeLevel} from './PracticeLevelPicker'
import './practiceHeader.css'

type Props={
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
export default function PracticeHeader({level,onLevel,value,total,userId,onExit,exitLabel='กลับแผนที่',exitHref,onReplay}:Props){
 return <header className="practice-header">
  {onExit?<button type="button" className="practice-header-exit" aria-label={exitLabel} onClick={onExit}>←</button>:exitHref?<a className="practice-header-exit" aria-label={exitLabel} href={exitHref}>←</a>:null}
  {onLevel?<PracticeLevelPicker level={level} onChange={onLevel}/>:<strong className="practice-header-level" aria-label={`Level ${level}`}>{String(level).padStart(2,'0')}</strong>}
  {value!==undefined&&total!==undefined?<progress className="foundation-progress" value={value} max={total} aria-label="ความคืบหน้าของบทฝึก" aria-valuetext={`ตอบแล้ว ${value} จาก ${total} ข้อ`}/>:<span className="practice-header-spacer"/>}
  <PracticeGold userId={userId}/>
  {onReplay&&<button type="button" className="foundation-header-audio" aria-label="ฟังเสียง" onClick={onReplay}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14"/></svg></button>}
 </header>
}
