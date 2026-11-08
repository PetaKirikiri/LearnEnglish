import { numberCatalogue } from '../race/numberCatalogue'
import { actionPracticeQuestions, actionPracticeRecordings, type ActionPracticeQuestion } from '../race/actionPracticeContent'
import { actionStarTiers } from '../race/actionStarContent'
import { lessonPracticeQuestions } from '../race/lessonPractice'
import { racePools } from '../race/pools'
import type { HotelQuestion } from '../hotel/course'
import { meaningForWord, type WordMeaning } from '../learning/sentenceRules/blueprints'
import { hasUntaughtIt } from '../learning/sentenceRules/assessmentScope'

export type ReviewArea = 'practice' | 'classroom' | 'race' | 'excluded'
export type ReviewIssue = { code: string; kind: 'context' | 'scope' | 'answer'; reason: string }
export type SentenceUse = {
  source: string
  area: ReviewArea
  questionId: string
  position: number
  choices: string[]
  correct: number
  intentionalIncorrect: boolean
  task: string
  audioUrl?: string
  nounCountability?: WordMeaning['countability']
}
export type ReviewSentence = {
  id: string
  position: number
  english: string
  uses: SentenceUse[]
  issues: ReviewIssue[]
}
export type ReviewDecision = { flagged: boolean; note: string; updatedAt: string }
export type ReviewDecisions = Record<string, ReviewDecision>
export const reviewStorageKey = 'englishsuccess:sentence-review:v1'
export const sentenceKey = (english: string) => english.trim().replace(/\s+/g, ' ').toLowerCase()

/** A flag means "please review", not "this sentence is always wrong". */
export function inspectSentence(english: string, uses: SentenceUse[]): ReviewIssue[] {
  const issues: ReviewIssue[] = []
  const text = sentenceKey(english)
  if (hasUntaughtIt(english)) issues.push({code:'untaught-it', kind:'scope', reason:'“It” and “its” have not been taught for assessment. Keep them in the explorer, not student questions.'})
  // Deliberately incorrect examples are part of the right/wrong activity.
  const naturalUses = uses.filter(use => !use.intentionalIncorrect)
  if (uses.some(use => use.task === 'Choose one or many' && use.nounCountability === 'mass')) {
    issues.push({code:'uncountable-number-task', kind:'answer', reason:'This noun is uncountable. “Water” cannot be counted as one or many without a unit such as glasses. Use a countable noun for this task.'})
  }
  if (naturalUses.length) {
    if (/\bgoing to\b/.test(text)) issues.push({code:'untaught-destination', kind:'scope', reason:'“Going to + place” needs its own taught sentence frame. It is outside the agreed assessment scope.'})
    if (/\bgoing to (?:the|my|your|his|her|our|their) (?:hotels|toilets|gyms|padel courts|clinics|schools|banks|bookstores|bedrooms|restaurants)\b/.test(text)) {
      issues.push({code:'multiple-destinations', kind:'context', reason:'Several destinations need a reason or a route. A single place is clearer for this beginner example.'})
    }
    if (/\b(?:my|your|his|her|our|their) toilets?\b/.test(text)) issues.push({code:'owned-toilet', kind:'context', reason:'A personal or assigned toilet is possible, but no context establishes that ownership. “The toilet” is the natural default.'})
    if (/\bat the toilet\b/.test(text)) issues.push({code:'toilet-location', kind:'context', reason:'“At the toilet” can mean beside the fixture. If the Thai means inside the bathroom, use an “in” example after that frame is taught.'})
    if (/\bat (?:the|my|your|his|her|our|their) bedroom\b/.test(text)) issues.push({code:'room-location', kind:'context', reason:'For someone inside a bedroom, “in” is more natural than “at”. Check the intended location and taught frame.'})
    if (/^(?:we|they|the doctors) are (?:eating|holding|opening|washing) (?:a|an|the|my|your|his|her|our|their) (?:apple|banana|orange|sandwich|phone|key|cup|plate|book|bag)[.!?]?$/.test(text)) {
      issues.push({code:'shared-single-object', kind:'context', reason:'Several people are acting on one small object. Possible if they share it, but that situation is missing; plural objects would be a clearer default.'})
    }
    if (/^(?:we|they|the doctors) are reading (?:a|the|my|your|his|her|our|their) book[.!?]?$/.test(text)) {
      issues.push({code:'shared-book', kind:'context', reason:'This can mean reading one book together. Check that shared context is intended, rather than several people each reading a book.'})
    }
  }
  for (const use of uses) {
    const choices = use.choices.map(choice => choice.replace(/\s+/g, '').trim())
    if (new Set(choices).size !== choices.length) issues.push({code:`duplicate-answers:${use.source}`, kind:'answer', reason:`${use.source}: answer choices are identical, so the question has no unique answer.`})
    if (!use.choices[use.correct]?.trim()) issues.push({code:`missing-answer:${use.source}`, kind:'answer', reason:`${use.source}: the marked correct answer is missing.`})
  }
  return issues
}

