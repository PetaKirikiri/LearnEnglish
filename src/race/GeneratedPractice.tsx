import {useCallback,useEffect,useRef,useState} from 'react'
import LanguageQuadrant from '../learning/sentenceMatrix/LanguageQuadrant'
import type {MatrixSettings} from '../learning/sentenceMatrix/model'
import {useWordProgress} from '../learning/wordProgress/useWordProgress'
import {wordOpacity,wordTokens,WORD_RULE_VERSION,type WordScores} from '../learning/wordProgress/model'
import {generatedDeck,eligiblePracticeActions,loadEvidence,saveEvidence,evidenceScores,curriculumBaseline,type DeckOptions,type ListeningEvidence} from './generatedPracticeProgress'
import {practiceCandidates,GENERATED_ROUND_SIZE,type GeneratedQuestion} from './generatedPracticeContent'
import {playSentenceAudio,prepareSentenceAudio} from '../audio/sentenceAudio'
import {audioPreparationPlan,nextPersonalQuestion} from './practiceForecast'
import type {PracticeLevel} from './PracticeLevelPicker'
import PracticeHeader from './PracticeHeader'
import PracticeStage from './PracticeStage'
import PracticeHelpDialog from './PracticeHelpDialog'
import DistanceScene from '../learning/sentenceMatrix/DistanceScene'
import PictureSentence from './PictureSentence'
import {PracticeAnswerIcon,type BinaryChoice} from './BinaryAnswerZone'
import {awardPracticeGold} from './PracticeGold'
import './phonePractice.css'
import './numberFoundation.css'

