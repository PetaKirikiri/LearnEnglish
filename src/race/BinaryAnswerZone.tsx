import type {ReactNode} from 'react'

export type BinaryChoice = {
  id: string
  content: ReactNode
  icon?: ReactNode
  label: string
  state?: 'correct' | 'incorrect'
}

/** Exactly two stable answer regions. Content may be text or a display-only matrix. */
export default function BinaryAnswerZone({choices,disabled,selected,onChoose}:{
  choices: readonly [BinaryChoice,BinaryChoice]
  disabled:boolean
  selected:number|null
  onChoose:(index:number)=>void
}){
  return <div className="practice-response binary-answer-zone"><div className="practice-answers" role="group" aria-label="คำตอบ">
    {choices.map((choice,index)=><button key={choice.id} type="button" aria-label={choice.label} disabled={disabled} aria-pressed={selected===index} className={`binary-answer choice-${index} ${choice.state??''}`} onClick={()=>onChoose(index)}><span className={`binary-answer-content ${choice.icon ? 'has-icon' : ''}`}>{choice.icon && <span className="binary-answer-icon" aria-hidden="true">{choice.icon}</span>}<span className="binary-answer-label">{choice.content}</span></span></button>)}
  </div></div>
}
