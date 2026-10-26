import type { Progress, HotelQuestion, Evidence } from '../hotel/course'
import { successLessons } from './course'
import { recordSuccessExposure, successWordOpacity, successWordUnits } from './familiarity'

export const progressKey = (user:string)=>`success:listening:v1:${user}`
export const wordMemoryKey = (user:string)=>`success:words:v1:${user}`
export const requiresAudioCheck=(p:Progress,q:HotelQuestion)=>(p[q.skill]?.items?.[q.id]?.streak??0)>=2
export function recordAnswer(p:Progress,q:HotelQuestion,correct:boolean,assisted:boolean,now=Date.now(),audioOnly=false):Progress {
  const prior=p[q.skill]??{seen:[],correct:0,attempts:0}
  const old=prior.items?.[q.id]
  const earned=correct&&!assisted
  const item:Evidence={attempts:(old?.attempts??0)+1,streak:earned?(old?.streak??0)+1:0,
    audioStreak:earned?(old?.audioStreak??0)+Number(audioOnly):0,
    firstCorrect:earned?(old?.firstCorrect||now):0,lastCorrect:earned?now:0,retained:false}
  return {...p,[q.skill]:{...prior,correct:prior.correct+Number(correct),attempts:prior.attempts+1,
    seen:earned?[...new Set([...prior.seen,q.id])]:prior.seen,items:{...prior.items,[q.id]:item}}}
}
export function loadProgress(user:string):Progress {
  try {
    const saved=JSON.parse(localStorage.getItem(progressKey(user))??'{}'), result:Progress={}
    for(const lesson of successLessons) {
      const row=saved?.[lesson.id]
      if(!row||!Number.isSafeInteger(row.attempts)||!Number.isSafeInteger(row.correct)||row.correct<0||row.attempts<row.correct) continue
      const items:Record<string,Evidence>={}
      for(const q of lesson.questions) {
        const e=row.items?.[q.id]
        if(e&&[e.attempts,e.streak,e.audioStreak].every(n=>Number.isSafeInteger(n)&&n>=0)&&e.streak<=e.attempts&&e.audioStreak<=e.streak
          &&[e.firstCorrect,e.lastCorrect].every(n=>Number.isFinite(n)&&n>=0))
          items[q.id]={attempts:e.attempts,streak:e.streak,audioStreak:e.audioStreak,firstCorrect:e.firstCorrect,lastCorrect:e.lastCorrect,retained:false}
      }
      result[lesson.id]={attempts:row.attempts,correct:row.correct,items,seen:lesson.questions.filter(q=>Array.isArray(row.seen)&&row.seen.includes(q.id)).map(q=>q.id)}
    }
    return result
  } catch {return {}}
}
export function lessonPractice(lesson:typeof successLessons[number]) {
  return {
    skills:[lesson.id],skillNames:[`Lesson ${lesson.number} · ${lesson.title}`],
    progressKey,wordMemoryKey,loadProgress,recordAnswer,requiresAudioCheck,
    wordUnits:successWordUnits,wordOpacity:successWordOpacity,recordExposure:recordSuccessExposure,gradualSupport:true,
    isSkillComplete:(p:Progress)=>lesson.questions.every(q=>(p[q.skill]?.items?.[q.id]?.streak??0)>=3&&(p[q.skill]?.items?.[q.id]?.audioStreak??0)>=1),
    nextQuestion:(p:Progress,previous?:string)=>{
      const choices=lesson.questions.filter(q=>q.id!==previous)
      // Introduce in the owner's order, then give every item repeat exposure.
      return [...choices].sort((a,b)=>(p[a.skill]?.items?.[a.id]?.attempts??0)-(p[b.skill]?.items?.[b.id]?.attempts??0))[0]
    },
  }
}
