import ActionStarCourse from './ActionStarCourse'
import {requestedLesson} from '../learning/lessonRequests'
import {awardPracticeGold} from './PracticeGold'
import {useWordProgress} from '../learning/wordProgress/useWordProgress'
import type {MatrixSettings} from '../learning/sentenceMatrix/model'
import ActionPractice from './ActionPractice'
import type {PracticeLevel} from './PracticeLevelPicker'
import PracticeHeader from './PracticeHeader'
import {useEffect,useRef,useState} from 'react'
import {numberDeck,numberAnswer,withJudgement,numberSentenceText,numberSentenceAudio,numberPassed,foundationKey,type NumberPrompt} from './numberFoundation'
import {numberItem,numberAudio} from './numberCatalogue'
import {scheduledNumberDeck,nextRecallItem,recallPrompt,recallStates,recallKey,type RecallAttempt} from './numberRecall'
import {readRecall,saveRecall,syncRecall} from './numberRecallStore'
import {wordTokens,wordId,wordOpacity} from '../learning/wordProgress/model'
import LanguageQuadrant from '../learning/sentenceMatrix/LanguageQuadrant'
import PracticeStage from './PracticeStage'
import PracticePatternExplanation from './PracticePatternExplanation'
import PracticeLayoutFixture from './PracticeLayoutFixture'
import {PracticeAnswerIcon, type BinaryChoice} from './BinaryAnswerZone'
import './phonePractice.css'
import './numberFoundation.css'
import '../classroom/sentenceLine.css'
type Saved={version:3;manualLevel?:boolean;module:1|2|3;sentenceComplete:boolean;deck:NumberPrompt[];answers:boolean[];picked:number|null;numberComplete:boolean}
function fresh(module:1|2|3,user?:string):Saved{return {version:3,module,deck:scheduledNumberDeck(module,readRecall(user)),answers:[],picked:null,numberComplete:false,sentenceComplete:false}}
function load(user?:string,minimumModule:1|3=1):Saved{
 try{
  const saved=JSON.parse(localStorage.getItem(foundationKey(user))??'null')
  if(saved&&[1,2,3].includes(saved.module)&&Array.isArray(saved.answers)&&saved.answers.length<=30&&saved.answers.every((a:unknown)=>typeof a==='boolean')&&[null,0,1].includes(saved.picked)&&Array.isArray(saved.deck)&&saved.deck.length<=30&&saved.answers.length<=saved.deck.length&&new Set(saved.deck.map((q:NumberPrompt)=>q.id)).size===saved.deck.length&&saved.deck.every((q:NumberPrompt)=>{const item=numberItem(q.word);return item&&q.plural===item.pluralForm&&q.thai===item.thai&&q.audioUrl===numberAudio(q.word)})&&(saved.picked===null||saved.answers.length>0)&&(saved.manualLevel===true||saved.module===1||saved.numberComplete===true||minimumModule===3)&&(saved.manualLevel===true||saved.module!==3||saved.sentenceComplete===true||minimumModule===3)){
   if(saved.module===3&&saved.deck.some((q:NumberPrompt)=>!['is','are'].includes(q.verb??'')))return {...fresh(3,user),numberComplete:saved.numberComplete===true,sentenceComplete:saved.sentenceComplete===true}
   if(!saved.manualLevel&&saved.module<minimumModule)return fresh(minimumModule,user)
   if(!saved.version&&saved.module===2)return {...fresh(2,user),numberComplete:true}
   return {...saved,version:3,deck:saved.deck.map((q:NumberPrompt)=>({...q,id:/^[0-2]-/.test(q.id)?crypto.randomUUID():q.id})),sentenceComplete:saved.sentenceComplete===true}
  }
 }catch{/* Start from the learner's recall history if the saved session is invalid. */}
 return fresh(minimumModule,user)
}
export default function NumberFoundation(props:{userId?:string;minimumModule?:1|3;tester?:boolean;settings?:MatrixSettings;initialLevel?:PracticeLevel;onLevelRequest?:(level:PracticeLevel)=>void;onComplete?:(level:PracticeLevel,score:number,total:number,passed:boolean)=>void;onExit?:()=>void;newRun?:boolean}){
 const key=`englishsuccess:practice-level:${props.userId??'guest'}`
 const [level,setLevel]=useState<PracticeLevel>(()=>{if(props.initialLevel)return props.initialLevel;try{const chosen=Number(localStorage.getItem(key));if([1,2,3,4,5,6].includes(chosen))return chosen as PracticeLevel}catch{}return load(props.userId,props.minimumModule).module})
 function change(value:PracticeLevel){if(props.onLevelRequest){props.onLevelRequest(value);return}try{localStorage.setItem(key,String(value))}catch{}setLevel(value)}
 if(level===6)return <ActionStarCourse settings={props.settings} onLevel={change} userId={props.userId} onExit={props.onExit} onComplete={(score,total)=>props.onComplete?.(6,score,total,true)}/>
 return level>=4?<ActionPractice key={level} level={level as 4|5|6} onLevel={change} userId={props.userId} settings={props.settings} onComplete={props.onComplete} onExit={props.onExit}/>:<NumberLevels key={level} {...props} selectedLevel={level as 1|2|3} onLevel={change}/>
}
function NumberLevels({userId,minimumModule=1,selectedLevel,onLevel,onComplete,onExit,newRun,settings={fadeMode:true}}:{userId?:string;minimumModule?:1|3;selectedLevel:1|2|3;onLevel:(level:PracticeLevel)=>void;tester?:boolean;settings?:MatrixSettings;onComplete?:(level:PracticeLevel,score:number,total:number,passed:boolean)=>void;onExit?:()=>void;newRun?:boolean}){
 const progress=useWordProgress(userId)
 const refreshProgress=progress.retry
 const lesson=requestedLesson(location.search)
 const lessonHref=`${window.innerWidth>=1024?'/classroom/index.html':'/english/notes'}?lesson=${lesson}`
 const preview=import.meta.env.DEV?new URLSearchParams(location.search).get('preview'):null
 const [saved,setSaved]=useState<Saved>(()=>{
  if(newRun)return {...fresh(selectedLevel,userId),manualLevel:true}
  if(!['question','correct','wrong','finished'].includes(preview??'')){const previous=load(userId,minimumModule);return previous.module===selectedLevel?previous:{...fresh(selectedLevel,userId),manualLevel:true,numberComplete:previous.numberComplete||previous.module===1&&numberPassed(previous.deck,previous.answers),sentenceComplete:previous.sentenceComplete||previous.module===2&&numberPassed(previous.deck,previous.answers)}}
  const moduleParam=Number(new URLSearchParams(location.search).get('module'))
  const module=moduleParam===2||moduleParam===3?moduleParam:1
  return {version:3,sentenceComplete:module===3,module,deck:numberDeck(module),answers:preview==='finished'?Array(30).fill(true):preview==='correct'?[true]:preview==='wrong'?[false]:[],picked:preview==='correct'?0:preview==='wrong'?1:null,numberComplete:module>1}
 })
 const events=useRef<RecallAttempt[]>(readRecall(userId))
 const assisted=useRef(false),replays=useRef(0)
 const [saveError,setSaveError]=useState(false)
 const [heard,setHeard]=useState(preview==='correct'||preview==='wrong'),[audioError,setAudioError]=useState(false)
 const audio=useRef<HTMLAudioElement|null>(null),locked=useRef(saved.picked!==null),request=useRef(0)
 const index=saved.answers.length-(saved.picked!==null?1:0),finished=saved.answers.length===saved.deck.length&&saved.picked===null
 const question=saved.deck[Math.min(index,saved.deck.length-1)]??numberDeck()[0],score=saved.answers.filter(Boolean).length,passed=finished&&numberPassed(saved.deck,saved.answers)
 useEffect(()=>{if(finished)onComplete?.(saved.module,score,saved.deck.length,passed)},[finished,onComplete,saved.module,score,saved.deck.length,passed])
 const [support,setSupport]=useState(()=>preview?0:recallStates(readRecall(userId))[recallKey(saved.module,question.word)]?.support??0)
 // Restore the complete pattern after an answer, without changing the recorded support.
 const fade=settings.fadeMode!==false&&saved.picked===null&&(support>0||wordTokens(numberSentenceText(question)).some(word=>wordOpacity(word,progress.scores,{...settings,fadeMode:true})<1))
 const fadeWords=[...wordTokens(question.word),...(saved.module===2?[question.plural?'are':'is']:[])]
 const fadeScores={...progress.scores}
 // Retain earned adaptive support alongside the shared per-word score.
 for(const word of fadeWords){const start=settings.fadeStart??5,end=settings.fadeEnd??25;fadeScores[wordId(word)]=Math.max(fadeScores[wordId(word)]??0,support?start+(end-start)*support/3:0)}
 // Audio failures or autoplay restrictions must never leave answers unclickable.
 const canAnswer=true
 const choices=saved.module!==3?['หนึ่งสิ่ง','หลายสิ่ง']:['ถูก','ผิด']
 useEffect(()=>{if(preview)return;try{localStorage.setItem(foundationKey(userId),JSON.stringify(saved))}catch{/* Continue without storage. */}},[saved,userId,preview])
 useEffect(()=>()=>{request.current++;audio.current?.pause()},[])
 useEffect(()=>{
  if(!userId||preview)return
  let active=true
  const retry=()=>{void syncRecall(userId).catch(()=>{/* Pending answers remain on the device. */}).finally(()=>{if(active){events.current=readRecall(userId);void refreshProgress()}})}
  retry()
  const timer=window.setInterval(retry,30000)
  window.addEventListener('online',retry)
  window.addEventListener('focus',retry)
  return()=>{active=false;window.clearInterval(timer);window.removeEventListener('online',retry);window.removeEventListener('focus',retry)}
 },[userId,preview,refreshProgress])
 function play(prompt=question){
  replays.current++
  const current=++request.current
  audio.current?.pause();setAudioError(false)
  const player=new Audio(saved.module!==1?numberSentenceAudio(prompt):prompt.audioUrl);audio.current=player
  player.onended=()=>{if(request.current===current)setHeard(true)}
  player.onerror=()=>{if(request.current===current)setAudioError(true)}
  void player.play().catch(()=>{if(request.current===current)setAudioError(true)})
 }
 useEffect(()=>{
  if(!finished&&!preview)play(question)
  return()=>{request.current++;audio.current?.pause()}
  // Each new question owns exactly one automatic playback.
  // eslint-disable-next-line react-hooks/exhaustive-deps
 },[question.id,saved.module,finished])
 function choose(side:number){
  if(!canAnswer||locked.current||finished)return
  const correct=side===numberAnswer(question,saved.module)
  if(!preview){
   const event:RecallAttempt={id:question.id,word:question.word,module:saved.module,answer:side,correct,at:Date.now(),assisted:assisted.current,heard,replays:replays.current,support,...(saved.module===3?{verb:question.verb}:{})}
   try{saveRecall(event,userId);setSaveError(false)}catch{setSaveError(true);return}
   awardPracticeGold(question.id,correct,userId)
   events.current=readRecall(userId)
   if(userId)void syncRecall(userId).catch(()=>{/* Retain the outbox for the next connection. */}).finally(()=>{void refreshProgress()})
  }
  locked.current=true
  setSaved(value=>({...value,picked:side,answers:[...value.answers,side===numberAnswer(question,saved.module)]}))
 }
 function next(){
  if(!locked.current)return
  locked.current=false;setHeard(false);request.current++;audio.current?.pause();assisted.current=false;replays.current=0
  let deck=saved.deck
  if(!preview&&saved.answers.length<30){
   events.current=readRecall(userId)
   const item=nextRecallItem(saved.module,events.current,saved.deck.slice(0,saved.answers.length))
   deck=item?[...saved.deck.slice(0,saved.answers.length),withJudgement(recallPrompt(item),saved.module,saved.deck.slice(0,saved.answers.length)),...saved.deck.slice(saved.answers.length+1)]:saved.deck.slice(0,saved.answers.length)
  }
  const nextPrompt=deck[saved.answers.length]
  setSupport(preview||!nextPrompt?0:recallStates(events.current)[recallKey(saved.module,nextPrompt.word)]?.support??0)
  setSaved(value=>({...value,deck,picked:null}))

 }
 function restart(module:1|2|3,manual=false){
  request.current++;audio.current?.pause();locked.current=false;setHeard(false);setAudioError(false);assisted.current=false;replays.current=0
  events.current=readRecall(userId)
  const deck=preview?numberDeck(module):scheduledNumberDeck(module,events.current)
  setSupport(preview||!deck[0]?0:recallStates(events.current)[recallKey(module,deck[0].word)]?.support??0)
  setSaved(value=>({version:3,manualLevel:manual||value.manualLevel,sentenceComplete:value.sentenceComplete||passed&&value.module===2,module,deck,answers:[],picked:null,numberComplete:value.numberComplete||passed&&value.module===1}))
 }
 const title=saved.module===3?'ประโยคนี้ถูกหรือผิด':saved.module===2?'ฟังประโยค: หนึ่งสิ่งหรือหลายสิ่ง':'ฟัง: หนึ่งสิ่งหรือหลายสิ่ง'
 if(import.meta.env.DEV&&preview==='layout')return <PracticeLayoutFixture/>
 return <main className="phone-practice foundation-practice" lang="th"><div className="practice-shell">
  <PracticeHeader level={saved.module} onLevel={onLevel} value={saved.answers.length} total={saved.deck.length} userId={userId} onExit={onExit} onReplay={finished?undefined:()=>play()}/>
  {finished?<section className="practice-complete practice-module-complete"><h1>{saved.deck.length<30?'ทบทวนครบแล้ว':passed?'ผ่านชุดนี้แล้ว!':'จบแล้ว มาลองอีกครั้ง'}</h1><p>{title}</p>{saved.deck.length>0&&<p className="practice-module-score">{score} / {saved.deck.length}</p>}<p>{saved.deck.length<30?'คำที่ฝึกได้ดีแล้วจะกลับมาให้ทบทวนภายหลัง':passed?'ทำได้ดีมาก!':'ตอบถูก 27 จาก 30 ข้อเพื่อผ่านชุดนี้'}</p>
   {passed&&saved.module===1&&<button onClick={()=>onLevel(2)}>ชุด 2 · ฟังทั้งประโยค →</button>}
   {passed&&saved.module===2&&<button onClick={()=>onLevel(3)}>ชุด 3 · ถูกหรือผิด →</button>}
   {passed&&saved.module===3&&<button onClick={()=>onLevel(4)}>Level 4 →</button>}{passed&&saved.module===3&&<p>คุณตรวจได้แล้วว่า is / are ตรงกับจำนวนหรือไม่</p>}
   <button onClick={()=>restart(saved.module)}>ฝึกชุดนี้อีกครั้ง</button><a className="practice-module-break" href={lessonHref}>พักก่อน</a>
  </section>:<>
   <PracticeStage question={<>
    <div className="classroom foundation-noun"><div className="cw-sentence-board"><LanguageQuadrant scores={fadeScores} request={{presentation:{...settings,fadeMode:fade,keepIconsWhenFading:true,explanations:false,wordPicker:false,explanationSelection:false,audio:false,size:'phone',layout:{density:'content',maxWidth:520}},document:saved.module===1?{construction:'noun-phrase',english:`the ${question.word}`,thai:'',units:[{english:'the',thai:'ที่กำลังพูดถึง',role:'determiner'},{english:question.word,thai:question.thai,role:'object'}]}:{construction:'question',english:numberSentenceText(question),thai:'',units:[{english:'Where',thai:'ที่ไหน',role:'question'},{english:question.verb??(question.plural?'are':'is'),thai:'อยู่',role:'be'},{english:'the',thai:'ที่กำลังพูดถึง',role:'determiner'},{english:`${question.word}?`,thai:question.thai,role:'object'}]}}}/></div></div>

    {saveError&&<p role="alert">บันทึกคำตอบไม่ได้ กรุณาลองอีกครั้ง</p>}
    {audioError&&<p role="alert">เล่นเสียงไม่ได้ แตะเพื่อฟังอีกครั้ง</p>}
   </>}
    prompt={saved.module===3?'ประโยคนี้ถูกหรือผิด?':'หนึ่งสิ่งหรือหลายสิ่ง?'}
    correct={saved.picked===null?null:saved.answers.at(-1)===true}
    onNext={next}
    onHelp={()=>{if(saved.picked===null)assisted.current=true}}
    explanation={close=><PracticePatternExplanation question={question} module={saved.module} onClose={close}/>}
    answers={{disabled:!canAnswer||saved.picked!==null,selected:saved.picked,onChoose:choose,
     choices:choices.map((choice,side)=>({id:choice,label:choice,state:saved.picked!==null&&side===numberAnswer(question,saved.module)?'correct':saved.picked===side?'incorrect':undefined,icon:<PracticeAnswerIcon kind={saved.module===3?'judgement':'number'} second={side===1}/>,content:choice})) as [BinaryChoice,BinaryChoice]}}/>

  </>}
 </div></main>
}
