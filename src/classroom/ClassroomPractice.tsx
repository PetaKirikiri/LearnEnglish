import {useCallback,useEffect,useRef} from 'react'
import ActionPracticeStage from '../race/ActionPracticeStage'
import type {ActionPracticeQuestion} from '../race/actionPracticeContent'
import type {ClassTurn} from './session'
import './sentenceLine.css'
import '../race/phonePractice.css'
import '../race/numberFoundation.css'

/** Classroom ordering is authoritative; reuse the existing assessment presentation. */
export function classroomPracticeQuestion(question:ActionPracticeQuestion,turn:ClassTurn):ActionPracticeQuestion{
 const correct=turn.choices.indexOf(question.choices[question.correct])
 if(turn.choices.length!==2||correct<0||turn.choices.some(choice=>!question.choices.includes(choice)))throw new Error('Classroom question choices do not match the practice catalogue')
 return {...question,choices:[turn.choices[0],turn.choices[1]],correct}
}
export default function ClassroomPractice({question,turn,onAnswer,busy=false}:{question:ActionPracticeQuestion;turn:ClassTurn;onAnswer?:(answer:string)=>void;busy?:boolean}){
 const q=classroomPracticeQuestion(question,turn),picked=turn.answer===null?null:turn.choices.indexOf(turn.answer),audio=useRef<HTMLAudioElement|null>(null)
 const play=useCallback(()=>{audio.current?.pause();const player=new Audio(question.audioUrl);audio.current=player;void player.play().catch(()=>{})},[question.audioUrl])
 useEffect(()=>{if(onAnswer)play();return()=>{audio.current?.pause()}},[play,turn.id,!!onAnswer])
 return <ActionPracticeStage key={turn.id} question={q} scores={turn.scores??{}} settings={{fadeMode:true}} picked={picked} disabled={busy||picked!==null||!onAnswer} onChoose={side=>onAnswer?.(turn.choices[side])} onNext={()=>{}} onReplay={play} teacherControlled review={picked!==null}/>
}
