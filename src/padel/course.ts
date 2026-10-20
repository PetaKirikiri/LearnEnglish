import type { HotelQuestion, Progress } from '../hotel/course'
import { recordAnswer } from '../hotel/course'
import { padelPairs } from './content'
import { questionWordSkills, questionWordNames } from './questionWords'
export { recordAnswer }
export const skills = ['people','gear','quantity','court_booking','player_numbers','prices','racket_hire','balls_grips','class_booking','facilities','position','possession','permission','ongoing','finished','plans','bookings','times','rain','court_rules','service','teamwork',...questionWordSkills]
export const skillNames = ['People','Equipment','Amounts','Court booking','How many / how long','Prices & payment','Racket hire','Balls & grips','Pilates bookings & packages','Facilities','Directions','Whose','Can / cannot','Actions','Already done','Plans','Bookings','Times','Rain & changes','Explaining rules','Guest service','Staff & safety',...questionWordNames]
export type PadelQuestion = HotelQuestion & { pairId: string; contrast: string }
export const padelQuestions: readonly PadelQuestion[] = [...padelPairs].sort((a,b) => skills.indexOf(a[1])-skills.indexOf(b[1])).flatMap(([id, skill, english, thai]) => english.map((text, index) => ({
  id: `padel-${id}-${index + 1}`, pairId: id, skill, english: text,
  contrast: english[1 - index], correct: index as 0 | 1,
  answers: thai.map(text => [{ text, skill }]) as HotelQuestion['answers'],
  audioUrl: `/audio/padel/padel-${id}-${index + 1}.wav`,
})))
export const progressKey = (user: string) => `padel:v1:${user}`
export function isSkillComplete(progress: Progress, skill: string) {
  const items = padelQuestions.filter(q => q.skill === skill)
  return items.length > 0 && items.every(q => progress[skill]?.seen.includes(q.id))
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
      return [[skill, { correct: item.correct, attempts: item.attempts, seen: [...new Set(seen)] }]]
    }))
  } catch { return {} }
}
export function nextQuestion(progress: Progress, previous?: string, round = 0, random = Math.random): PadelQuestion {
  return nextFromSkills(skills,progress,previous,round,random)
}
export function nextQuestionWord(progress: Progress, previous?: string, round = 0, random = Math.random): PadelQuestion {
  return nextFromSkills(questionWordSkills,progress,previous,round,random)
}
function nextFromSkills(activeSkills:string[],progress: Progress, previous: string|undefined, round:number, random:()=>number): PadelQuestion {
  const unfinished = activeSkills.filter(skill => !isSkillComplete(progress, skill))
  const focus = unfinished.slice(0,2)
  const review = activeSkills.filter(skill => !unfinished.includes(skill))
  const focusRound = review.length ? round - Math.floor((round + 1) / 4) : round
  const skill = !focus.length ? activeSkills[round % activeSkills.length] : round % 4 === 3 && review.length
    ? review[Math.floor(round / 4) % review.length] : focus[focusRound % focus.length]
  const candidates = padelQuestions.filter(q => q.skill === skill && q.id !== previous)
  const unseen = candidates.filter(q => !progress[skill]?.seen.includes(q.id))
  const available = unseen.length ? unseen.slice(0,4) : candidates
  return available[Math.min(available.length - 1,Math.floor(random() * available.length))]
}
