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
 onReplay?:()=>void
 teacherControlled?:boolean
}
export default function PracticeStage({question,prompt,answers,correct,onNext,explanation,onHelp,onReplay,teacherControlled=false}:StageProps){
 const [helpOpen,setHelpOpen]=useState(false)
 return <div className="practice-stage adaptive-practice-stage">
  <section className="practice-question" aria-label="Question">{question}</section>
  <section className="practice-answer-area" aria-label="Answers">
   <div className="practice-feedback foundation-controls">
    <button type="button" className="foundation-help" aria-label="อธิบายรูปแบบประโยค" aria-haspopup="dialog" onClick={()=>{onHelp?.();setHelpOpen(true)}}>?</button>
    {onReplay&&<button type="button" className="foundation-replay" aria-label="Listen again · ฟังอีกครั้ง" onClick={onReplay}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14"/></svg></button>}
    <span className="foundation-result-announcement" role="status">{correct===null?'':correct?'ถูกต้อง':'ยังไม่ถูก'}</span>
    {correct===null&&<span className="practice-answer-prompt">{onReplay?'Listen, then choose':prompt}</span>}
    {!teacherControlled&&<button type="button" className="foundation-next" disabled={correct===null} onClick={onNext}>Next →</button>}
   </div>
   <BinaryAnswerZone {...answers}/>
  </section>
  {helpOpen&&explanation(()=>setHelpOpen(false))}
 </div>
}
