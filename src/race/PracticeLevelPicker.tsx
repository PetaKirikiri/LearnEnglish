export type PracticeLevel=1|2|3|4|5|6
export default function PracticeLevelPicker({level,onChange}:{level:PracticeLevel;onChange:(level:PracticeLevel)=>void}){
 return <div className="foundation-level-picker" role="group" aria-label="Practice level">
  <button type="button" aria-label="ด่านก่อนหน้า" disabled={level===1} onClick={()=>onChange((level-1) as PracticeLevel)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 6-6 6 6 6"/></svg></button>
  <strong aria-label={`Level ${level}`} aria-current="step">{String(level).padStart(2,'0')}</strong>
  <button type="button" aria-label="ด่านถัดไป" disabled={level===6} onClick={()=>onChange((level+1) as PracticeLevel)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m10 6 6 6-6 6"/></svg></button>
 </div>
}
