import {useState} from 'react'
import {useWordProgress} from '../learning/wordProgress/useWordProgress'
import {WORD_RULE_VERSION} from '../learning/wordProgress/model'
import type {MatrixSettings} from '../learning/sentenceMatrix/model'
import {questionLessonDeck,type QuestionLessonLevel} from '../pages/generalQuestionDeck'
import {GeneratedQuestionView} from './GeneratedPractice'
import LandscapePractice from './LandscapePractice'
import PracticeHeader from './PracticeHeader'
import {awardPracticeGold} from './PracticeGold'

type Props={level:QuestionLessonLevel;userId?:string;settings?:MatrixSettings;onExit:()=>void;onComplete:(level:QuestionLessonLevel,score:number,total:number,passed:boolean)=>void}
type Run={index:number;picked:number|null;score:number;id:string;startedAt:string}
const fresh=(index=0,score=0):Run=>({index,score,id:crypto.randomUUID(),picked:null,startedAt:new Date().toISOString()})
const noForecast=()=>{}
export default function QuestionLesson(props:Props){
 return <LandscapePractice><Round key={`${props.userId??'guest'}:${props.level}`} {...props}/></LandscapePractice>
}
function Round({level,userId,settings,onExit,onComplete}:Props){
 const [deck]=useState(()=>questionLessonDeck(level))
 const storage=`englishsuccess:question-lesson:v1:${userId??'guest'}:${level}`
 const progress=useWordProgress(userId)
 const [error,setError]=useState(false)
 const [run,setRun]=useState<Run>(()=>{
  try{const r=JSON.parse(localStorage.getItem(storage)??'null');if(r&&typeof r.id==='string'&&typeof r.startedAt==='string'&&Number.isInteger(r.index)&&r.index>=0&&r.index<deck.length&&[null,0,1].includes(r.picked)&&Number.isInteger(r.score)&&r.score>=0&&r.score<=r.index+Number(r.picked!==null))return r}catch{/* Start a new round. */}
  return fresh()
 })
 const source=deck[run.index]
 const q=parseInt(run.id[0],16)%2===1?{...source,correct:1 as const,choices:[source.choices[1],source.choices[0]] as typeof source.choices,alternatives:[source.alternatives![1],source.alternatives![0]] as NonNullable<typeof source.alternatives>}:source
 const base={id:run.id,questionId:q.id,version:q.version,ruleVersion:WORD_RULE_VERSION}
 const persist=(next:Run)=>{
  try{localStorage.setItem(storage,JSON.stringify(next));setRun(next);setError(false);return true}
  catch{setError(true);return false}
 }
 return <main className="phone-practice foundation-practice" lang="en"><div className="practice-shell">
  {!progress.ready?<><PracticeHeader label={`Level ${level}`} level={6} onExit={onExit} value={0} total={deck.length}/>{progress.error?<button onClick={()=>void progress.retry()}>Retry loading progress</button>:<p role="status">…</p>}</>:
  <GeneratedQuestionView key={run.id} courseLabel={`Level ${level}`} question={q} roundTotal={deck.length} cueOnly={level===7} index={run.index} scores={progress.scores} settings={settings} picked={run.picked} attemptId={run.id} supportKey={storage+':presentation'} userId={userId} onExit={onExit}
    saveError={error||!!progress.error} retry={()=>void progress.retry()} onPrepareNext={noForecast}
    onPresented={()=>{try{progress.record({...base,event:'presented',answer:'',occurredAt:run.startedAt,modality:'visible',replays:0});return true}catch{setError(true);return false}}}
    onChoose={(side,evidence)=>{
     if(run.picked!==null)return false
     const correct=side===q.correct
     try{progress.record({...base,answer:q.choices[side],occurredAt:new Date().toISOString(),modality:level!==7&&evidence.hidden&&evidence.heard&&!evidence.assisted&&evidence.plays===1?'audio':'visible',replays:Math.max(0,evidence.plays-1)})}catch{setError(true);return false}
     if(!persist({...run,picked:side,score:run.score+Number(correct)}))return false
     awardPracticeGold(run.id,correct,userId)
     return true
    }}
    onNext={()=>{
     if(run.picked===null)return
     if(run.index+1<deck.length){persist(fresh(run.index+1,run.score));return}
     try{localStorage.removeItem(storage);onComplete(level,run.score,deck.length,run.score>=Math.ceil(deck.length*.9))}
     catch{setError(true)}
    }}/>
  }
 </div></main>
}
