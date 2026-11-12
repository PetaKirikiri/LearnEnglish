import GeneratedClassroomPractice from './GeneratedClassroomPractice'
import type {GeneratedQuestion} from '../race/generatedPracticeContent'
import {classroomPracticeQuestion} from './testingQuestions'
import type {identificationQuestions} from '../race/identificationContent'
import {wordTokens,wordOpacity} from '../learning/wordProgress/model'
import {useCallback,useEffect,useRef} from 'react'
import ActionPracticeStage from '../race/ActionPracticeStage'
import type {ActionPracticeQuestion} from '../race/actionPracticeContent'
import type {ClassTurn} from './session'
import './sentenceLine.css'
import '../race/phonePractice.css'
import '../race/numberFoundation.css'

function ActionClassroomPractice({question,turn,onAnswer,onPresented,busy=false}:{question:ActionPracticeQuestion;turn:ClassTurn;onAnswer?:(answer:string,evidence?:{heard:boolean;plays:number;assisted:boolean})=>void;onPresented?:()=>boolean;busy?:boolean}){
 const q=classroomPracticeQuestion(question,turn),picked=turn.answer===null?null:turn.choices.indexOf(turn.answer),audio=useRef<HTMLAudioElement|null>(null)
 const studentView=Boolean(onAnswer),reported=useRef(false),presentCallback=useRef(onPresented),report=useRef(()=>{})
 presentCallback.current=onPresented
 report.current=()=>{if(studentView&&turn.answer===null&&!reported.current&&presentCallback.current?.())reported.current=true}
 useEffect(()=>{if(wordTokens(q.english).some(word=>wordOpacity(word,turn.scores??{},{fadeMode:true})>0))report.current()})
 const play=useCallback(()=>{audio.current?.pause();const player=new Audio(question.audioUrl);audio.current=player;player.onplaying=()=>report.current();void player.play().catch(()=>{})},[question.audioUrl])
 useEffect(()=>{if(studentView)play();return()=>{audio.current?.pause()}},[play,turn.id,studentView])
 return <ActionPracticeStage key={turn.id} question={q} scores={turn.scores??{}} settings={{fadeMode:true}} picked={picked} disabled={busy||picked!==null||!onAnswer} onChoose={side=>onAnswer?.(turn.choices[side])} onNext={()=>{}} onReplay={play} teacherControlled review={picked!==null}/>
}

export default function ClassroomPractice(props:{question:GeneratedQuestion|ActionPracticeQuestion|typeof identificationQuestions[number];turn:ClassTurn;onAnswer?:(answer:string,evidence?:{heard:boolean;plays:number;assisted:boolean})=>void;onPresented?:()=>boolean;busy?:boolean}){
 if('targetWords' in props.question)return <GeneratedClassroomPractice key={props.turn.id} {...props} question={props.question}/>
 return <ActionClassroomPractice {...props} question={props.question}/>
}