const bankFor=(props:Props,progress:ReturnType<typeof useWordProgress>,events:ListeningEvidence[])=>practiceCandidates(props.level,props.options?.structure,eligiblePracticeActions(progress.rows,events))
type Props={label?:string;level:PracticeLevel;userId?:string;settings?:MatrixSettings;onLevel?:(level:PracticeLevel)=>void;onExit?:()=>void;onComplete?:(level:PracticeLevel,score:number,total:number,passed:boolean,runId:string,unassisted:boolean)=>void;options?:DeckOptions;scope?:string}
type Run={id:string;questionIds:string[];flipped:boolean[];index:number;answers:boolean[];picked:number|null;attemptId:string;assisted:boolean;done:boolean}
const runKey=(props:Props)=>`englishsuccess:composed-run:v16:${props.userId??'guest'}:${props.level}:${props.scope??'main'}`
function loadRun(props:Props,progress:ReturnType<typeof useWordProgress>,events:ListeningEvidence[]):Run|null{try{const s=JSON.parse(localStorage.getItem(runKey(props))??'null'),bank=bankFor(props,progress,events),validIds=new Set(bank.filter(q=>q.action==='vocabulary'||!props.options?.actions||[...props.options.actions,...(props.options.reviewActions??[])].includes(q.action)).map(q=>q.id));if(s&&!s.done&&typeof s.id==='string'&&typeof s.attemptId==='string'&&Array.isArray(s.questionIds)&&s.questionIds.length===30&&s.questionIds.every((id:string)=>validIds.has(id))&&Array.isArray(s.flipped)&&s.flipped.length===30&&s.flipped.every((b:unknown)=>typeof b==='boolean')&&Number.isInteger(s.index)&&s.index>=0&&s.index<30&&Array.isArray(s.answers)&&s.answers.every((b:unknown)=>typeof b==='boolean')&&[null,0,1].includes(s.picked)&&s.answers.length===s.index+(s.picked===null?0:1))return s}catch{/* An invalid or completed round starts afresh. */}return null}
export default function GeneratedPractice(props:Props){return <LearnerPractice key={`${props.userId??'guest'}:${props.level}:${props.scope??'main'}`} {...props}/>}
function LearnerPractice(props:Props){
 const progress=useWordProgress(props.userId)
 if(!progress.ready)return <main className="phone-practice foundation-practice"><div className="practice-shell"><PracticeHeader label={props.label} level={props.level} onLevel={props.onLevel} onExit={props.onExit} value={0} total={30}/>{progress.error?<button role="alert" onClick={()=>void progress.retry()}>Retry loading progress</button>:<p role="status">…</p>}</div></main>
 return <ReadyPractice {...props} progress={progress}/>
}
function createRun(props:Props,progress:ReturnType<typeof useWordProgress>):Run{
 const id=crypto.randomUUID(),history=loadEvidence(props.userId)
 const familiar=curriculumBaseline(progress.rows,history,props.userId)
 const deck=generatedDeck(props.level,progress.rows,history,`${id}:0`,{...props.options,familiar})
 deck[0]=nextPersonalQuestion(props.level,progress.rows,history,id,0,{...props.options,familiar})
 const next:Run={id,questionIds:deck.map(q=>q.id),flipped:deck.map(q=>q.kind==='meaning'&&q.correct===1),index:0,answers:[],picked:null,attemptId:crypto.randomUUID(),assisted:false,done:false}
 localStorage.setItem(runKey(props),JSON.stringify(next));return next
}
function ReadyPractice({progress,...props}:Props&{progress:ReturnType<typeof useWordProgress>}){
 const [events,setEvents]=useState(()=>loadEvidence(props.userId)),[run,setRun]=useState<Run|null>(()=>{try{return loadRun(props,progress,events)??createRun(props,progress)}catch{return null}}),[saveError,setSaveError]=useState(false)
 const scores=evidenceScores(progress.rows,events,props.settings),finished=useRef(false)
 function start(){try{setRun(createRun(props,progress));setSaveError(false);finished.current=false}catch{setSaveError(true)}}
 const persist=(next:Run)=>{localStorage.setItem(runKey(props),JSON.stringify(next));setRun(next);setSaveError(false)}
 function complete(next:Run){
  if(finished.current)return
  finished.current=true
  const score=next.answers.filter(Boolean).length
  props.onComplete?.(props.level,score,30,score>=27,next.id,!next.assisted)
 }
 const stored=run?bankFor(props,progress,events).find(q=>q.id===run.questionIds[run.index]):undefined
 const original=stored?{...stored,level:props.level}:undefined
 const q=original&&run?.flipped[run.index]?{...original,choices:[original.choices[1],original.choices[0]] as [string,string],alternatives:original.alternatives?[original.alternatives[1],original.alternatives[0]] as typeof original.alternatives:undefined,sceneChoices:original.sceneChoices?[original.sceneChoices[1],original.sceneChoices[0]] as typeof original.sceneChoices:undefined,correct:1 as const}:original
 useEffect(()=>{
  if(!run||run.done||run.picked!==null||!q)return
  const timer=setTimeout(()=>{try{
   const options={...props.options,familiar:curriculumBaseline(progress.rows,events,props.userId)}
   const upcoming=audioPreparationPlan(props.level,progress.rows,events,run.id,run.index,q,options,props.settings)
   void prepareSentenceAudio(upcoming).catch(()=>{/* Local speech remains available. */})
  }catch{/* Keep current practice usable if forecasting fails. */}},0)
  return()=>clearTimeout(timer)
 // Forecast only when account evidence or the question changes, not audio playback state.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[run?.index,run?.id,events,progress.rows])
 function answer(side:number,evidence:Omit<ListeningEvidence,'id'|'questionId'|'level'|'sentence'|'targets'|'vocabulary'|'correct'|'at'>){
  if(!run||run.picked!==null||!q)return false
  const correct=side===q.correct,targets=q.credit===null?[]:q.targetWords
  const event:ListeningEvidence={...evidence,id:run.attemptId,questionId:q.id,level:props.level,sentence:q.document.english,targets,vocabulary:q.vocabulary,correct,at:new Date().toISOString()}
  try{
   // Credit only the contrast being tested. A hidden noun elsewhere in the
   // sentence is not evidence when the decision was about ownership.
   progress.record({id:event.id,questionId:q.id,version:q.version,answer:q.choices[side],occurredAt:event.at,modality:event.hidden&&event.heard&&!event.assisted&&event.plays===1?'audio':'visible',replays:Math.max(0,event.plays-1),ruleVersion:WORD_RULE_VERSION})
   const saved=saveEvidence(event,props.userId)
   persist({...run,picked:side,answers:[...run.answers,correct],assisted:run.assisted||event.assisted})
   setEvents(saved);awardPracticeGold(event.id,correct,props.userId);return true
  }catch{setSaveError(true);return false}
 }
 function next(){if(!run||run.picked===null)return;try{if(run.index===29){const done={...run,done:true};persist(done);complete(done)}else {
 const index=run.index+1,questionIds=[...run.questionIds],flipped=[...run.flipped]
 {const question=nextPersonalQuestion(props.level,progress.rows,events,run.id,index,{...props.options,familiar:curriculumBaseline(progress.rows,events,props.userId)});questionIds[index]=question.id;flipped[index]=question.kind==='meaning'&&question.correct===1}
 persist({...run,questionIds,flipped,index,picked:null,attemptId:crypto.randomUUID()})
 }}catch{setSaveError(true)}}
 return <main className={`phone-practice foundation-practice${props.options?.structure==='identify'?' identification-practice':''}`} lang="en"><div className="practice-shell">
 {!run?<><PracticeHeader label={props.label} level={props.level} onLevel={props.onLevel} onExit={props.onExit} userId={props.userId} value={0} total={30}/>{progress.error?<button role="alert" onClick={()=>void progress.retry()}>Retry loading progress</button>:<p role="status">…</p>}{<button role="alert" onClick={start}>Retry saving this set</button>}</>:run.done?<><PracticeHeader label={props.label} level={props.level} onLevel={props.onLevel} onExit={props.onExit} userId={props.userId} value={30} total={30}/><section className="practice-complete"><h1>{run.answers.filter(Boolean).length} / 30</h1><button onClick={start}>↻</button></section></>:q&&<GeneratedQuestionView courseLabel={props.label} key={run.attemptId} attemptId={run.attemptId} supportKey={runKey(props)+':presentation'} question={q} scores={scores} settings={props.settings} picked={run.picked} onChoose={answer} onNext={next} userId={props.userId} onLevel={props.onLevel} onExit={props.onExit} index={run.index} saveError={saveError||!!progress.error} retry={()=>void progress.retry()}/>}
 </div></main>
}
type QuestionProps={courseLabel?:string;attemptId:string;supportKey:string;question:GeneratedQuestion;scores:WordScores;settings?:MatrixSettings;picked:number|null;onChoose:(side:number,evidence:Pick<ListeningEvidence,'heard'|'hidden'|'assisted'|'plays'>)=>boolean;onNext:()=>void;userId?:string;onLevel?:Props['onLevel'];onExit?:()=>void;index:number;saveError:boolean;retry:()=>void}
function GeneratedQuestionView({courseLabel,attemptId,supportKey,question:q,scores,settings,picked,onChoose,onNext,userId,onLevel,onExit,index,saveError,retry}:QuestionProps){
 const [support]=useState(()=>{try{const old=JSON.parse(localStorage.getItem(supportKey)??'null');if(old?.id===attemptId&&old.scores&&typeof old.assisted==='boolean'&&Number.isInteger(old.plays)&&old.plays>=0&&Object.values(old.scores).every(v=>typeof v==='number'&&Number.isFinite(v)))return old as {id:string;scores:WordScores;plays:number;assisted:boolean}}catch{/* Retain fresh support when no presentation was saved. */}return {id:attemptId,scores:Object.fromEntries(wordTokens(q.document.english).map(w=>['en:'+w,scores['en:'+w]??0])),plays:0,assisted:false}})
 const snapshot=support.scores,[heard,setHeard]=useState(false),[audioError,setAudioError]=useState(false)
 const audio=useRef<(()=>void)|null>(null),plays=useRef(support.plays),assisted=useRef(support.assisted),locked=useRef(picked!==null)
 const saveSupport=useCallback(()=>{try{localStorage.setItem(supportKey,JSON.stringify({...support,plays:plays.current,assisted:assisted.current}))}catch{assisted.current=true}},[supportKey,support])
 const presentation={...settings,fadeMode:settings?.fadeMode??true}
 const play=useCallback(()=>{
  audio.current?.()
  audio.current=playSentenceAudio({id:q.id,document:{english:q.document.english},audioUrl:q.audioUrl},{started:()=>{setAudioError(false);plays.current++;saveSupport()},ended:()=>setHeard(true),error:()=>setAudioError(true)})
 },[q.id,q.document.english,q.audioUrl,saveSupport])
 useEffect(()=>{play();return()=>{audio.current?.();audio.current=null}},[play])
 useEffect(()=>{locked.current=picked!==null},[picked,saveError])
 const choices=q.choices.map((label,side)=>({id:String(side),label,content:q.sceneChoices?<span className="distance-answer"><DistanceScene {...q.sceneChoices[side]}/><strong>{label}</strong></span>:q.alternatives?<PictureSentence document={q.alternatives[side]}/>:label,icon:q.kind==='judgement'?<PracticeAnswerIcon kind="judgement" second={side===1}/>:undefined,state:picked!==null&&side===q.correct?'correct':picked===side?'incorrect':undefined})) as [BinaryChoice,BinaryChoice]
 function choose(side:number){if(locked.current||!heard)return;locked.current=true;const targets=q.listeningWords.flatMap(wordTokens);if(!onChoose(side,{heard,hidden:targets.length>0&&targets.every(w=>wordOpacity(w,snapshot,presentation)===0),assisted:assisted.current,plays:plays.current}))locked.current=false}
 return <><PracticeHeader label={courseLabel} level={q.level} onLevel={onLevel} onExit={onExit} value={index+(picked===null?0:1)} total={GENERATED_ROUND_SIZE} userId={userId}/><PracticeStage onReplay={play} prompt="Listen, then choose" correct={picked===null?null:picked===q.correct} onNext={onNext} onHelp={()=>{if(picked===null){assisted.current=true;saveSupport()}}} answers={{choices,selected:picked,disabled:!heard||picked!==null,onChoose:choose}}
 explanation={close=><PracticeHelpDialog onClose={close} title="Listen → choose the pictures"><PictureSentence document={q.document}/></PracticeHelpDialog>}
 question={<><div className="classroom foundation-noun"><div className="cw-sentence-board"><LanguageQuadrant scores={snapshot} request={{document:q.document,referenceObject:q.sceneChoices?.[q.correct].word,presentation:{...presentation,size:'phone',english:true,icons:true,keepIconsWhenFading:true,thaiMeanings:false,thaiTranslation:false,explanations:false,wordPicker:false}}}/></div></div>{audioError&&<button role="alert" onClick={play}>🔊 ↻ Tap to listen</button>}{saveError&&<button role="alert" onClick={retry}>Retry saving progress</button>}</>}/></>
}
