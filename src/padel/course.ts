import type { HotelQuestion, Progress, Evidence } from '../hotel/course'
import { padelPairs } from './content'
import { questionWordSkills, questionWordNames } from './questionWords'
import { padelQuestionId } from './contentRevisions'
import { padelStages, stageByPair, pairOrder } from './progression'
export const learningSkills = padelStages.map(s=>s.id)
export const learningNames = padelStages.map((s,i)=>`${i+1}. ${s.title}`)
export const skills = ['people','gear','quantity','court_booking','player_numbers','prices','racket_hire','balls_grips','facilities','position','possession','permission','ongoing','finished','plans','bookings','times','rain','court_rules','service','teamwork',...questionWordSkills]
export const skillNames = ['People','Equipment','Amounts','Court booking','How many / how long','Prices & payment','Racket hire','Balls & grips','Facilities','Directions','Whose','Can / cannot','Actions','Already done','Plans','Bookings','Times','Rain & changes','Explaining rules','Guest service','Staff & safety',...questionWordNames]
export type PadelQuestion = HotelQuestion & { pairId: string; contrast: string }
export const padelQuestions: readonly PadelQuestion[] = [...padelPairs].sort((a,b) => pairOrder.get(a[0])!-pairOrder.get(b[0])!).flatMap(([id, skill, english, thai]) => english.map((text, index) => ({
  id: padelQuestionId(id,index), pairId: id, skill, english: text,
  contrast: english[1 - index], correct: index as 0 | 1,
  answers: thai.map(text => [{ text, skill }]) as HotelQuestion['answers'],
  audioUrl: `/audio/padel/${padelQuestionId(id,index)}.wav`,
})))
export const progressKey = (user: string) => `padel:v1:${user}`
const questionById = new Map(padelQuestions.map(q=>[q.id,q]))
export const progressSkill = (q:HotelQuestion) => stageByPair.get(questionById.get(q.id)!.pairId)!.id
export const contentStage = (q:HotelQuestion) => {
  const stage=stageByPair.get(questionById.get(q.id)!.pairId)!
  return `${learningSkills.indexOf(stage.id)+1}. ${stage.title} · ${stage.level}`
}
const passed = (p:Progress,q:HotelQuestion) => (p[q.skill]?.items?.[q.id]?.streak??0)>=3 && (p[q.skill]?.items?.[q.id]?.audioStreak??0)>=1
export const requiresAudioCheck = (p:Progress,q:HotelQuestion) => (p[q.skill]?.items?.[q.id]?.streak??0)>=2
export function isSkillComplete(progress: Progress, skill: string) {
  const items = padelQuestions.filter(q => learningSkills.includes(skill) ? progressSkill(q)===skill : q.skill===skill)
  return items.length > 0 && items.every(q => passed(progress,q))
}
export function recordAnswer(progress:Progress,q:HotelQuestion,correct:boolean,assisted:boolean,now=Date.now(),audioOnly=false):Progress {
  const prior=progress[q.skill]??{seen:[],correct:0,attempts:0}
  const old=prior.items?.[q.id]
  const earned=correct&&!assisted
  const entry:Evidence={attempts:(old?.attempts??0)+1,streak:earned?(old?.streak??0)+1:0,
    firstCorrect:earned?(old?.firstCorrect||now):0,lastCorrect:earned?now:0,retained:false,
    audioStreak:earned?(old?.audioStreak??0)+Number(audioOnly):0}
  const items={...prior.items,[q.id]:entry}
  // Preserve historical encounter records and totals; they are NOT mastery.
  return {...progress,[q.skill]:{...prior,attempts:prior.attempts+1,correct:prior.correct+Number(correct),
    items,seen:earned?[...new Set([...prior.seen,q.id])]:prior.seen}}
}
export function loadProgress(user: string): Progress {
  try {
    const parsed = JSON.parse(localStorage.getItem(progressKey(user)) ?? '{}')
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    return Object.fromEntries(skills.flatMap(skill => {
      const item = parsed[skill]
      if (!item || !Array.isArray(item.seen) || !Number.isInteger(item.correct) || !Number.isInteger(item.attempts) || item.correct < 0 || item.attempts < item.correct) return []
      const ids = new Set(padelQuestions.filter(q => q.skill === skill).map(q => q.id))
      const seen = (item.seen as unknown[]).filter((id): id is string => typeof id === 'string' && ids.has(id))
      const items:Record<string,Evidence>={}
      for(const [id,value] of Object.entries(item.items??{})) {
        if(!ids.has(id)||!value||typeof value!=='object') continue
        const e=value as Evidence
        if(![e.attempts,e.streak,e.audioStreak??0].every(n=>Number.isSafeInteger(n)&&n>=0) ||
          e.streak>e.attempts || (e.audioStreak??0)>e.streak ||
          ![e.firstCorrect,e.lastCorrect].every(n=>Number.isFinite(n)&&n>=0)) continue
        items[id]={attempts:e.attempts,streak:e.streak,audioStreak:e.audioStreak??0,firstCorrect:e.firstCorrect,lastCorrect:e.lastCorrect,retained:false}
      }
      return [[skill, { correct: item.correct, attempts: item.attempts, seen: [...new Set(seen)], ...(Object.keys(items).length?{items}:{}) }]]
    }))
  } catch { return {} }
}
export function nextQuestion(progress: Progress, previous?: string, round = 0, random = Math.random): PadelQuestion {
  const stage=padelStages.find(s=>!isSkillComplete(progress,s.id))
  const stageIndex=stage?padelStages.indexOf(stage):padelStages.length
  const review=padelQuestions.filter(q=>learningSkills.indexOf(progressSkill(q))<stageIndex)
  if(!stage || (round%4===3&&review.length)) return pick(review,progress,previous,random,true)
  const lanes=stage.lanes.map(ids=>padelQuestions.filter(q=>ids.includes(q.pairId)))
    .filter(qs=>qs.some(q=>!passed(progress,q)))
  const focusRound=review.length?round-Math.floor((round+1)/4):round
  return pick(lanes[focusRound%lanes.length],progress,previous,random)
}
export function nextQuestionWord(progress: Progress, previous?: string, round = 0, random = Math.random): PadelQuestion {
  // Selecting a topic is not a back door past the foundations.
  return nextQuestion(progress,previous,round,random)
}
function pick(pool:readonly PadelQuestion[],progress:Progress,previous:string|undefined,random:()=>number,review=false):PadelQuestion {
  const unfinished=pool.filter(q=>!passed(progress,q))
  const pending=!review&&unfinished.length?unfinished:pool
  const other=pending.filter(q=>q.id!==previous)
  const spacing=pool.filter(q=>q.id!==previous)
  const candidates=other.length?other:spacing.length?spacing:pending
  const weight=(q:PadelQuestion)=>review?(progress[q.skill]?.items?.[q.id]?.lastCorrect??0):(progress[q.skill]?.items?.[q.id]?.attempts??0)
  const lowest=Math.min(...candidates.map(weight))
  const available=candidates.filter(q=>weight(q)===lowest)
  return available[Math.min(available.length-1,Math.max(0,Math.floor(random()*available.length)))]
}
