import type {ReactNode} from 'react'
import './practiceStage.css'

/** Two shared regions; their content determines height, never individual exercises. */
export default function PracticeStage({question,answers}:{question:ReactNode;answers:ReactNode}){
 return <div className="practice-stage adaptive-practice-stage">
  <section className="practice-question" aria-label="Question">{question}</section>
  <section className="practice-answer-area" aria-label="Answers">{answers}</section>
 </div>
}
