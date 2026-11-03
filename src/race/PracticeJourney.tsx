import ActionStarCourse from './ActionStarCourse'
import {useCallback,useEffect,useRef,useState} from 'react'
import NumberFoundation from './NumberFoundationCourse'
import PracticeGold from './PracticeGold'
import type {PracticeLevel} from './PracticeLevelPicker'
import type {MatrixSettings} from '../learning/sentenceMatrix/model'
import LanguageQuadrant,{type LanguageDocument} from '../learning/sentenceMatrix/LanguageQuadrant'
import {actionPracticeQuestions} from './actionPracticeContent'
import {numberNounPool} from './numberFoundation'
import ExampleLanguage from '../learning/sentenceMatrix/ExampleView'
import WordSlotIcon from '../learning/sentenceMatrix/WordSlotIcon'
import VocabularyPicture from '../learning/VocabularyPicture'
import BinaryAnswerZone,{BinaryAnswerButton,type BinaryChoice} from './BinaryAnswerZone'
import './practiceJourney.css'

export function levelPreview(level:PracticeLevel){
 const questions=actionPracticeQuestions.filter(q=>q.level===level)
 const role=level===4?'person':'action'
 const words=level<=3?numberNounPool(level).map(n=>n.singular):[...new Set(questions.flatMap(q=>q.units.filter(u=>u.role===role).map(u=>u.english.replace(/[?.]/g,'').trim())))]
 return {words,total:level===6?50:level<=3?30:Math.min(30,questions.length)}
}
function PreviewAnswers({level,selected,onChoose}:{level:PracticeLevel;selected:number|null;onChoose:(index:number)=>void}){
 const example=sample(level)
 const choices=levels[level-1].choices.map((label,side)=>({id:label,label,content:label,state:selected===side?(side===example.correct?'correct':'incorrect'):undefined,icon:level<=2?<span className={`cw-game-icon cw-game-icon-${side===0?'apple':'apples'}`}/>:level===3?<img src={`/images/race/answer-${side===0?'correct':'wrong'}-v2.png`} alt=""/>:undefined})) as [BinaryChoice,BinaryChoice]
 return <div className="foundation-practice journey-real-answers"><div className="practice-answer-area"><BinaryAnswerZone choices={choices} disabled={false} selected={selected} onChoose={onChoose}/></div></div>
}
export function guideExamples(level:PracticeLevel){
 if(level>=4){
  const first=actionPracticeQuestions.find(q=>q.level===level)!
  const second=actionPracticeQuestions.find(q=>q.level===level&&q.thai===first.choices[1])!
  return [first,second].map(q=>({document:{...q,construction:level===4?'action-question':'action-answer'} as LanguageDocument,audio:q.audioUrl,label:q.thai}))
 }
 return [0,1].map(index=>{
  const plural=level===3||index===1,word=plural?'keys':'key',be=level===3?(index===0?'are':'is'):(plural?'are':'is')
  const document:LanguageDocument=level===1?{construction:'noun-phrase',english:word,thai:'',units:[{english:word,thai:'',role:'object'}]}:{construction:'question',english:`Where ${be} the ${word}?`,thai:'',units:[{english:'Where',thai:'',role:'question'},{english:be,thai:'',role:'be'},{english:'the',thai:'',role:'determiner'},{english:`${word}?`,thai:'',role:'object'}]}
  return {document,audio:`/audio/number-foundation/${level===1?'the':`where-${be}-the`}-${word}.wav`,label:levels[level-1].choices[index]}
 })
}
// Teach only subject/agreement combinations that actually occur in this level.
export function subjectPairs(level:PracticeLevel){
 const pairs=new Map<string,string>()
 for(const q of actionPracticeQuestions.filter(q=>q.level===level)){
  const rawPerson=q.units.filter(u=>u.role==='person'||u.role==='person-determiner').map(u=>u.english).join(' ').trim()
  const person=rawPerson==='I'?'I':rawPerson.charAt(0).toLowerCase()+rawPerson.slice(1)
  const be=q.units.find(u=>u.role==='be')?.english.trim()
  if(person&&be)pairs.set(person,be)
 }
 const pronouns=['I','you','he','she','they','we','it']
 const all=[...pairs]
 return [...all.filter(([p])=>pronouns.includes(p)),...['is','are'].flatMap(be=>{const example=all.find(([p,b])=>!pronouns.includes(p)&&b===be);return example?[example]:[]})]
}
function TeachingMatrix({units}:{units:LanguageDocument['units']}){
 units=units.flatMap(u=>u.role==='person'&&u.english.startsWith('the ')?[{english:'the',thai:'',role:'person-determiner' as const},{...u,english:u.english.slice(4)}]:[u])
 return <LanguageQuadrant request={{document:{construction:units[0]?.role==='be'?'action-question':'action-answer',english:(units[0]?.role==='be'?'What ':'')+units.map(u=>u.english).join(' ')+(units[0]?.role==='be'?' doing?':' eating.'),thai:'',units:units[0]?.role==='be'?[{english:'What',thai:'',role:'question'},...units,{english:'doing?',thai:'',role:'action'}]:[...units,{english:'eating.',thai:'',role:'action'}]},presentation:{size:'compact',thaiMeanings:false,thaiTranslation:false,fadeMode:false,icons:true,wordPicker:false,explanations:false,audio:false,layout:{density:'content',maxWidth:520}}}}/>
}
function PatternLesson({level}:{level:PracticeLevel}){
 const pairs=subjectPairs(level)
 return <section className="journey-pattern" aria-label="Language pattern">
  {level<=3?<>
   <div className="journey-pattern-pairs classroom"><div className="cw-sentence-board journey-pattern-board">{[false,true].map(plural=><div className="journey-pattern-example" key={String(plural)}>
    <ExampleLanguage matrix english={level>1?`${plural?'are':'is'} key${plural?'**s**':''}`:`key${plural?'**s**':''}`} thai=""
     units={[...(level>1?[{english:plural?'are':'is',thai:''}]:[]),{english:plural?'keys':'key',thai:plural?'หลายสิ่ง':'หนึ่งสิ่ง'}]}
     semanticSlots={level>1?[1,3]:[3]}
     slotDetails={[...(level>1?[{label:'',count:0,icon:<WordSlotIcon slot={1} plural={plural}/>}]:[]),{label:'',count:0,icon:<VocabularyPicture word={plural?'keys':'key'}/>} ]}
     settings={{thaiTranslation:false,thaiMeanings:true,icons:true,fadeMode:false,wordPicker:false,explanations:false}}/>

   </div>)}</div></div>
   <p>{level===1?'คู่นี้: เติม s → หลายสิ่ง · ฟังเสียงท้ายคำ':'ดูจำนวนสิ่งของ → เลือก is หรือ are'}</p>
   {level===3&&<div className="journey-pattern-repair"><span>✗ is + keys</span><span>→</span><strong>✓ are + keys</strong><small>หลายสิ่ง ต้องใช้ are</small></div>}
  </>:<>
   <p>{level===4?'ถาม: วาง is / are ก่อนคน':'ตอบ: วาง am / is / are หลังคน'}</p>
   <div className="journey-subject-pairs">{pairs.map(([person,be])=><div key={person}>
    <TeachingMatrix units={(level===4?[{english:be,thai:'',role:'be' as const},{english:person,thai:'',role:'person' as const}]:[{english:person,thai:'',role:'person' as const},{english:be,thai:'',role:'be' as const}])}/>
   </div>)}</div>
   <p>you ใช้ are แม้พูดกับคนเดียว</p>
   {level===6&&<><p>ใช้รูปประโยคเดิม · เลือกสิ่งที่เข้ากับการกระทำ</p><div className="journey-subject-pairs classroom">{['holding','opening','washing'].map(verb=>{const q=actionPracticeQuestions.find(q=>q.level===6&&q.units.some(u=>u.role==='action'&&u.english===verb))!;return <div className="cw-sentence-board" key={verb}><LanguageQuadrant request={{document:{...q,construction:'action-answer'},presentation:{size:'compact',fadeMode:false,icons:true,thaiMeanings:true,thaiTranslation:true,wordPicker:false,explanations:false,audio:false,layout:{density:'content',maxWidth:720}}}}/></div>})}</div><p>our + สิ่งของ = ของพวกเรา</p></>}

   {level===5&&<div className="journey-pattern-repair"><strong>you → I</strong><small>ถามคุณ → ฉันตอบ</small></div>}
  </>}
 </section>
}
function AnswerGuide({level}:{level:PracticeLevel}){
 const [selected,setSelected]=useState<number|null>(null),player=useRef<HTMLAudioElement|null>(null)
 useEffect(()=>()=>player.current?.pause(),[])
 const play=(index:number)=>{player.current?.pause();player.current=new Audio(guideExamples(level)[index].audio);void player.current.play().catch(()=>{})}
 return <div className={`foundation-practice journey-pair-guide ${level>1?'journey-sentence-guide':''}`}><div className="practice-answer-area">{guideExamples(level).map((example,index)=><div className="journey-pair-row" key={example.document.english}>
  <div className="journey-pair-source">
   <button type="button" className="journey-example-audio" aria-label={`ฟัง: ${example.document.english}`} onClick={()=>play(index)}>🔊</button>
   {level===1?<div className="journey-pair-word"><VocabularyPicture word={index===0?'key':'keys'}/><strong>key{index===1&&<mark>s</mark>}</strong></div>:<div className="adaptive-practice-stage"><div className="classroom foundation-noun"><div className="cw-sentence-board"><div className="cw-sentence-display"><LanguageQuadrant request={{document:example.document,presentation:{size:'compact',thaiMeanings:false,thaiTranslation:false,fadeMode:false,icons:true,wordPicker:false,explanations:false,audio:false,layout:{density:'content',maxWidth:520}}}}/></div></div></div></div>}
  </div>
  <span className="journey-pair-arrow" aria-hidden="true">→</span>
  <BinaryAnswerButton index={index} selected={selected} disabled={false} onChoose={side=>{setSelected(side);play(index)}} choice={{id:example.document.english,label:example.label,content:example.label,icon:level<=2?<span className={`cw-game-icon cw-game-icon-${index===0?'apple':'apples'}`}/>:level===3?<img src={`/images/race/answer-${index===0?'correct':'wrong'}-v2.png`} alt=""/>:undefined}}/>
 </div>)}</div><span className="journey-preview-feedback">{level<=2?'ฟัง → หนึ่ง / หลาย':level===3?'is + หนึ่ง · are + หลาย':'ฟัง → เลือกความหมาย'}</span></div>
}
function LevelLineup({level}:{level:PracticeLevel}){
 const {total}=levelPreview(level)
 return <div className="journey-briefing">
  <div className="journey-task-strip"><span aria-hidden="true">🔊 →</span><span className="journey-round-count"><b>{total}</b> ข้อ</span></div>
  <PatternLesson level={level}/><AnswerGuide level={level}/>
 </div>
}

