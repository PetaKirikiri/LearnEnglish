import GeneratedClassroomPractice from './GeneratedClassroomPractice'
import type {GeneratedQuestion} from '../race/generatedPracticeContent'
import {classroomPracticeQuestion} from './testingQuestions'
import {identificationQuestions} from '../race/identificationContent'
import {useCallback,useEffect,useRef} from 'react'
import ActionPracticeStage from '../race/ActionPracticeStage'
import type {ActionPracticeQuestion} from '../race/actionPracticeContent'
import type {ClassTurn} from './session'
import './sentenceLine.css'
import '../race/phonePractice.css'
import '../race/numberFoundation.css'

function ActionClassroomPractice({question,turn,onAnswer,busy=false}:{question:ActionPracticeQuestion;turn:ClassTurn;onAnswer?:(answer:string,evidence?:{heard:boolean;plays:number;assisted:boolean})=>void;busy?:boolean}){
 const q=classroomPracticeQuestion(question,turn),picked=turn.answer===null?null:turn.choices.indexOf(turn.answer),audio=useRef<HTMLAudioElement|null>(null)
 const play=useCallback(()=>{audio.current?.pause();const player=new Audio(question.audioUrl);audio.current=player;void player.play().catch(()=>{})},[question.audioUrl])
 const studentView=Boolean(onAnswer)
 useEffect(()=>{if(studentView)play();return()=>{audio.current?.pause()}},[play,turn.id,studentView])
 return <ActionPracticeStage key={turn.id} question={q} scores={turn.scores??{}} settings={{fadeMode:true}} picked={picked} disabled={busy||picked!==null||!onAnswer} onChoose={side=>onAnswer?.(turn.choices[side])} onNext={()=>{}} onReplay={play} teacherControlled review={picked!==null}/>
}

export default function ClassroomPractice(props:{question:GeneratedQuestion|ActionPracticeQuestion|typeof identificationQuestions[number];turn:ClassTurn;onAnswer?:(answer:string,evidence?:{heard:boolean;plays:number;assisted:boolean})=>void;busy?:boolean}){
 if('targetWords' in props.question)return <GeneratedClassroomPractice key={props.turn.id} {...props} question={props.question}/>
 return <ActionClassroomPractice {...props} question={props.question}/>
}
