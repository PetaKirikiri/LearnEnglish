import {useCallback,useEffect,useState} from 'react'
import {JourneyPassNames,useJourneyPasses} from './JourneyPasses'
import ActionStarCourse from './ActionStarCourse'
import NumberFoundation from './NumberFoundationCourse'
import PracticeGold from './PracticeGold'
import type {PracticeLevel} from './PracticeLevelPicker'
import type {MatrixSettings} from '../learning/sentenceMatrix/model'
import LanguageQuadrant from '../learning/sentenceMatrix/LanguageQuadrant'
import ExampleLanguage from '../learning/ExampleLanguage'
import VocabularyPicture from '../learning/VocabularyPicture'
import Icon from '../ui/Icon'
import {PracticeAnswerIcon} from './BinaryAnswerZone'
import {briefingFor,journeyBriefings,type LevelBriefing} from './journeyBriefings'
import './practiceJourney.css'

export type RunResult={level:PracticeLevel;score:number;total:number;passed:boolean}
type RecordEntry={best:number;total:number;cleared:boolean;stars?:number}
export type JourneyRecord=Partial<Record<PracticeLevel,RecordEntry>>
/** Only complete assessed rounds earn performance stars. Short review runs cannot earn them. */
export function runStars(result:RunResult){
 if(result.level===6||result.total!==briefingFor(result.level).total)return 0
 if(result.passed&&result.score===result.total)return 3
 if(result.passed)return 2
 return result.score>=Math.ceil(result.total*.7)?1:0
}
export function recordStars(level:PracticeLevel,record?:RecordEntry){
 if(!record)return 0
 return Math.max(record.stars??0,runStars({level,score:record.best,total:record.total,passed:record.cleared}))
}
export function mergeRun(record:JourneyRecord,result:RunResult):JourneyRecord{
 if(result.total!==(result.level===6?150:briefingFor(result.level).total))return record
 if(!Number.isInteger(result.total)||result.total<=0||!Number.isInteger(result.score)||result.score<0||result.score>result.total)return record
 const old=record[result.level],better=!old||result.score/result.total>old.best/old.total
 return {...record,[result.level]:{best:better?result.score:old.best,total:better?result.total:old.total,cleared:!!old?.cleared||result.passed,stars:Math.max(recordStars(result.level,old),runStars(result))}}
}
function loadRecords(key:string):JourneyRecord{
 try{
  const data=JSON.parse(localStorage.getItem(key)??'{}')
  return Object.fromEntries(Object.entries(data??{}).filter(([id,value])=>{
   const r=value as RecordEntry
   return [1,2,3,4,5,6].includes(Number(id))&&r&&Number.isInteger(r.best)&&r.best>=0&&Number.isInteger(r.total)&&r.total>0&&r.best<=r.total&&typeof r.cleared==='boolean'&&(r.stars===undefined||(Number.isInteger(r.stars)&&r.stars>=0&&r.stars<=3))
  }))
 }catch{return {}}
}
/** The map previews real, complete examples. The response cue describes the
 * assessment, while the shared engine owns every word's layout and colour. */
