import { coachPairs, coachTopics, coachWords, type CoachSkill } from './content'

// Content-addressed recordings: changed Thai cannot accidentally reuse old audio.
export function audioUrl(text: string) {
  let hash = 2166136261
  for (const char of text) hash = Math.imul(hash ^ char.codePointAt(0)!, 16777619)
  return `/audio/padel-coach/kanya-v1-${(hash >>> 0).toString(16)}.wav`
}
export type CoachQuestion = {
  id: string; skill: CoachSkill; thai: string; tokens: string[]
  choices: readonly [string, string]; correct: 0 | 1; audioUrl: string
}
export const questions: readonly CoachQuestion[] = coachPairs.flatMap(([id, skill, thai, choices]) => thai.map((text, i) => {
  const tokens = text.split('|')
  return { id: `coach-${id}-${i + 1}`, skill, thai: tokens.join(''), tokens, choices, correct: i as 0 | 1, audioUrl: audioUrl(tokens.join('')) }
}))
export const skills = coachTopics.map(([id]) => id)
export const progressKey = (id: string) => `padel-coach:v1:${id}`
export const memoryKey = (id: string) => `padel-coach:words:v1:${id}`
export type Progress = Record<string, { attempts: number; correct: number; streak: number }>
export type WordMemory = Record<string, { seen: number; strength: number }>
const integer = (value: unknown): value is number => Number.isSafeInteger(value) && Number(value) >= 0
function load(key: string): Record<string, unknown> {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) ?? '{}')
    return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
  } catch { return {} }
}
export function loadProgress(userId: string): Progress {
  const stored = load(progressKey(userId))
  return Object.fromEntries(questions.flatMap(q => {
    const item = stored[q.id] as Progress[string] | undefined
    return item && integer(item.attempts) && integer(item.correct) && integer(item.streak) && item.correct <= item.attempts && item.streak <= item.correct
      ? [[q.id, item]] : []
  }))
}
export function loadWords(userId: string): WordMemory {
  const stored = load(memoryKey(userId))
  return Object.fromEntries(Object.keys(coachWords).flatMap(word => {
    const item = stored[word] as WordMemory[string] | undefined
    return item && integer(item.seen) && integer(item.strength) && item.strength <= item.seen ? [[word, item]] : []
  }))
}
export function recordAnswer(progress: Progress, q: CoachQuestion, correct: boolean, assisted: boolean): Progress {
  const prior = progress[q.id] ?? { attempts: 0, correct: 0, streak: 0 }
  return { ...progress, [q.id]: { attempts: prior.attempts + 1, correct: prior.correct + Number(correct), streak: correct && !assisted ? prior.streak + 1 : 0 } }
}
export function recordWords(memory: WordMemory, tokens: string[], correct: boolean, assisted: boolean): WordMemory {
  const next = { ...memory }
  for (const token of new Set(tokens)) {
    const old = memory[token] ?? { seen: 0, strength: 0 }
    next[token] = { seen: old.seen + 1, strength: correct ? old.strength + Number(!assisted) : Math.max(0, old.strength - 2) }
  }
  return next
}
export const opacity = (memory: WordMemory, word: string) => Math.max(0.2, 1 - (memory[word]?.strength ?? 0) * 0.1)
export const complete = (progress: Progress, skill: CoachSkill) => questions.filter(q => q.skill === skill).every(q => (progress[q.id]?.streak ?? 0) >= 2)
export function nextQuestion(progress: Progress, previous?: string, round = 0, random = Math.random): CoachQuestion {
  const focus = skills.filter(skill => !complete(progress, skill)).slice(0, 2)
  const review = skills.filter(skill => complete(progress, skill))
  const focusRound = review.length ? round - Math.floor((round + 1) / 4) : round
  const skill = !focus.length ? skills[round % skills.length] : round % 4 === 3 && review.length
    ? review[Math.floor(round / 4) % review.length] : focus[focusRound % focus.length]
  const pool = questions.filter(q => q.skill === skill && q.id !== previous)
  const unfinished = pool.filter(q => (progress[q.id]?.streak ?? 0) < 2)
  // Introduce short contrasts before the extended sentences, then revisit.
  const available = unfinished.length ? unfinished.slice(0, 4) : pool
  return available[Math.min(available.length - 1, Math.floor(random() * available.length))]
}
