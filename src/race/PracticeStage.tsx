import {useState,type ReactNode,type ComponentProps} from 'react'
import BinaryAnswerZone from './BinaryAnswerZone'
import './practiceStage.css'

type StageProps={
 question:ReactNode
 prompt:string
 answers:ComponentProps<typeof BinaryAnswerZone>
 correct:boolean|null
 onNext:()=>void
 explanation:(close:()=>void)=>ReactNode
 onHelp?:()=>void
}
export default function PracticeStage({question,prompt,answers,correct,onNext,explanation,onHelp}:StageProps){
 const [helpOpen,setHelpOpen]=useState(false)
 return <div className="practice-stage adaptive-practice-stage">
  <section className="practice-question" aria-label="Question">{question}</section>
  <section className="practice-answer-area" aria-label="Answers">
   <div className="practice-feedback foundation-controls">
    <button type="button" className="foundation-help" aria-label="อธิบายรูปแบบประโยค" aria-haspopup="dialog" onClick={()=>{onHelp?.();setHelpOpen(true)}}>?</button>
    <span className="foundation-result-announcement" role="status">{correct===null?'':correct?'ถูกต้อง':'ยังไม่ถูก'}</span>
    {correct===null&&<span className="practice-answer-prompt">{prompt}</span>}
    <button type="button" className="foundation-next" disabled={correct===null} onClick={onNext}>Next →</button>
   </div>
   <BinaryAnswerZone {...answers}/>
  </section>
  {helpOpen&&explanation(()=>setHelpOpen(false))}
 </div>
}
