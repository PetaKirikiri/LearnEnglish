export type PracticeLevel=1|2|3|4|5
export default function PracticeLevelPicker({level,onChange}:{level:PracticeLevel;onChange:(level:PracticeLevel)=>void}){
 return <div className="foundation-level-picker" role="group" aria-label="Practice level">{([1,2,3,4,5] as const).map(value=><button type="button" key={value} aria-label={`Level ${value}`} aria-pressed={level===value} onClick={()=>{if(value!==level)onChange(value)}}>{value}</button>)}</div>
}
