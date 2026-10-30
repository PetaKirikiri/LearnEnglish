import {useEffect,useRef,useState} from 'react'
import {numberDeck,numberAnswer,withJudgement,numberSentenceText,numberSentenceAudio,numberPassed,foundationKey,type NumberPrompt} from './numberFoundation'
import {numberItem,numberAudio} from './numberCatalogue'
import {scheduledNumberDeck,nextRecallItem,recallPrompt,recallStates,recallKey,type RecallAttempt} from './numberRecall'
import {readRecall,saveRecall,syncRecall} from './numberRecallStore'
import {wordTokens,wordId} from '../learning/wordProgress/model'
import WordSlotIcon from '../learning/sentenceMatrix/WordSlotIcon'
import VocabularyPicture from '../learning/VocabularyPicture'
import ExampleLanguage from '../learning/ExampleLanguage'
import PracticeStage from './PracticeStage'
import PracticePatternExplanation from './PracticePatternExplanation'
import PracticeLayoutFixture from './PracticeLayoutFixture'
import BinaryAnswerZone, {type BinaryChoice} from './BinaryAnswerZone'
import './phonePractice.css'
import './numberFoundation.css'
import '../classroom/sentenceLine.css'
type Saved={version:3;module:1|2|3;sentenceComplete:boolean;deck:NumberPrompt[];answers:boolean[];picked:number|null;numberComplete:boolean}
function fresh(module:1|2|3,user?:string):Saved{return {version:3,module,deck:scheduledNumberDeck(module,readRecall(user)),answers:[],picked:null,numberComplete:false,sentenceComplete:false}}
function load(user?:string,minimumModule:1|3=1):Saved{
 try{
  const saved=JSON.parse(localStorage.getItem(foundationKey(user))??'null')
  if(saved&&[1,2,3].includes(saved.module)&&Array.isArray(saved.answers)&&saved.answers.length<=30&&saved.answers.every((a:unknown)=>typeof a==='boolean')&&[null,0,1].includes(saved.picked)&&Array.isArray(saved.deck)&&saved.deck.length<=30&&saved.answers.length<=saved.deck.length&&new Set(saved.deck.map((q:NumberPrompt)=>q.id)).size===saved.deck.length&&saved.deck.every((q:NumberPrompt)=>{const item=numberItem(q.word);return item&&q.plural===item.pluralForm&&q.thai===item.thai&&q.audioUrl===numberAudio(q.word)})&&(saved.picked===null||saved.answers.length>0)&&(saved.module===1||saved.numberComplete===true||minimumModule===3)&&(saved.module!==3||saved.sentenceComplete===true||minimumModule===3)){
   if(saved.module===3&&saved.deck.some((q:NumberPrompt)=>!['is','are'].includes(q.verb??'')))return {...fresh(3,user),numberComplete:saved.numberComplete===true,sentenceComplete:saved.sentenceComplete===true}
   if(saved.module<minimumModule)return fresh(minimumModule,user)
   if(!saved.version&&saved.module===2)return {...fresh(2,user),numberComplete:true}
   return {...saved,version:3,deck:saved.deck.map((q:NumberPrompt)=>({...q,id:/^[0-2]-/.test(q.id)?crypto.randomUUID():q.id})),sentenceComplete:saved.sentenceComplete===true}
  }
 }catch{/* Start from the learner's recall history if the saved session is invalid. */}
 return fresh(minimumModule,user)
}
export default function NumberFoundation({userId,minimumModule=1}:{userId?:string;minimumModule?:1|3;tester?:boolean;settings?:unknown}){
 const lessonNumber=new URLSearchParams(location.search).get('lesson')
 const lesson=['1','2','3'].includes(lessonNumber??'')?lessonNumber:'1'
 const lessonHref=`${window.innerWidth>=1024?'/classroom/index.html':'/english/notes'}?lesson=${lesson}`
 const preview=import.meta.env.DEV?new URLSearchParams(location.search).get('preview'):null
 const [saved,setSaved]=useState<Saved>(()=>{
  if(!['question','correct','wrong','finished'].includes(preview??''))return load(userId,minimumModule)
  const moduleParam=Number(new URLSearchParams(location.search).get('module'))
  const module=moduleParam===2||moduleParam===3?moduleParam:1
  return {version:3,sentenceComplete:module===3,module,deck:numberDeck(module),answers:preview==='finished'?Array(30).fill(true):preview==='correct'?[true]:preview==='wrong'?[false]:[],picked:preview==='correct'?0:preview==='wrong'?1:null,numberComplete:module>1}
 })
 const events=useRef<RecallAttempt[]>(readRecall(userId))
 const assisted=useRef(false),replays=useRef(0)
 const [saveError,setSaveError]=useState(false)
 const [explaining,setExplaining]=useState(false)
 const [heard,setHeard]=useState(preview==='correct'||preview==='wrong'),[audioError,setAudioError]=useState(false)
 const audio=useRef<HTMLAudioElement|null>(null),locked=useRef(saved.picked!==null),request=useRef(0)
 const index=saved.answers.length-(saved.picked!==null?1:0),finished=saved.answers.length===saved.deck.length&&saved.picked===null
 const question=saved.deck[Math.min(index,saved.deck.length-1)]??numberDeck()[0],score=saved.answers.filter(Boolean).length,passed=finished&&numberPassed(saved.deck,saved.answers)
 const [support,setSupport]=useState(()=>preview?0:recallStates(readRecall(userId))[recallKey(saved.module,question.word)]?.support??0)
 // Restore the complete pattern after an answer, without changing the recorded support.
 const fade=support>0&&saved.picked===null
 const fadeWords=[...wordTokens(question.word),...(saved.module===2?[question.plural?'are':'is']:[])]
 const fadeScores=Object.fromEntries(fadeWords.map(word=>[wordId(word),support]))
 // Silent local development must remain interactive without playing classroom audio.
 const canAnswer=heard||import.meta.env.DEV
 const choices=saved.module!==3?['หนึ่งสิ่ง','หลายสิ่ง']:['ถูก','ผิด']
 useEffect(()=>{if(preview)return;try{localStorage.setItem(foundationKey(userId),JSON.stringify(saved))}catch{/* Continue without storage. */}},[saved,userId,preview])
 useEffect(()=>()=>{request.current++;audio.current?.pause()},[])
 useEffect(()=>{
  if(!userId||preview)return
  const retry=()=>{void syncRecall(userId).catch(()=>{/* Pending answers remain on the device. */})}
  window.addEventListener('online',retry)
  return()=>window.removeEventListener('online',retry)
 },[userId,preview])
 function play(prompt=question){
  replays.current++
  const current=++request.current
  audio.current?.pause();setAudioError(false)
  const player=new Audio(saved.module!==1?numberSentenceAudio(prompt):prompt.audioUrl);audio.current=player
  player.onended=()=>{if(request.current===current)setHeard(true)}
  player.onerror=()=>{if(request.current===current)setAudioError(true)}
  void player.play().catch(()=>{if(request.current===current)setAudioError(true)})
 }
 function choose(side:number){
  if(!canAnswer||locked.current||finished)return
  const correct=side===numberAnswer(question,saved.module)
  if(!preview){
   const event:RecallAttempt={id:question.id,word:question.word,module:saved.module,answer:side,correct,at:Date.now(),assisted:assisted.current,heard,replays:replays.current,support,...(saved.module===3?{verb:question.verb}:{})}
   try{saveRecall(event,userId);setSaveError(false)}catch{setSaveError(true);return}
   events.current=readRecall(userId)
   if(userId)void syncRecall(userId).catch(()=>{/* Retain the outbox for the next connection. */})
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
  if(nextPrompt&&!import.meta.env.DEV)play(nextPrompt)
 }
 function restart(module:1|2|3){
  request.current++;audio.current?.pause();locked.current=false;setHeard(false);setAudioError(false);assisted.current=false;replays.current=0
  events.current=readRecall(userId)
  const deck=preview?numberDeck(module):scheduledNumberDeck(module,events.current)
  setSupport(preview||!deck[0]?0:recallStates(events.current)[recallKey(module,deck[0].word)]?.support??0)
  setSaved(value=>({version:3,sentenceComplete:value.sentenceComplete||passed&&value.module===2,module,deck,answers:[],picked:null,numberComplete:value.numberComplete||passed&&value.module===1}))
 }
 const title=saved.module===3?'ประโยคนี้ถูกหรือผิด':saved.module===2?'ฟังประโยค: หนึ่งสิ่งหรือหลายสิ่ง':'ฟัง: หนึ่งสิ่งหรือหลายสิ่ง'
 if(import.meta.env.DEV&&preview==='layout')return <PracticeLayoutFixture/>
 return <main className="phone-practice foundation-practice" lang="th"><div className="practice-shell">
  <header><img className="foundation-cap" src="/brand/success-university-su.svg" alt="Success University"/><div className="foundation-progress-group"><span className="foundation-level">Level {saved.module}</span><progress className="foundation-progress" value={saved.answers.length} max={saved.deck.length} aria-label="ความคืบหน้าของบทฝึก" aria-valuetext={`ตอบแล้ว ${saved.answers.length} จาก ${saved.deck.length} ข้อ`}/></div>{!finished&&<button type="button" className="foundation-header-audio" aria-label="ฟังเสียง" title="ฟังเสียง" onClick={()=>play()}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14"/></svg></button>}</header>
  {finished?<section className="practice-complete practice-module-complete"><h1>{saved.deck.length<30?'ทบทวนครบแล้ว':passed?'ผ่านชุดนี้แล้ว!':'จบแล้ว มาลองอีกครั้ง'}</h1><p>{title}</p>{saved.deck.length>0&&<p className="practice-module-score">{score} / {saved.deck.length}</p>}<p>{saved.deck.length<30?'คำที่ฝึกได้ดีแล้วจะกลับมาให้ทบทวนภายหลัง':passed?'ทำได้ดีมาก!':'ตอบถูก 27 จาก 30 ข้อเพื่อผ่านชุดนี้'}</p>
   {passed&&saved.module===1&&<button onClick={()=>restart(2)}>ชุด 2 · ฟังทั้งประโยค →</button>}
   {passed&&saved.module===2&&<button onClick={()=>restart(3)}>ชุด 3 · ถูกหรือผิด →</button>}
   {passed&&saved.module===3&&<p>คุณตรวจได้แล้วว่า is / are ตรงกับจำนวนหรือไม่</p>}
   <button onClick={()=>restart(saved.module)}>ฝึกชุดนี้อีกครั้ง</button><a className="practice-module-break" href={lessonHref}>พักก่อน</a>
  </section>:<>
   <PracticeStage question={<>
    {saved.module===1?<div className="classroom foundation-noun"><div className="cw-sentence-board"><ExampleLanguage matrix layout={{construction:'noun-phrase',noun:'phrase'}} scores={fadeScores} settings={{fadeMode:fade,keepIconsWhenFading:true,fadeStart:0,fadeEnd:3,explanations:false,wordPicker:false,explanationSelection:false,audio:false,layout:{density:'content',maxWidth:520}}} slotDetails={[{label:"Determiner",count:0,icon:<WordSlotIcon slot={2}/>},{label:"Noun",count:0,icon:<VocabularyPicture word={question.word}/>}]} english={`the ${question.word}`} thai="" units={[{english:'the',thai:'ที่กำลังพูดถึง'},{english:question.word,thai:question.thai}]}/></div></div>:<div className="classroom foundation-noun"><div className="cw-sentence-board"><ExampleLanguage matrix layout={{construction:'question',noun:'phrase'}} scores={fadeScores} settings={{fadeMode:fade,keepIconsWhenFading:true,fadeStart:0,fadeEnd:3,explanations:false,wordPicker:false,explanationSelection:false,audio:false,layout:{density:'content',maxWidth:520}}} semanticSlots={[0,1,2,3]} slotDetails={[{label:'Where',count:0,icon:<WordSlotIcon slot={0}/>},{label:'Verb',count:0,icon:<WordSlotIcon slot={1} plural={(question.verb??(question.plural?'are':'is'))==='are'}/>},{label:'Determiner',count:0,icon:<WordSlotIcon slot={2}/>},{label:'Noun',count:0,icon:<VocabularyPicture word={question.word}/>}]} english={numberSentenceText(question)} thai="" units={[{english:'Where',thai:'ที่ไหน'},{english:question.verb??(question.plural?'are':'is'),thai:'อยู่'},{english:'the',thai:'ที่กำลังพูดถึง'},{english:`${question.word}?`,thai:question.thai}]}/></div></div>}

    {saveError&&<p role="alert">บันทึกคำตอบไม่ได้ กรุณาลองอีกครั้ง</p>}
    {audioError&&<p role="alert">เล่นเสียงไม่ได้ แตะเพื่อฟังอีกครั้ง</p>}
   </>} answers={<BinaryAnswerZone disabled={!canAnswer||saved.picked!==null} selected={saved.picked} onChoose={choose} choices={choices.map((choice,side)=>({id:choice,label:choice,state:saved.picked!==null&&side===numberAnswer(question,saved.module)?'correct':saved.picked===side?'incorrect':undefined,icon:saved.module!==3?<span className={`cw-game-icon cw-game-icon-${side===0?'apple':'apples'}`}/>:<img src={`/images/race/answer-${side===0?'correct':'wrong'}-v2.png`} alt="" aria-hidden="true"/>,content:choice})) as [BinaryChoice,BinaryChoice]}/>}/>
   <footer className="practice-feedback foundation-controls">
    <button type="button" className="foundation-help" aria-label="อธิบายรูปแบบประโยค" aria-haspopup="dialog" onClick={()=>{if(saved.picked===null)assisted.current=true;setExplaining(true)}}>?</button>
    <span className="foundation-result-announcement" role="status">{saved.picked!==null?(saved.answers.at(-1)?'ถูกต้อง':'ยังไม่ถูก'):''}</span>
    <button type="button" className="foundation-next" disabled={saved.picked===null} onClick={next}>ถัดไป →</button>
   </footer>
   {explaining&&<PracticePatternExplanation question={question} module={saved.module} onClose={()=>setExplaining(false)}/>}

  </>}
 </div></main>
}
