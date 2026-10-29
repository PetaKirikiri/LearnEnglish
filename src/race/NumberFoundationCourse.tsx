import {useEffect,useRef,useState} from 'react'
import {numberDeck,numberSentenceText,numberSentenceAudio,numberNounPool,numberPassed,foundationKey,type NumberPrompt} from './numberFoundation'
import WordSlotIcon from '../learning/sentenceMatrix/WordSlotIcon'
import VocabularyPicture from '../learning/VocabularyPicture'
import ExampleLanguage from '../learning/ExampleLanguage'
import PracticeStage from './PracticeStage'
import PracticeLayoutFixture from './PracticeLayoutFixture'
import BinaryAnswerZone, {type BinaryChoice} from './BinaryAnswerZone'
import './phonePractice.css'
import './numberFoundation.css'
import '../classroom/sentenceLine.css'
type Saved={version:2;module:1|2|3;sentenceComplete:boolean;deck:NumberPrompt[];answers:boolean[];picked:number|null;numberComplete:boolean}
function load(user?:string,minimumModule:1|3=1):Saved{
 try{
  const saved=JSON.parse(localStorage.getItem(foundationKey(user))??'null') as Saved|null
  if(saved&&[1,2,3].includes(saved.module)&&Array.isArray(saved.answers)&&saved.answers.length<=30&&saved.answers.every(a=>typeof a==='boolean')&&[null,0,1].includes(saved.picked)&&Array.isArray(saved.deck)&&saved.deck.length===30&&new Set(saved.deck.map(q=>q.id)).size===30&&saved.deck.every(q=>typeof q.plural==='boolean'&&/^[0-2]-/.test(q.id)&&q.id.slice(2)===q.word&&numberNounPool(saved.module).some(n=>q.word===(q.plural?n.plural:n.singular)&&q.thai===n.thai)&&q.audioUrl===`/audio/number-foundation/the-${q.word}.wav`)&&(saved.module===1||saved.numberComplete===true||minimumModule===3)&&(saved.module!==3||saved.sentenceComplete===true||minimumModule===3)){
   if(saved.module<minimumModule)return {version:2,module:minimumModule,deck:numberDeck(minimumModule),answers:[],picked:null,numberComplete:false,sentenceComplete:false}
   // Earlier module 2 tested verb choice, not sentence number recognition.
   if(saved.version!==2&&saved.module===2)return {version:2,module:2,deck:numberDeck(2),answers:[],picked:null,numberComplete:true,sentenceComplete:false}
   return {...saved,version:2,sentenceComplete:saved.sentenceComplete===true}
  }
 }catch{/* Storage is optional. */}
 return {version:2,sentenceComplete:false,module:minimumModule,deck:numberDeck(minimumModule),answers:[],picked:null,numberComplete:false}
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
  return {version:2,sentenceComplete:module===3,module,deck:numberDeck(module),answers:preview==='finished'?Array(30).fill(true):preview==='correct'?[true]:preview==='wrong'?[false]:[],picked:preview==='correct'?0:preview==='wrong'?1:null,numberComplete:module>1}
 })
 const [heard,setHeard]=useState(preview==='correct'||preview==='wrong'),[audioError,setAudioError]=useState(false)
 const audio=useRef<HTMLAudioElement|null>(null),locked=useRef(saved.picked!==null),request=useRef(0)
 const index=saved.answers.length-(saved.picked!==null?1:0),finished=saved.answers.length===30&&saved.picked===null
 const question=saved.deck[Math.min(index,29)],score=saved.answers.filter(Boolean).length,passed=finished&&numberPassed(saved.deck,saved.answers)
 const choices=saved.module!==3?['หนึ่งสิ่ง','หลายสิ่ง']:['is','are']
 useEffect(()=>{if(preview)return;try{localStorage.setItem(foundationKey(userId),JSON.stringify(saved))}catch{/* Continue without storage. */}},[saved,userId,preview])
 useEffect(()=>()=>{request.current++;audio.current?.pause()},[])
 function play(prompt=question){
  const current=++request.current
  audio.current?.pause();setAudioError(false)
  const player=new Audio(saved.module===2?numberSentenceAudio(prompt):prompt.audioUrl);audio.current=player
  player.onended=()=>{if(request.current===current)setHeard(true)}
  player.onerror=()=>{if(request.current===current)setAudioError(true)}
  void player.play().catch(()=>{if(request.current===current)setAudioError(true)})
 }
 function choose(side:number){
  if(!heard||locked.current||finished)return
  locked.current=true
  setSaved(value=>({...value,picked:side,answers:[...value.answers,side===(question.plural?1:0)]}))
 }
 function next(){
  if(!locked.current)return
  locked.current=false;setHeard(false);request.current++;audio.current?.pause()
  const nextPrompt=saved.deck[saved.answers.length]
  setSaved(value=>({...value,picked:null}))
  if(nextPrompt&&!import.meta.env.DEV)play(nextPrompt)
 }
 function restart(module:1|2|3){
  request.current++;audio.current?.pause();locked.current=false;setHeard(false);setAudioError(false)
  setSaved(value=>({version:2,sentenceComplete:value.sentenceComplete||passed&&value.module===2,module,deck:numberDeck(module),answers:[],picked:null,numberComplete:value.numberComplete||passed&&value.module===1}))
 }
 const title=saved.module===3?'เลือก is หรือ are':saved.module===2?'ฟังประโยค: หนึ่งสิ่งหรือหลายสิ่ง':'ฟัง: หนึ่งสิ่งหรือหลายสิ่ง'
 if(import.meta.env.DEV&&preview==='layout')return <PracticeLayoutFixture/>
 return <main className="phone-practice foundation-practice" lang="th"><div className="practice-shell">
  <header><img className="foundation-cap" src="/brand/success-university-su.svg" alt="Success University"/><progress className="foundation-progress" value={saved.answers.length} max={saved.deck.length} aria-label="ความคืบหน้าของบทฝึก" aria-valuetext={`ตอบแล้ว ${saved.answers.length} จาก ${saved.deck.length} ข้อ`}/>{!finished&&<button type="button" className="foundation-header-audio" aria-label="ฟังเสียง" title="ฟังเสียง" onClick={()=>play()}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14"/></svg></button>}</header>
  {finished?<section className="practice-complete practice-module-complete"><h1>{passed?'ผ่านชุดนี้แล้ว!':'จบแล้ว มาลองอีกครั้ง'}</h1><p>{title}</p><p className="practice-module-score">{score} / 30</p><p>{passed?'ทำได้ดีมาก!':'ตอบถูก 27 จาก 30 ข้อเพื่อผ่านชุดนี้'}</p>
   {passed&&saved.module===1&&<button onClick={()=>restart(2)}>ชุด 2 · ฟังทั้งประโยค →</button>}
   {passed&&saved.module===2&&<button onClick={()=>restart(3)}>ชุด 3 · is / are →</button>}
   {passed&&saved.module===3&&<p>คุณแยกหนึ่งสิ่งกับหลายสิ่ง และเลือก is / are ได้แล้ว</p>}
   <button onClick={()=>restart(saved.module)}>ฝึกชุดนี้อีกครั้ง</button><a className="practice-module-break" href={lessonHref}>พักก่อน</a>
  </section>:<>
   <PracticeStage question={<>
    {saved.module===1?<div className="classroom foundation-noun"><div className="cw-sentence-board"><ExampleLanguage matrix layout={{construction:'noun-phrase',noun:'phrase'}} settings={{explanations:false,wordPicker:false,explanationSelection:false,audio:false,layout:{density:'content',maxWidth:520}}} slotDetails={[{label:"Determiner",count:0,icon:<WordSlotIcon slot={2}/>},{label:"Noun",count:0,icon:<VocabularyPicture word={question.word}/>}]} english={`the ${question.word}`} thai="" units={[{english:'the',thai:'ที่กำลังพูดถึง'},{english:question.word,thai:question.thai}]}/></div></div>:<div className="classroom foundation-noun"><div className="cw-sentence-board"><ExampleLanguage matrix layout={{construction:'question',noun:'phrase'}} settings={{explanations:false,wordPicker:false,explanationSelection:false,audio:false,layout:{density:'content',maxWidth:520}}} semanticSlots={[0,1,2,3]} slotDetails={[{label:'Where',count:0,icon:<WordSlotIcon slot={0}/>},{label:saved.module===2?'Verb':'Missing verb',count:0,icon:<WordSlotIcon slot={1} plural={saved.module===2&&question.plural}/>},{label:'Determiner',count:0,icon:<WordSlotIcon slot={2}/>},{label:'Noun',count:0,icon:<VocabularyPicture word={question.word}/>}]} english={saved.module===2?numberSentenceText(question):`Where _____ the ${question.word}?`} thai="" units={[{english:'Where',thai:'ที่ไหน'},{english:saved.module===2?(question.plural?'are':'is'):'_____',thai:saved.module===2?'อยู่':''},{english:'the',thai:'ที่กำลังพูดถึง'},{english:`${question.word}?`,thai:question.thai}]}/></div></div>}

    {audioError&&<p role="alert">เล่นเสียงไม่ได้ แตะเพื่อฟังอีกครั้ง</p>}
   </>} answers={<BinaryAnswerZone disabled={!heard||saved.picked!==null} selected={saved.picked} onChoose={choose} choices={choices.map((choice,side)=>({id:choice,label:choice,state:saved.picked!==null&&side===(question.plural?1:0)?'correct':saved.picked===side?'incorrect':undefined,icon:saved.module!==3?<span className={`cw-game-icon cw-game-icon-${side===0?'apple':'apples'}`}/>:undefined,content:choice})) as [BinaryChoice,BinaryChoice]}/>}/>
   <footer className="practice-feedback" hidden={saved.picked===null}><p role="status">{saved.picked!==null&&<>{saved.answers.at(-1)?'ถูกต้อง!':'ยังไม่ถูก'} · <span lang="en">{saved.module===1?`the ${question.word}`:numberSentenceText(question)}</span></>}</p><button disabled={saved.picked===null} onClick={next}>ถัดไป →</button></footer>
  </>}
 </div></main>
}