export function buildSentenceReview(): ReviewSentence[] {
  const rows = new Map<string, ReviewSentence>()
  const add = (english: string, use: SentenceUse) => {
    const id = sentenceKey(english)
    const row = rows.get(id) ?? {id, position: rows.size + 1, english, uses: [], issues: []}
    if (!row.uses.some(old => old.source === use.source && old.questionId === use.questionId)) row.uses.push(use)
    rows.set(id, row)
  }
  // Follow the course order. The adaptive scheduler may serve these in a different order per learner.
  for (const level of [1,2,3]) {
    let position = 0
    for (const word of numberCatalogue.filter(word => level === 3 || !word.pairOnly)) {
      const verbs = level === 3 ? ['is','are'] : [word.pluralForm ? 'are' : 'is']
      for (const verb of verbs) {
        const incorrect = level === 3 && ((verb === 'are') !== word.pluralForm)
        add(level === 1 ? `the ${word.word}` : `Where ${verb} the ${word.word}?`, {
          source:`Practice · Level ${level}`, area:'practice', questionId:`number-${level}-${verb}-${word.word}`, position:++position,
          choices:level === 3 ? ['ถูกต้อง','ไม่ถูกต้อง'] : ['หนึ่งสิ่ง','หลายสิ่ง'],
          correct:level === 3 ? Number(incorrect) : Number(word.pluralForm), intentionalIncorrect:incorrect,
          task:level === 3 ? 'Judge agreement' : 'Choose one or many',
          nounCountability:meaningForWord(word)?.countability,
        })
      }
    }
  }
  const addAction = (q: ActionPracticeQuestion, source: string, area: ReviewArea, position: number) => add(q.english, {
    source, area, position, questionId:q.id, choices:q.choices, correct:q.correct,
    intentionalIncorrect:false, task:'Choose the Thai translation', audioUrl:q.audioUrl,
  })
  for (const level of [4,5]) actionPracticeQuestions.filter(q => q.level === level).forEach((q,i) => addAction(q,`Practice · Level ${level}`,'practice',i+1))
  for (const tier of actionStarTiers) tier.questions.forEach((q,i) => addAction(q,`Practice · Level 6 · Stage ${tier.stars}`,'practice',i+1))
  const addHotel = (q: HotelQuestion, source: string, area: ReviewArea, position: number, judgement = false, dialogue = false) => add(q.english, {
    source, area, position, questionId:q.id, choices:q.answers.map(answer => answer.map(segment => segment.text).join('')),
    correct:q.correct, intentionalIncorrect:judgement && q.correct === 1, audioUrl:q.audioUrl,
    task:judgement ? 'Correct / incorrect' : dialogue ? 'Translate the answer in this dialogue' : 'Choose the Thai meaning',
  })
  for (const lesson of [1,2,3,4]) lessonPracticeQuestions(lesson).forEach((q,i) => addHotel(q,`Classroom · Lesson ${lesson}`,'classroom',i+1))
  for (const pool of racePools) pool.questions.forEach((q,i) => addHotel(q,`Race · ${pool.title}`,'race',i+1,pool.kind === 'judgement',pool.id === 'lesson-three-review'))
  // Retain excluded authored recordings for the audit, without treating them as current questions.
  const servedIds = new Set([...actionPracticeQuestions.filter(q => q.level < 6), ...actionStarTiers.flatMap(t => t.questions)].map(q => q.id))
  const allowedIds = new Set(actionPracticeQuestions.map(q => q.id))
  actionPracticeRecordings.filter(q => !servedIds.has(q.id)).forEach((q,i) => addAction(q,
    allowedIds.has(q.id) ? 'Not selected · Action recordings' : 'Excluded · Taught-scope filter', 'excluded',i+1))
  return [...rows.values()].map(row => ({...row, issues:inspectSentence(row.english,row.uses)}))
}

export const sentenceReview = buildSentenceReview()
export function isFlagged(row: ReviewSentence, decisions: ReviewDecisions): boolean {
  return decisions[row.id]?.flagged ?? row.issues.length > 0
}
export function parseDecisions(raw: string | null): ReviewDecisions {
  try {
    const parsed: unknown = JSON.parse(raw ?? '{}')
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    return Object.fromEntries(Object.entries(parsed).filter((entry): entry is [string,ReviewDecision] => {
      const value: unknown = entry[1]
      return !!value && typeof value === 'object' && 'flagged' in value && typeof value.flagged === 'boolean'
        && 'note' in value && typeof value.note === 'string' && 'updatedAt' in value && typeof value.updatedAt === 'string'
    }))
  } catch { return {} }
}
