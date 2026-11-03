import {useCallback,useEffect,useRef,useState} from 'react'
import NumberFoundation from './NumberFoundationCourse'
import PracticeGold from './PracticeGold'
import type {PracticeLevel} from './PracticeLevelPicker'
import type {MatrixSettings} from '../learning/sentenceMatrix/model'
import LanguageQuadrant,{type LanguageDocument} from '../learning/sentenceMatrix/LanguageQuadrant'
import {actionPracticeQuestions} from './actionPracticeContent'
import {numberNounPool} from './numberFoundation'
import VocabularyPicture from '../learning/VocabularyPicture'
import {ActionIcon} from '../learning/sentenceMatrix/ActionVocabularyIcon'
import PronounIcon from '../learning/sentenceMatrix/PronounIcon'
import ProperNounIcon from '../learning/sentenceMatrix/ProperNounIcon'
import './practiceJourney.css'

export function levelPreview(level:PracticeLevel){
 const questions=actionPracticeQuestions.filter(q=>q.level===level)
 const role=level===4?'person':'action'
 const words=level<=3?numberNounPool(level).map(n=>n.singular):[...new Set(questions.flatMap(q=>q.units.filter(u=>u.role===role).map(u=>u.english.replace(/[?.]/g,'').trim())))]
 return {words,total:level<=3?30:Math.min(30,questions.length)}
}
function LevelLineup({level}:{level:PracticeLevel}){
 const {words,total}=levelPreview(level)
 return <span className="journey-briefing">
  <span className="journey-task-strip">
   <span className="journey-answer-preview" aria-label={level<=2?'หนึ่งหรือหลาย':level===3?'ถูกหรือผิด':'อังกฤษเป็นไทย'}>
    <span aria-hidden="true">♫</span><span aria-hidden="true">→</span>
    {level<=2?<><VocabularyPicture word="apple"/><span>/</span><VocabularyPicture word="apples"/></>:level===3?<><b className="preview-yes">✓</b><span>/</span><b className="preview-no">✕</b></>:<><span>🇬🇧</span><span>→</span><span>🇹🇭</span><b>× 2</b></>}
   </span>
   <span className="journey-round-count"><b>{total}</b> ข้อ</span>
  </span>
  <span className="journey-roster-heading">{level<=3?'คำศัพท์':level===4?'คน':'การกระทำ'} <b>× {words.length}</b></span>
  <span className="journey-roster">{words.map(word=><span className={`journey-roster-item ${level===5?'action':''}`} key={word}>
   {level<=3?<VocabularyPicture word={word}/>:level===5?<ActionIcon word={word}/>:['you','he','she','they','I','we'].includes(word)?<PronounIcon word={word}/>:word==='Bia'?<ProperNounIcon word={word}/>:<VocabularyPicture word={word.replace(/^the /,'')}/>}
   <span>{word}</span>
  </span>)}</span>
 </span>
}

