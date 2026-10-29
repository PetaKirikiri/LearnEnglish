import WordSlotIcon from './WordSlotIcon'
import { getLanguage } from '../../classroom/language'
import './nounModes.css'
import type { NounMode } from './subjectEngine'
export type { NounMode } from './subjectEngine'
export function NounModeIcon({mode}:{mode:NounMode}) {
 if(mode==='noun')return <WordSlotIcon slot={3}/>
 return <svg viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">{mode==='pronoun'?<><circle cx="16" cy="10" r="5"/><path d="M6 27v-3a10 10 0 0 1 20 0v3Z"/></>:<><rect x="3" y="7" width="26" height="21" rx="5"/><path d="M11 7V4h10v3M9 16h14M12 22h8"/></>}</svg>
}
export type NounSwapperRequest={modes:readonly NounMode[];mode:NounMode;onChange:(mode:NounMode)=>void;label?:string}
export default function NounModeToggle({mode,onChange,modes,label='Noun block mode'}:NounSwapperRequest) {
 const th=getLanguage()==='th'
 return <span className="cw-noun-mode-toggle" role="group" aria-label={label}>
  {([{id:'noun',en:'Determiner + noun',th:'คำกำหนดนาม + คำนาม'},{id:'pronoun',en:'Pronouns',th:'คำสรรพนาม'},{id:'name',en:'Proper nouns',th:'ชื่อเฉพาะ'}] as const).map(item=><button type="button" key={item.id} data-noun-mode={item.id} disabled={!modes.includes(item.id)} aria-label={item.en} title={th?item.th:item.en} aria-pressed={mode===item.id} onClick={()=>onChange(item.id)}><NounModeIcon mode={item.id}/></button>)}
 </span>
}
