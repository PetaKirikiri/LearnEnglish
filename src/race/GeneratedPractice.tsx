import {getPlaybackMode} from '../audio/usePlaybackMode'
import type {SpokenWord} from '../audio/sentenceTiming'
import LandscapePractice from './LandscapePractice'
import {useCallback,useEffect,useRef,useState} from 'react'
import LanguageQuadrant from '../learning/sentenceMatrix/LanguageQuadrant'
import type {MatrixSettings} from '../learning/sentenceMatrix/model'
import {useWordProgress} from '../learning/wordProgress/useWordProgress'
import {wordOpacity,wordTokens,WORD_RULE_VERSION,type WordScores} from '../learning/wordProgress/model'
import {loadEvidence,saveEvidence,evidenceScores,curriculumBaseline,type DeckOptions,type ListeningEvidence} from './generatedPracticeProgress'
import {GENERATED_ROUND_SIZE,type GeneratedQuestion} from './generatedPracticeContent'
import {playTimedSentence as playSentenceAudio,prepareSentenceAudio} from '../audio/sentenceAudio'
import {nextPersonalQuestion,nextAnswerCandidates} from './practiceForecast'
import type {PracticeLevel} from './PracticeLevelPicker'
import PracticeHeader from './PracticeHeader'
import PracticeStage from './PracticeStage'
import {AdaptivePracticeExplanation} from './PracticePatternExplanation'
import DistanceScene from '../learning/sentenceMatrix/DistanceScene'
import PictureSentence from './PictureSentence'
import {PracticeAnswerIcon,type BinaryChoice} from './BinaryAnswerZone'
import {awardPracticeGold} from './PracticeGold'
import './phonePractice.css'
import './numberFoundation.css'
import PracticeHelpDialog from './PracticeHelpDialog'

type Props={label?:string;level:PracticeLevel;userId?:string;settings?:MatrixSettings;onLevel?:(level:PracticeLevel)=>void;onExit?:()=>void;onComplete?:(level:PracticeLevel,score:number,total:number,passed:boolean,runId:string,unassisted:boolean)=>void;options?:DeckOptions;scope?:string}
type Run={questions:(GeneratedQuestion|null)[];id:string;questionIds:string[];flipped:boolean[];index:number;answers:boolean[];picked:number|null;attemptId:string;assisted:boolean;done:boolean}
const runKey=(props:Props)=>`englishsuccess:composed-run:v16:${props.userId??'guest'}:${props.level}:${props.scope??'main'}`
function loadRun(props:Props):Run|null{try{
 const s=JSON.parse(localStorage.getItem(runKey(props))??'null')
 if(s&&!s.done&&typeof s.id==='string'&&typeof s.attemptId==='string'&&Array.isArray(s.questions)&&s.questions.length===30&&Array.isArray(s.questionIds)&&s.questionIds.length===30&&s.questions.every((q:GeneratedQuestion|null,index:number)=>q===null||q&&q.id===s.questionIds[index]&&q.document?.english&&q.choices?.length===2&&[0,1].includes(q.correct))&&s.questions[s.index]&&Number.isInteger(s.index)&&s.index>=0&&s.index<30&&Array.isArray(s.answers)&&s.answers.every((b:unknown)=>typeof b==='boolean')&&[null,0,1].includes(s.picked)&&s.answers.length===s.index+(s.picked===null?0:1))return s
 }catch{/* A legacy bank-only or invalid run starts with a directly served question. */}return null}
