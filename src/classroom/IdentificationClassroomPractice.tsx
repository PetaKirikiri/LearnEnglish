import {useCallback,useEffect,useRef} from 'react'
import type {ClassTurn} from './session'
import type {identificationQuestions} from '../race/identificationContent'
import PracticeStage from '../race/PracticeStage'
import type {BinaryChoice} from '../race/BinaryAnswerZone'
import LanguageQuadrant from '../learning/sentenceMatrix/LanguageQuadrant'
import DistanceScene from '../learning/sentenceMatrix/DistanceScene'
import PracticeHelpDialog from '../race/PracticeHelpDialog'
import PictureSentence from '../race/PictureSentence'
export default function IdentificationClassroomPractice({question,turn,onAnswer,busy=false}:{question:typeof identificationQuestions[number];turn:ClassTurn;onAnswer?:(answer:string)=>void;busy?:boolean}){
 const audio=useRef<HTMLAudioElement|null>(null)
 const play=useCallback(()=>{audio.current?.pause();const player=new Audio(question.audioUrl);audio.current=player;void player.play().catch(()=>{})},[question.audioUrl])
 const studentView=Boolean(onAnswer)
 useEffect(()=>{if(studentView)play();return()=>{audio.current?.pause()}},[play,turn.id,studentView])
 const picked=turn.answer===null?null:turn.choices.indexOf(turn.answer)
 const correct=turn.choices.indexOf(question.choices[question.correct])
 if(turn.choices.length!==2||correct<0||turn.choices.some(c=>!question.choices.includes(c)))throw new Error('Classroom question choices do not match the practice catalogue')
 const choices=turn.choices.map((label,side)=>({id:String(side),label,content:<span className="distance-answer"><DistanceScene {...question.sceneChoices[question.choices.indexOf(label)]}/><strong>{label}</strong></span>,state:picked!==null&&side===correct?'correct':picked===side?'incorrect':undefined})) as [BinaryChoice,BinaryChoice]
 return <PracticeStage teacherControlled onReplay={play} prompt="Listen, then choose" correct={picked===null?null:picked===correct} onNext={()=>{}} answers={{choices,selected:picked,disabled:busy||picked!==null||!onAnswer,onChoose:side=>onAnswer?.(turn.choices[side])}}
 question={<div className="classroom foundation-noun"><div className="cw-sentence-board"><LanguageQuadrant scores={turn.scores??{}} request={{document:question.document,referenceObject:question.sceneChoices[question.correct].word,presentation:{size:onAnswer?'phone':'classroom',fadeMode:true,english:true,icons:true,keepIconsWhenFading:true,thaiMeanings:false,thaiTranslation:false,explanations:false,wordPicker:false}}}/></div></div>}
 explanation={close=><PracticeHelpDialog onClose={close} title="Listen → choose the pictures"><PictureSentence document={question.document}/></PracticeHelpDialog>}/>
}