const levels=[
 {id:1,title:'หนึ่งหรือหลาย',icon:'apples',hint:'ฟังคำ แล้วเลือกหนึ่งสิ่งหรือหลายสิ่ง',choices:['หนึ่งสิ่ง','หลายสิ่ง']},
 {id:2,title:'ฟังทั้งประโยค',icon:'clock',hint:'ฟังทั้งประโยค แล้วเลือกหนึ่งสิ่งหรือหลายสิ่ง',choices:['หนึ่งสิ่ง','หลายสิ่ง']},
 {id:3,title:'ถูกหรือผิด',icon:'mystery-apple',hint:'ฟัง แล้วดูว่า is / are ตรงกับจำนวนหรือไม่',choices:['ถูก','ผิด']},
 {id:4,title:'ใครกำลังทำอะไร',icon:'pin',hint:'ฟังคำถาม แล้วเลือกความหมายภาษาไทย',choices:['คุณกำลังทำอะไร','พวกเขากำลังทำอะไร']},
 {id:5,title:'กำลังทำอะไร',icon:'book',hint:'ฟังประโยค แล้วเลือกความหมายภาษาไทย',choices:['ฉันกำลังกินแอปเปิลหนึ่งลูก','ฉันกำลังนอน']},
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
 return <section className="journey-tutorial"><button className="journey-back" onClick={onBack} aria-label="กลับแผนที่">←</button><span className="journey-eyebrow">LEVEL {level}</span><h1>{item.title}</h1><p>{item.hint}</p><div className="journey-listen"><button onClick={play} aria-label="ฟังตัวอย่าง">▶</button><span>ฟัง → เลือก</span></div>{audioError&&<p role="alert">เล่นเสียงไม่ได้ ลองอีกครั้ง</p>}<div className="adaptive-practice-stage"><div className="classroom foundation-noun"><div className="cw-sentence-board"><div className="cw-sentence-display"><LanguageQuadrant request={{document:example.document,presentation:{size:'phone',thaiMeanings:false,thaiTranslation:false,fadeMode:false,icons:true}}}/></div></div></div></div><div className="journey-demo-answers">{item.choices.map((choice,index)=><button key={choice} onClick={()=>{setSelected(index);player.current?.pause()}} className={selected===index?(index===example.correct?'demo-correct':'demo-wrong'):''}>{level<=2?<span className={`cw-game-icon cw-game-icon-${index===0?'apple':'apples'}`}/>:level===3?<span>{index===0?'✓':'✕'}</span>:null}{choice}{selected===index&&<b>{index===example.correct?' ✓':' ↻'}</b>}</button>)}</div><div className="journey-demo-feedback" role="status">{selected===null?'ลองเลือกคำตอบ':selected===example.correct?'✓ ถูกต้อง':'ลองอีกครั้ง'}</div><p className="journey-goal">{level<=3?'★ ผ่าน: 27/30 · อย่างน้อย 12 ข้อต่อแบบ':'★ ผ่าน: ตอบถูกอย่างน้อย 90%'}</p><button className="journey-play" onClick={()=>{player.current?.pause();onStart()}}>เริ่มเล่น →</button></section>
}
export default function PracticeJourney(props:{userId?:string;minimumModule?:1|3;tester?:boolean;settings?:MatrixSettings}){
 return <Journey key={props.userId??'guest'} {...props}/>
}
function Journey(props:{userId?:string;minimumModule?:1|3;tester?:boolean;settings?:MatrixSettings}){
 const key=`englishsuccess:journey:v1:${props.userId??'guest'}`
 const [records,setRecords]=useState<JourneyRecord>(()=>{try{const data=JSON.parse(localStorage.getItem(key)??'{}');return Object.fromEntries(Object.entries(data??{}).filter(([id,value])=>{const r=value as RecordEntry;return [1,2,3,4,5].includes(Number(id))&&r&&Number.isFinite(r.best)&&r.best>=0&&r.total>0&&r.best<=r.total&&typeof r.cleared==='boolean'}))}catch{return {}}}),[screen,setScreen]=useState<'map'|'tutorial'|'run'|'result'>('map'),[level,setLevel]=useState<PracticeLevel>(props.minimumModule??1),[result,setResult]=useState<RunResult|null>(null)
 const complete=useCallback((level:PracticeLevel,score:number,total:number,passed:boolean)=>{const result={level,score,total,passed};setRecords(old=>mergeRun(old,result));setResult(result);setScreen('result')},[])
 useEffect(()=>{try{localStorage.setItem(key,JSON.stringify(records))}catch{}},[key,records])
 const select=(value:PracticeLevel)=>{setLevel(value);setScreen('tutorial')}
 const recommended=levels.find(item=>item.id>=(props.minimumModule??1)&&!records[item.id]?.cleared)?.id??5
 if(import.meta.env.DEV&&new URLSearchParams(location.search).has('preview'))return <NumberFoundation {...props}/>
 if(screen==='run')return <NumberFoundation {...props} initialLevel={level} newRun onLevelRequest={select} onComplete={complete} onExit={()=>setScreen('map')}/>
 return <main className="practice-journey" lang="th"><header className="journey-header"><img src="/brand/success-university-su.svg" alt="Success University"/><span>เส้นทางของฉัน</span><PracticeGold userId={props.userId}/></header>{screen==='tutorial'?<Tutorial key={level} level={level} onStart={()=>setScreen('run')} onBack={()=>setScreen('map')}/>:screen==='result'&&result?<section className="journey-result"><div className="journey-medal">{result.passed?'★':'↻'}</div><h1>{result.passed?'ผ่านแล้ว!':'ลองอีกครั้ง'}</h1><p>LEVEL {result.level}</p><strong>{result.score}<small> / {result.total}</small></strong><div className="journey-result-actions"><button className="journey-play" onClick={()=>select(result.passed&&level<5?(level+1) as PracticeLevel:level)}>{result.passed&&level<5?'ด่านต่อไป →':'เล่นอีกครั้ง ↻'}</button><button onClick={()=>setScreen('map')}>แผนที่</button></div></section>:<section className="journey-map"><div className="journey-intro"><div><span className="journey-eyebrow">LET’S PLAY</span><h1>พร้อมลุยไหม?</h1></div><div className="journey-clears"><span>★</span> {Object.values(records).filter(r=>r?.cleared).length}<small> / 5</small></div></div><div className="journey-path">{levels.map(item=>{const record=records[item.id],current=item.id===recommended;return <button key={item.id} className={`journey-node ${current?'current':''} ${record?.cleared?'cleared':''}`} onClick={()=>select(item.id)} aria-label={`Level ${item.id}: ${item.title}`}><span className="journey-node-number">{record?.cleared?'★':String(item.id).padStart(2,'0')}</span><span className="journey-node-content"><span className="journey-eyebrow">LEVEL {item.id}</span><strong>{item.title}</strong><span className="journey-node-score">{record?`★ ${record.best} / ${record.total}`:''}</span></span><span className="journey-node-arrow">{current?'▶':'→'}</span><LevelLineup level={item.id}/></button>})}</div></section>}</main>
}