const previewSettings:MatrixSettings={english:true,thaiMeanings:false,thaiTranslation:false,fadeMode:false,icons:true,wordPicker:false,explanations:false,audio:false,layout:{density:'thumbnail'}}
function LevelArtwork({item}:{item:LevelBriefing}){
 const example=item.examples[item.id===6?1:0]
 return <div className="journey-level-art">
  <div className={`journey-art-words classroom${item.id===1?' journey-art-pair':''}`}>
   {item.id===1?item.examples.map(example=>{
    const noun=example.document.units.find(unit=>unit.role==='object')!
    return <div className="cw-sentence-board" key={noun.english}>
     <ExampleLanguage matrix english={noun.english} thai="" units={[noun]} semanticSlots={[3]}
      layout={{construction:'noun-phrase',noun:'single'}}
      slotDetails={[{label:'',count:0,icon:<VocabularyPicture word={noun.english}/>}]} settings={previewSettings}/>
    </div>
   }):<div className="cw-sentence-board"><LanguageQuadrant request={{document:example.document,presentation:{...previewSettings,size:'compact'}}}/></div>}
  </div>
 </div>
}
function LevelTask({item}: {item: LevelBriefing}) {
 const translate = item.id >= 4
 const kind = item.id === 3 ? 'judgement' : 'number'
 return <span className="journey-topic" id={`journey-task-${item.id}`} role="img" aria-label={item.task}>
  <span className="journey-cue">
   {translate
    ? <span className="journey-flag" aria-hidden="true">🇬🇧</span>
    : <img src="/classroom/icons/listening-headphones.png" alt="" draggable={false}/>}
  </span>
  <Icon name="arrow" className="journey-cue-arrow"/>
  {translate
   ? <span className="journey-cue"><span className="journey-flag" aria-hidden="true">🇹🇭</span></span>
   : <span className="journey-cue-pair">
     <span className="journey-cue"><PracticeAnswerIcon kind={kind} second={false}/></span>
     <span className="journey-cue"><PracticeAnswerIcon kind={kind} second/></span>
    </span>}
 </span>
}
export default function PracticeJourney(props:{userId?:string;minimumModule?:1|3;tester?:boolean;settings?:MatrixSettings}){
 return <Journey key={props.userId??'guest'} {...props}/>
}
function Journey(props:{userId?:string;minimumModule?:1|3;tester?:boolean;settings?:MatrixSettings}){
 const key=`englishsuccess:journey:v1:${props.userId??'guest'}`
 const [records,setRecords]=useState<JourneyRecord>(()=>loadRecords(key)),[screen,setScreen]=useState<'map'|'run'|'result'>('map'),[level,setLevel]=useState<PracticeLevel>(props.minimumModule??1),[result,setResult]=useState<RunResult|null>(null)
 const {passes,unavailable}=useJourneyPasses(props.userId,records)
 const complete=useCallback((level:PracticeLevel,score:number,total:number,passed:boolean)=>{const next={level,score,total,passed};setRecords(old=>mergeRun(old,next));setResult(next);setScreen('result')},[])
 useEffect(()=>{try{localStorage.setItem(key,JSON.stringify(records))}catch{/* Practice keeps its own durable answer queue. */}},[key,records])
 function returnToMap(){setScreen('map')}
 const start=(value:PracticeLevel)=>{setLevel(value);setScreen('run')}
 const nextLevel=journeyBriefings.find(item=>!records[item.id]?.cleared)?.id
 if(import.meta.env.DEV&&new URLSearchParams(location.search).has('preview'))return <NumberFoundation {...props}/>
 if(screen==='run'&&level===6)return <ActionStarCourse settings={props.settings} onLevel={start} userId={props.userId} onExit={returnToMap} onComplete={(score,total)=>complete(6,score,total,true)}/>
 if(screen==='run')return <NumberFoundation key={level} {...props} initialLevel={level} newRun onLevelRequest={start} onComplete={complete} onExit={returnToMap}/>
 return <main className="practice-journey" lang="th">
  <header className="journey-header">
   <img src="/brand/success-university-su.svg" alt="Success University"/>
   <PracticeGold userId={props.userId}/>
  </header>
  {screen==='result'&&result?<section className="journey-result"><div className="journey-result-stars" aria-label={`${result.level===6&&result.passed?3:runStars(result)} ดาว`}>{[1,2,3].map(star=><span key={star} className={runStars(result)>=star||result.level===6&&result.passed?'earned':''}>★</span>)}</div><h1>{result.passed?'ผ่านแล้ว!':'ลองอีกครั้ง'}</h1><p>LEVEL {result.level}</p><strong>{result.score}<small> / {result.total}</small></strong><div className="journey-result-actions"><button className="journey-card-play" onClick={()=>start(result.passed&&level<6?(level+1) as PracticeLevel:level)}>{result.passed&&level<6?'ด่านต่อไป →':'เล่นอีกครั้ง ↻'}</button><button onClick={returnToMap}>เลือกด่าน</button></div></section>:<section className="journey-map" aria-label="เลือกด่าน">
   <h1 className="journey-map-title">เลือกด่าน</h1>
   <div className="journey-level-grid">
    {journeyBriefings.map(item=>{const record=records[item.id];return <article key={item.id} className={`journey-node ${record?.cleared?'cleared':''} ${item.id===nextLevel?'next-level':''}`} aria-label={`Level ${item.id}`}>
     <button className="journey-level-open" onClick={()=>start(item.id)} aria-label={`เปิด Level ${item.id}: ${item.title}`} aria-describedby={`journey-task-${item.id}`}>
      <span className="journey-node-number">{String(item.id).padStart(2,'0')}</span>
      {record?.cleared&&<span className="journey-clear" aria-label="ผ่านแล้ว">✓</span>}
      <LevelArtwork item={item}/>
      <span className="journey-tile-footer"><LevelTask item={item}/><span className="journey-tile-play" aria-hidden="true"><Icon name="play" className="journey-play-mark"/></span></span>
     </button>
     <JourneyPassNames level={item.id} passes={passes} unavailable={unavailable}/>
    </article>})}
   </div>
  </section>}
 </main>
}
