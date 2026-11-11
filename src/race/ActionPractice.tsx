import ActionPracticeStage from './ActionPracticeStage'
import {awardPracticeGold} from './PracticeGold'
import type {MatrixSettings} from '../learning/sentenceMatrix/model'
import {useCallback,useEffect,useRef,useState} from 'react'
import {actionPracticeDeck} from './actionPracticeContent'
import type {PracticeLevel} from './PracticeLevelPicker'
import PracticeHeader from './PracticeHeader'
import {useWordProgress} from '../learning/wordProgress/useWordProgress'
import {QUESTION_VERSION,WORD_RULE_VERSION,sentenceModality} from '../learning/wordProgress/model'
export default function ActionPractice({level,onLevel,userId,onComplete,onExit,settings={fadeMode:true}}:{level:4|5|6;onLevel:(level:PracticeLevel)=>void;userId?:string;settings?:MatrixSettings;onComplete?:(level:PracticeLevel,score:number,total:number,passed:boolean)=>void;onExit?:()=>void}){
 const [deck]=useState(()=>actionPracticeDeck(level)),[index,setIndex]=useState(0),[picked,setPicked]=useState<number|null>(null),[score,setScore]=useState(0),[audioError,setAudioError]=useState(false),[saveError,setSaveError]=useState(false)
 const progress=useWordProgress(userId),audio=useRef<HTMLAudioElement|null>(null),locked=useRef(false),attempt=useRef(crypto.randomUUID()),replays=useRef(0)
 const q=deck[index],finished=!q
 useEffect(()=>{if(finished)onComplete?.(level,score,deck.length,score>=Math.ceil(deck.length*.9))},[finished,onComplete,level,score,deck.length])
 const play=useCallback(()=>{if(!q)return;audio.current?.pause();const player=new Audio(q.audioUrl);audio.current=player;setAudioError(false);player.onerror=()=>{if(audio.current===player)setAudioError(true)};void player.play().then(()=>{replays.current++}).catch(()=>{if(audio.current===player)setAudioError(true)})},[q])
 useEffect(()=>{play();return()=>{audio.current?.pause();audio.current=null}},[play]) // Each sentence gets automatic audio and cleanup.
 function choose(side:number){if(locked.current||!q)return;try{progress.record({id:attempt.current,questionId:q.id,version:q.questionVersion??QUESTION_VERSION,answer:q.choices[side],occurredAt:new Date().toISOString(),modality:sentenceModality(q.english,progress.scores,{fadeMode:true,...settings}),replays:Math.max(0,replays.current-1),ruleVersion:WORD_RULE_VERSION});setSaveError(false)}catch{setSaveError(true);return}awardPracticeGold(attempt.current,side===q.correct,userId);locked.current=true;setPicked(side);if(side===q.correct)setScore(s=>s+1)}
 function next(){if(!locked.current)return;locked.current=false;setPicked(null);attempt.current=crypto.randomUUID();replays.current=0;setIndex(i=>i+1)}
 return <main className="phone-practice foundation-practice" lang="th"><div className="practice-shell"><PracticeHeader level={level} onLevel={onLevel} value={index} total={deck.length} userId={userId} onExit={onExit}/>
 {finished?<section className="practice-complete"><h1>{score} / {deck.length}</h1>{level===4&&<button onClick={()=>onLevel(5)}>Level 5 →</button>}<button onClick={()=>{setIndex(0);setScore(0)}}>↻</button></section>:<ActionPracticeStage onReplay={play} question={q} scores={progress.scores} settings={settings} picked={picked} disabled={picked!==null} onChoose={choose} onNext={next}>
 {audioError&&<button onClick={play}>🔊 ↻ Tap to listen</button>}{(saveError||progress.error)&&<button role="alert" onClick={()=>void progress.retry()}>บันทึกคำตอบไม่ได้ · ลองอีกครั้ง</button>}</ActionPracticeStage>}
 </div></main>
}
