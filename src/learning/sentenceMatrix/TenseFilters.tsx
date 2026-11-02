import { getLanguage } from '../../classroom/language'
import WordSlotIcon from './WordSlotIcon'
import type { TimelineTense } from './TenseTimeline'

const tenses: TimelineTense[] = ['past', 'present', 'future']
const names = {past:['Past','อดีต'],present:['Present','ปัจจุบัน'],future:['Future','อนาคต']}

export default function TenseFilters({value,onChange,controls}:{value:TimelineTense|null;onChange:(value:TimelineTense|null)=>void;controls:string}) {
 return <div className="cw-category-filters cw-tense-filters" role="group" aria-label="Filter words by tense">
  {tenses.map(tense=><button key={tense} type="button" data-tense-filter={tense} aria-label={names[tense][getLanguage()==='th'?1:0]} title={names[tense][getLanguage()==='th'?1:0]} aria-pressed={value===tense} aria-controls={controls} onClick={()=>onChange(value===tense?null:tense)}>
   <span className="cw-category-icon" aria-hidden="true"><WordSlotIcon slot={1} tense={tense}/></span>
  </button>)}
 </div>
}