const levels=[
 {id:1,title:'หนึ่งหรือหลาย',icon:'apples',hint:'ฟังคำ แล้วเลือกหนึ่งสิ่งหรือหลายสิ่ง',choices:['หนึ่งสิ่ง','หลายสิ่ง']},
 {id:2,title:'ฟังทั้งประโยค',icon:'clock',hint:'ฟังทั้งประโยค แล้วเลือกหนึ่งสิ่งหรือหลายสิ่ง',choices:['หนึ่งสิ่ง','หลายสิ่ง']},
 {id:3,title:'ถูกหรือผิด',icon:'mystery-apple',hint:'ฟัง แล้วดูว่า is / are ตรงกับจำนวนหรือไม่',choices:['ถูก','ผิด']},
 {id:4,title:'ใครกำลังทำอะไร',icon:'pin',hint:'ฟังคำถาม แล้วเลือกความหมายภาษาไทย',choices:['คุณกำลังทำอะไร','พวกเขากำลังทำอะไร']},
 {id:5,title:'กำลังทำอะไร',icon:'book',hint:'ฟังประโยค แล้วเลือกความหมายภาษาไทย',choices:['ฉันกำลังกินแอปเปิลหนึ่งลูก','ฉันกำลังนอน']},
 {id:6,title:'ใครทำอะไร กับของใคร',icon:'book',hint:'ฟังว่าใครทำอะไร และของนั้นเป็นของใคร แล้วเลือกคำแปล',choices:['ฉันกำลังกินแอปเปิลของฉัน','ฉันกำลังกินแอปเปิลของคุณ']},
] as const
export type RunResult={level:PracticeLevel;score:number;total:number;passed:boolean}
type RecordEntry={best:number;total:number;cleared:boolean}
export type JourneyRecord=Partial<Record<PracticeLevel,RecordEntry>>
export function mergeRun(record:JourneyRecord,result:RunResult):JourneyRecord{
 if(result.total<=0||result.score<0||result.score>result.total)return record
 const old=record[result.level],better=!old||result.score/result.total>old.best/old.total
 return {...record,[result.level]:{best:better?result.score:old.best,total:better?result.total:old.total,cleared:!!old?.cleared||result.passed}}
}
export function sample(level:PracticeLevel):{document:LanguageDocument;audio:string;correct:number}{
 if(level>=4){const q=actionPracticeQuestions.find(q=>q.level===level)!;return {document:{...q,construction:level===4?'action-question':'action-answer'},audio:q.audioUrl,correct:0}}
 const units:LanguageDocument['units']=[{english:'Where',thai:'ที่ไหน',role:'question'},{english:'are',thai:'อยู่',role:'be'},{english:'the',thai:'ที่กำลังพูดถึง',role:'determiner'},{english:'keys?',thai:'กุญแจ',role:'object'}]
 return {document:level===1?{construction:'noun-phrase',english:'the keys',thai:'กุญแจ',units:[{english:'the',thai:'ที่กำลังพูดถึง',role:'determiner'},{english:'keys',thai:'กุญแจ',role:'object'}]}:{construction:'question',english:'Where are the keys?',thai:'กุญแจอยู่ที่ไหน',units},audio:level===1?'/audio/number-foundation/the-keys.wav':'/audio/number-foundation/where-are-the-keys.wav',correct:level===3?0:1}
}
function Tutorial({level,onStart,onBack}:{level:PracticeLevel;onStart:()=>void;onBack:()=>void}){
 const item=levels[level-1],example=sample(level),[selected,setSelected]=useState<number|null>(null),[audioError,setAudioError]=useState(false),player=useRef<HTMLAudioElement|null>(null)
 useEffect(()=>()=>player.current?.pause(),[])
 const play=()=>{player.current?.pause();const audio=new Audio(example.audio);player.current=audio;setAudioError(false);void audio.play().catch(()=>setAudioError(true))}
 return <section className="journey-tutorial"><button className="journey-back" onClick={onBack} aria-label="กลับแผนที่">←</button><span className="journey-eyebrow">LEVEL {level}</span><h1>{item.title}</h1><PatternLesson level={level}/><p>{item.hint}</p><div className="journey-listen"><button onClick={play} aria-label="ฟังตัวอย่าง">▶</button><span>ฟัง → เลือก</span></div>{audioError&&<p role="alert">เล่นเสียงไม่ได้ ลองอีกครั้ง</p>}<div className="adaptive-practice-stage"><div className="classroom foundation-noun"><div className="cw-sentence-board"><div className="cw-sentence-display"><LanguageQuadrant request={{document:example.document,presentation:{size:'phone',thaiMeanings:false,thaiTranslation:false,fadeMode:false,icons:true}}}/></div></div></div></div><PreviewAnswers level={level} selected={selected} onChoose={index=>{setSelected(index);player.current?.pause()}}/><div className="journey-demo-feedback" role="status">{selected===null?'ลองเลือกคำตอบ':selected===example.correct?'✓ ถูกต้อง':'ลองอีกครั้ง'}</div><p className="journey-goal">{level<=3?'★ ผ่าน: 27/30 · อย่างน้อย 12 ข้อต่อแบบ':'★ ผ่าน: ตอบถูกอย่างน้อย 90%'}</p><button className="journey-play" onClick={()=>{player.current?.pause();onStart()}}>เริ่มเล่น →</button></section>
}
export default function PracticeJourney(props:{userId?:string;minimumModule?:1|3;tester?:boolean;settings?:MatrixSettings}){
 return <Journey key={props.userId??'guest'} {...props}/>
}
function Journey(props:{userId?:string;minimumModule?:1|3;tester?:boolean;settings?:MatrixSettings}){
 const key=`englishsuccess:journey:v1:${props.userId??'guest'}`
 const [records,setRecords]=useState<JourneyRecord>(()=>{try{const data=JSON.parse(localStorage.getItem(key)??'{}');return Object.fromEntries(Object.entries(data??{}).filter(([id,value])=>{const r=value as RecordEntry;return [1,2,3,4,5,6].includes(Number(id))&&r&&Number.isFinite(r.best)&&r.best>=0&&r.total>0&&r.best<=r.total&&typeof r.cleared==='boolean'}))}catch{return {}}}),[screen,setScreen]=useState<'map'|'tutorial'|'run'|'result'>('map'),[level,setLevel]=useState<PracticeLevel>(props.minimumModule??1),[result,setResult]=useState<RunResult|null>(null)
 const complete=useCallback((level:PracticeLevel,score:number,total:number,passed:boolean)=>{const result={level,score,total,passed};setRecords(old=>mergeRun(old,result));setResult(result);setScreen('result')},[])
 useEffect(()=>{try{localStorage.setItem(key,JSON.stringify(records))}catch{}},[key,records])
 const select=(value:PracticeLevel)=>{setLevel(value);setScreen('tutorial')}
 const recommended=levels.find(item=>item.id>=(props.minimumModule??1)&&!records[item.id]?.cleared)?.id??6
 if(import.meta.env.DEV&&new URLSearchParams(location.search).has('preview'))return <NumberFoundation {...props}/>
 if(screen==='run'&&level===6)return <ActionStarCourse userId={props.userId} onExit={()=>setScreen('map')} onComplete={(score,total)=>complete(6,score,total,true)}/>
 if(screen==='run')return <NumberFoundation {...props} initialLevel={level} newRun onLevelRequest={select} onComplete={complete} onExit={()=>setScreen('map')}/>
 return <main className="practice-journey" lang="th"><header className="journey-header"><img src="/brand/success-university-su.svg" alt="Success University"/><span>เส้นทางของฉัน</span><PracticeGold userId={props.userId}/></header>{screen==='tutorial'?<Tutorial key={level} level={level} onStart={()=>setScreen('run')} onBack={()=>setScreen('map')}/>:screen==='result'&&result?<section className="journey-result"><div className="journey-medal">{result.passed?'★':'↻'}</div><h1>{result.passed?'ผ่านแล้ว!':'ลองอีกครั้ง'}</h1><p>LEVEL {result.level}</p><strong>{result.score}<small> / {result.total}</small></strong><div className="journey-result-actions"><button className="journey-play" onClick={()=>select(result.passed&&level<6?(level+1) as PracticeLevel:level)}>{result.passed&&level<6?'ด่านต่อไป →':'เล่นอีกครั้ง ↻'}</button><button onClick={()=>setScreen('map')}>แผนที่</button></div></section>:<section className="journey-map"><div className="journey-intro"><div><span className="journey-eyebrow">LET’S PLAY</span><h1>พร้อมลุยไหม?</h1></div><div className="journey-clears"><span>★</span> {Object.values(records).filter(r=>r?.cleared).length}<small> / 6</small></div></div><div className="journey-path">{levels.map(item=>{const record=records[item.id],current=item.id===recommended;return <article key={item.id} className={`journey-node ${current?'current':''} ${record?.cleared?'cleared':''}`}><button className="journey-node-open" onClick={()=>select(item.id)} aria-label={`Level ${item.id}: ${item.title}`}><span className="journey-node-number">{record?.cleared?'★':String(item.id).padStart(2,'0')}</span><span className="journey-node-content"><span className="journey-eyebrow">LEVEL {item.id}</span><strong>{item.title}</strong><span className="journey-node-score">{record?`★ ${record.best} / ${record.total}`:''}</span></span><span className="journey-node-arrow">{current?'▶':'→'}</span></button><LevelLineup level={item.id}/></article>})}</div></section>}</main>
}
