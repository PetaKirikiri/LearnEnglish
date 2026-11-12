import {useCallback,useEffect,useRef,useState} from 'react'
import type {GeneratedQuestion} from '../race/generatedPracticeContent'
import type {ClassTurn} from './session'
import PracticeStage from '../race/PracticeStage'
import type {BinaryChoice} from '../race/BinaryAnswerZone'
import PracticeHelpDialog from '../race/PracticeHelpDialog'
import PictureSentence from '../race/PictureSentence'
import DistanceScene from '../learning/sentenceMatrix/DistanceScene'
import LanguageQuadrant from '../learning/sentenceMatrix/LanguageQuadrant'
import {wordTokens,wordOpacity} from '../learning/wordProgress/model'
import {playSentenceAudio} from '../audio/sentenceAudio'
/** Host and phone render the same server-selected question and frozen learner support. */
export default function GeneratedClassroomPractice({question:q,turn,onAnswer,onPresented,busy=false}:{question:GeneratedQuestion;turn:ClassTurn;onAnswer?:(answer:string,evidence?:{heard:boolean;plays:number;assisted:boolean})=>void;onPresented?:()=>boolean;busy?:boolean}){
 const [heard,setHeard]=useState(false),[audioError,setAudioError]=useState(false),audio=useRef<(()=>void)|null>(null)
 const plays=useRef(0),assisted=useRef(false)
 const studentView=Boolean(onAnswer)
 const reported=useRef(false),presentCallback=useRef(onPresented),report=useRef(()=>{})
 presentCallback.current=onPresented
 report.current=()=>{if(studentView&&turn.answer===null&&!reported.current&&presentCallback.current?.())reported.current=true}
 useEffect(()=>{if(wordTokens(q.document.english).some(word=>wordOpacity(word,turn.scores??{},{fadeMode:true})>0))report.current()})
 const play=useCallback(()=>{audio.current?.();audio.current=playSentenceAudio({id:q.id,document:{english:q.document.english},audioUrl:q.audioUrl},{started:()=>{report.current();setHeard(false);plays.current++;setAudioError(false)},ended:()=>setHeard(true),error:()=>setAudioError(true)})},[q])
 useEffect(()=>{if(studentView)play();return()=>audio.current?.()},[play,turn.id,studentView])
 const picked=turn.answer===null?null:turn.choices.indexOf(turn.answer)
 const choices=turn.choices.map((label,side)=>{
  const original=q.choices.indexOf(label)
  if(original<0)throw new Error('Classroom question choices do not match')
  return {id:String(side),label,content:q.sceneChoices?<span className="distance-answer"><DistanceScene {...q.sceneChoices[original]}/><strong>{label}</strong></span>:q.alternatives?<PictureSentence document={q.alternatives[original]}/>:label,state:picked!==null&&label===q.choices[q.correct]?'correct':picked===side?'incorrect':undefined}
 }) as [BinaryChoice,BinaryChoice]
 return <PracticeStage explanation={close=><PracticeHelpDialog onClose={close} title="Listen → choose the pictures"><PictureSentence document={q.document}/></PracticeHelpDialog>} teacherControlled onHelp={()=>{assisted.current=true}} onReplay={play} prompt="Listen, then choose" correct={picked===null?null:turn.correct} onNext={()=>{}} answers={{choices,selected:picked,disabled:busy||picked!==null||!onAnswer||!heard,onChoose:side=>onAnswer?.(turn.choices[side],{heard,plays:plays.current,assisted:assisted.current})}}
 question={<><div className="classroom foundation-noun"><div className="cw-sentence-board"><LanguageQuadrant scores={turn.scores??{}} request={{document:q.document,referenceObject:q.sceneChoices?.[q.correct].word,presentation:{size:onAnswer?'phone':'classroom',fadeMode:true,english:true,icons:true,keepIconsWhenFading:false,thaiMeanings:false,thaiTranslation:false,explanations:false,wordPicker:false}}}/></div></div>{audioError&&<button role="alert" onClick={play}>🔊 ↻ Tap to listen</button>}</>}/>
}
