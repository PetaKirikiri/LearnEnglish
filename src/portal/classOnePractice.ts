import type { ListeningCourse } from '../hotel/HotelPage'
import type { Progress, Evidence } from '../hotel/course'
import { classOnePracticeQuestions as classOneQuestions, classOneSkill, classOneStages } from './classOne'
import { recordAnswer, requiresAudioCheck } from '../success/practice'
import { recordSuccessExposure, successWordOpacity, successWordUnits } from '../success/familiarity'
import SuccessWordHelp from '../success/SuccessWordHelp'
import { englishScoring } from '../english/scoring'

const progressKey=(user:string)=>`englishsuccess:class-one:progress:v1:${user}`
export const classOneStageReady=(p:Progress,index:number)=>classOneStages[index].questions.every(q=>(p[q.skill]?.items?.[q.id]?.streak??0)>=2)
export const classOneStageIndex=(p:Progress)=>{const index=classOneStages.findIndex((_,i)=>!classOneStageReady(p,i));return index<0?classOneStages.length-1:index}
export const classOnePractice:ListeningCourse={
  skills:[classOneSkill],skillNames:['Class 1'],presentation:'clay',WordHelp:SuccessWordHelp,
  // Preserve old support history without letting the removed complex sentences
  // hide words in this newly scaffolded introduction.
  progressKey,wordMemoryKey:user=>`englishsuccess:class-one:words:v2:${user}`,
  queue:englishScoring.queue,sync:user=>englishScoring.join().then(()=>englishScoring.sync(user)),
  loadProgress(user){
    try{
      const saved=JSON.parse(localStorage.getItem(progressKey(user))??'{}'), row=saved[classOneSkill]
      if(!row||!Number.isSafeInteger(row.attempts)||!Number.isSafeInteger(row.correct)||row.correct<0||row.attempts<row.correct)return {}
      const items:Record<string,Evidence>={}
      for(const q of classOneQuestions){const e=row.items?.[q.id];if(e&&[e.attempts,e.streak,e.audioStreak].every(n=>Number.isSafeInteger(n)&&n>=0)&&e.streak<=e.attempts&&e.audioStreak<=e.streak&&[e.firstCorrect,e.lastCorrect].every(n=>Number.isFinite(n)&&n>=0))items[q.id]=e}
      return {[classOneSkill]:{attempts:row.attempts,correct:row.correct,seen:classOneQuestions.filter(q=>Array.isArray(row.seen)&&row.seen.includes(q.id)).map(q=>q.id),items}} as Progress
    }catch{return {}}
  },
  recordAnswer,requiresAudioCheck,wordUnits:successWordUnits,wordOpacity:successWordOpacity,recordExposure:recordSuccessExposure,gradualSupport:true,
  isSkillComplete:p=>classOneQuestions.every(q=>(p[q.skill]?.items?.[q.id]?.streak??0)>=3&&(p[q.skill]?.items?.[q.id]?.audioStreak??0)>=1),
  nextQuestion:(p,previous)=>{
    const stage=classOneStageIndex(p)
    const attempts=classOneQuestions.reduce((sum,q)=>sum+(p[q.skill]?.items?.[q.id]?.attempts??0),0)
    const allReady=classOneStages.every((_,i)=>classOneStageReady(p,i))
    // Revisit earlier stages every fourth encounter. Clicking through a fixed
    // batch cannot unlock sentences: each prerequisite needs repeated success.
    const review=stage>0&&attempts%4===3
    const pool=allReady?classOneQuestions:review?classOneStages.slice(0,stage).flatMap(s=>s.questions):classOneStages[stage].questions
    const eligible=pool.filter(q=>q.id!==previous)
    return [...(eligible.length?eligible:pool)].sort((a,b)=>{
      const aReady=Number((p[a.skill]?.items?.[a.id]?.streak??0)>=2),bReady=Number((p[b.skill]?.items?.[b.id]?.streak??0)>=2)
      return aReady-bReady||(p[a.skill]?.items?.[a.id]?.attempts??0)-(p[b.skill]?.items?.[b.id]?.attempts??0)
    })[0]
  },
}