export default function GeneratedPractice(props:Props){return <LandscapePractice><LearnerPractice key={`${props.userId??'guest'}:${props.level}:${props.scope??'main'}`} {...props}/></LandscapePractice>}
function LearnerPractice(props:Props){
 const progress=useWordProgress(props.userId)
 if(!progress.ready)return <main className="phone-practice foundation-practice"><div className="practice-shell"><PracticeHeader label={props.label} level={props.level} onLevel={props.onLevel} onExit={props.onExit} value={0} total={30}/>{progress.error?<button role="alert" onClick={()=>void progress.retry()}>Retry loading progress</button>:<p role="status">…</p>}</div></main>
 return <ReadyPractice {...props} progress={progress}/>
}
function createRun(props:Props,progress:ReturnType<typeof useWordProgress>):Run{
 const id=crypto.randomUUID(),history=loadEvidence(props.userId)
 const familiar=curriculumBaseline(progress.rows,history,props.userId)
 const first=nextPersonalQuestion(props.level,progress.rows,history,id,0,{...props.options,familiar})
 // Future positions are placeholders; only the current meal is ordered.
 const deck:(GeneratedQuestion|null)[]=Array.from({length:30},(_,index)=>index===0?first:null)
 const next:Run={questions:deck,id,questionIds:deck.map(q=>q?.id??''),flipped:deck.map(q=>q?.kind==='meaning'&&q.correct===1),index:0,answers:[],picked:null,attemptId:crypto.randomUUID(),assisted:false,done:false}
 localStorage.setItem(runKey(props),JSON.stringify(next));return next
}
function ReadyPractice({progress,...props}:Props&{progress:ReturnType<typeof useWordProgress>}){
 const [events,setEvents]=useState(()=>loadEvidence(props.userId)),[run,setRun]=useState<Run|null>(()=>{try{return loadRun(props)??createRun(props,progress)}catch{return null}}),[saveError,setSaveError]=useState(false)
 const scores=evidenceScores(progress.rows,events,props.settings),finished=useRef(false)
 function start(){try{setRun(createRun(props,progress));setSaveError(false);finished.current=false}catch{setSaveError(true)}}
 const persist=(next:Run)=>{localStorage.setItem(runKey(props),JSON.stringify(next));setRun(next);setSaveError(false)}
 function complete(next:Run){
  if(finished.current)return
  finished.current=true
  const score=next.answers.filter(Boolean).length
  props.onComplete?.(props.level,score,30,score>=27,next.id,!next.assisted)
 }
 const q=run?.questions[run.index]
 const branchPlan=useRef<{attemptId:string;now:number;rows:typeof progress.rows;events:ListeningEvidence[];evidence:string;candidates:GeneratedQuestion[]}|null>(null)
 const prepareNext=useCallback((evidence:Pick<ListeningEvidence,'heard'|'hidden'|'assisted'|'plays'>)=>{
  if(!run||!q||run.picked!==null||run.index>=29)return
  try{
   const now=branchPlan.current?.attemptId===run.attemptId?branchPlan.current.now:Date.now()
   const candidates=nextAnswerCandidates(props.level,progress.rows,events,run.id,run.index,q,run.attemptId,evidence,{...props.options,now})
   branchPlan.current={attemptId:run.attemptId,now,rows:progress.rows,events,evidence:JSON.stringify(evidence),candidates}
   void prepareSentenceAudio(candidates)
  }catch{/* Forecasting must never block the current question or an answer. */}
 },[run,q,props.level,props.options,progress.rows,events])

 function present(){
  if(!run||run.picked!==null||!q)return false
  try{
   const old=loadEvidence(props.userId).find(event=>event.id===run.attemptId)
   if(old&&old.phase!=='presented')return true
   const at=new Date().toISOString()
   const event:ListeningEvidence=old??{id:run.attemptId,questionId:q.id,level:props.level,sentence:q.document.english,targets:q.credit===null?[]:q.targetWords,vocabulary:q.vocabulary,correct:false,hidden:false,heard:false,assisted:false,plays:0,at,presentedAt:at,phase:'presented'}
   const saved=saveEvidence(event,props.userId)
   progress.record({event:'presented',id:event.id,questionId:q.id,recipe:q.recipe,version:q.version,answer:'',occurredAt:event.presentedAt??event.at,modality:'visible',replays:0,ruleVersion:WORD_RULE_VERSION})
   if(!old)setEvents(saved)
   return true
  }catch{setSaveError(true);return false}
 }
 function answer(side:number,evidence:Omit<ListeningEvidence,'id'|'questionId'|'level'|'sentence'|'targets'|'vocabulary'|'correct'|'at'>){
  if(!run||run.picked!==null||!q)return false
  const correct=side===q.correct,targets=q.credit===null?[]:q.targetWords
  const shown=loadEvidence(props.userId).find(event=>event.id===run.attemptId)
  const event:ListeningEvidence={...evidence,phase:'answered',presentedAt:shown?.presentedAt,id:run.attemptId,questionId:q.id,level:props.level,sentence:q.document.english,targets,vocabulary:q.vocabulary,correct,at:new Date().toISOString()}
  try{
   // Save the complete encounter. The server credits sentence exposure;
   // listening proof still requires the contrasted word to be hidden.
   progress.record({id:event.id,questionId:q.id,recipe:q.recipe,version:q.version,answer:q.choices[side],occurredAt:event.at,modality:event.hidden&&event.heard&&!event.assisted&&event.plays===1?'audio':'visible',replays:Math.max(0,event.plays-1),ruleVersion:WORD_RULE_VERSION})
   const saved=saveEvidence(event,props.userId)
   const questions=[...run.questions],questionIds=[...run.questionIds],flipped=[...run.flipped]
   if(run.index<29){
    const plan=branchPlan.current,matching=plan?.attemptId===run.attemptId&&plan.rows===progress.rows&&plan.events===events&&plan.evidence===JSON.stringify(evidence)
    const candidates=matching?plan.candidates:nextAnswerCandidates(props.level,progress.rows,events,run.id,run.index,q,run.attemptId,evidence,{...props.options,now:plan?.attemptId===run.attemptId?plan.now:Date.now()})
    const following=candidates[correct?1:0],index=run.index+1
    questions[index]=following;questionIds[index]=following.id;flipped[index]=following.kind==='meaning'&&following.correct===1
    void prepareSentenceAudio([following])
   }
   persist({...run,questions,questionIds,flipped,picked:side,answers:[...run.answers,correct],assisted:run.assisted||event.assisted})
   setEvents(saved);awardPracticeGold(event.id,correct,props.userId);return true
  }catch{setSaveError(true);return false}
 }
 function next(){if(!run||run.picked===null)return;try{if(run.index===29){const done={...run,done:true};persist(done);complete(done)}else {
 const index=run.index+1,questionIds=[...run.questionIds],flipped=[...run.flipped],questions=[...run.questions]
 {const question=questions[index]??nextPersonalQuestion(props.level,progress.rows,events,run.id,index,{...props.options,familiar:curriculumBaseline(progress.rows,events,props.userId)});questions[index]=question;questionIds[index]=question.id;flipped[index]=question.kind==='meaning'&&question.correct===1}
 persist({...run,questions,questionIds,flipped,index,picked:null,attemptId:crypto.randomUUID()})
 }}catch{setSaveError(true)}}
 return <main className={`phone-practice foundation-practice${props.options?.structure==='identify'?' identification-practice':''}`} lang="en"><div className="practice-shell">
 {!run?<><PracticeHeader label={props.label} level={props.level} onLevel={props.onLevel} onExit={props.onExit} userId={props.userId} value={0} total={30}/>{progress.error?<button role="alert" onClick={()=>void progress.retry()}>Retry loading progress</button>:<p role="status">…</p>}{<button role="alert" onClick={start}>Retry saving this set</button>}</>:run.done?<><PracticeHeader label={props.label} level={props.level} onLevel={props.onLevel} onExit={props.onExit} userId={props.userId} value={30} total={30}/><section className="practice-complete"><h1>{run.answers.filter(Boolean).length} / 30</h1><button onClick={start}>↻</button></section></>:q&&<GeneratedQuestionView courseLabel={props.label} key={run.attemptId} attemptId={run.attemptId} supportKey={runKey(props)+':presentation'} question={q} scores={scores} settings={props.settings} picked={run.picked} onPresented={present} onPrepareNext={prepareNext} onChoose={answer} onNext={next} userId={props.userId} onLevel={props.onLevel} onExit={props.onExit} index={run.index} saveError={saveError||!!progress.error} retry={()=>void progress.retry()}/>}
 </div></main>
}
type QuestionProps={cueOnly?:boolean;roundTotal?:number;courseLabel?:string;attemptId:string;supportKey:string;question:GeneratedQuestion;scores:WordScores;settings?:MatrixSettings;picked:number|null;onPresented:()=>boolean;onPrepareNext:(evidence:Pick<ListeningEvidence,'heard'|'hidden'|'assisted'|'plays'>)=>void;onChoose:(side:number,evidence:Pick<ListeningEvidence,'heard'|'hidden'|'assisted'|'plays'>)=>boolean;onNext:()=>void;userId?:string;onLevel?:Props['onLevel'];onExit?:()=>void;index:number;saveError:boolean;retry:()=>void}
export function GeneratedQuestionView({cueOnly=false,roundTotal=GENERATED_ROUND_SIZE,courseLabel,attemptId,supportKey,question:q,scores,settings,picked,onPresented,onPrepareNext,onChoose,onNext,userId,onLevel,onExit,index,saveError}:QuestionProps){
 const [spokenWord,setSpokenWord]=useState<SpokenWord|null>(null)
 const audioWave=useRef<{level:number;time:number;progress?:number;recording?:import('./../audio/audioWaveform').AudioWaveform}>({level:0,time:0})
 const [support]=useState(()=>{try{const old=JSON.parse(localStorage.getItem(supportKey)??'null');if(old?.id===attemptId&&old.scores&&typeof old.assisted==='boolean'&&Number.isInteger(old.plays)&&old.plays>=0&&Object.values(old.scores).every(v=>typeof v==='number'&&Number.isFinite(v)))return old as {id:string;scores:WordScores;plays:number;assisted:boolean}}catch{/* Retain fresh support when no presentation was saved. */}return {id:attemptId,scores:Object.fromEntries(wordTokens(q.document.english).map(w=>['en:'+w,scores['en:'+w]??0])),plays:0,assisted:false}})
 const snapshot=support.scores,[heard,setHeard]=useState(false),[audioError,setAudioError]=useState(false),[audioLoading,setAudioLoading]=useState(false)
 const audio=useRef<(()=>void)|null>(null),plays=useRef(support.plays),assisted=useRef(support.assisted),locked=useRef(picked!==null)
 const saveSupport=useCallback(()=>{try{localStorage.setItem(supportKey,JSON.stringify({...support,plays:plays.current,assisted:assisted.current}))}catch{assisted.current=true}},[supportKey,support])
 const presentation={...settings,fadeMode:settings?.fadeMode??true}
 const presented=useRef(false),presentCallback=useRef(onPresented),report=useRef(()=>{})
 useEffect(()=>{
  presentCallback.current=onPresented
  report.current=()=>{if(!presented.current&&!locked.current&&presentCallback.current())presented.current=true}
 })
 // Visible words count when rendered; an entirely hidden question counts only
 // when its audio actually starts. Preparation and failed playback earn nothing.
 useEffect(()=>{if(wordTokens(q.document.english).some(word=>wordOpacity(word,snapshot,presentation)>0)){saveSupport();report.current()}})

 const play=useCallback((mode=getPlaybackMode())=>{
  setHeard(false)
  audio.current?.()
  audio.current=playSentenceAudio({id:q.id,recipe:q.recipe,document:{english:q.document.english},audioUrl:q.audioUrl},{loading:setAudioLoading,waveform:(level,time,progress,recording)=>{audioWave.current.level=level;audioWave.current.time=time;audioWave.current.progress=progress;if(recording)audioWave.current.recording=recording},word:setSpokenWord,started:()=>{report.current();setAudioError(false);plays.current++;saveSupport()},ended:()=>setHeard(true),error:()=>setAudioError(true)},mode)
 },[q.id,q.document.english,q.audioUrl,saveSupport])
 useEffect(()=>{play();return()=>{audio.current?.();audio.current=null}},[play])
 useEffect(()=>{locked.current=picked!==null},[picked,saveError])
 const choices=q.choices.map((label,side)=>({id:String(side),label,content:q.sceneChoices?<span className="distance-answer"><DistanceScene {...q.sceneChoices[side]}/><strong>{label}</strong></span>:q.alternatives?<PictureSentence document={q.alternatives[side]} wordAlpha={cueOnly?word=>wordOpacity(word,scores,presentation):undefined}/>:label,icon:q.kind==='judgement'?<PracticeAnswerIcon kind="judgement" second={side===1}/>:undefined,state:picked!==null&&side===q.correct?'correct':picked===side?'incorrect':undefined})) as [BinaryChoice,BinaryChoice]
 useEffect(()=>{
  if(picked!==null)return
  const targets=q.listeningWords.flatMap(wordTokens)
  onPrepareNext({heard,hidden:targets.length>0&&targets.every(w=>wordOpacity(w,snapshot,presentation)===0),assisted:assisted.current||!heard,plays:plays.current})
 },[onPrepareNext,picked,heard,q,snapshot,audioLoading])
 function choose(side:number){if(locked.current)return;locked.current=true;const targets=q.listeningWords.flatMap(wordTokens);if(!onChoose(side,{heard,hidden:targets.length>0&&targets.every(w=>wordOpacity(w,snapshot,presentation)===0),assisted:assisted.current||!heard,plays:plays.current}))locked.current=false}
 return <><PracticeHeader label={courseLabel} level={q.level} onLevel={onLevel} onExit={onExit} value={index+(picked===null?0:1)} total={roundTotal} userId={userId}/><PracticeStage playbackLoading={audioLoading} playbackError={audioError} onReplay={()=>play()} prompt="Listen, then choose" correct={picked===null?null:picked===q.correct} onNext={onNext} onHelp={()=>{if(picked===null){assisted.current=true;saveSupport();const targets=q.listeningWords.flatMap(wordTokens);onPrepareNext({heard,hidden:targets.length>0&&targets.every(w=>wordOpacity(w,snapshot,presentation)===0),assisted:true,plays:plays.current})}}} answers={{choices,selected:picked,disabled:picked!==null,onChoose:choose}}
 explanation={close=>cueOnly?<PracticeHelpDialog title="เลือกคำตอบ" onClose={close}><p>ดูภาพ ฟังเสียง แล้วเลือกคำตอบที่เข้ากับภาพ</p></PracticeHelpDialog>:<AdaptivePracticeExplanation question={q} onClose={close}/>}
 question={<><div data-gap-cue={cueOnly&&q.listeningWords[0]?.includes(' … ')||undefined} className="classroom foundation-noun"><div className="cw-sentence-board"><LanguageQuadrant scores={snapshot} request={{document:q.document,referenceObject:q.sceneChoices?.[q.correct].word,presentation:{...presentation,...(cueOnly?{fadeMode:false}:{}),spokenWord,audioWave:audioWave.current,size:'phone',english:!cueOnly,icons:true,keepIconsWhenFading:true,thaiMeanings:false,thaiTranslation:false,explanations:false,wordPicker:false}}}/></div></div></>}/></>
}
