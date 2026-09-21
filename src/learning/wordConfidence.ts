import type { QuizQuestion } from './quizContent'
import type { ProgressEvent } from './progressData'
import { questionProgressKey } from './progressData'

export type ConfidenceStatus = 'Confident' | 'Building confidence' | 'Needs review' | 'Not practised'
export type WordConfidence = {
  key: string; word: string; mode: QuizQuestion['mode']; status: ConfidenceStatus
  correct: number; wrong: number; helped: number; days: number; rounds: number; examples: number
  successful: number; lastAnswered: string | null; legacy: number; conqueredAt: string | null
}
const dayFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' })
const day = (date: string) => dayFormatter.format(new Date(date))

// Confidence is evidence of independent recall, not a psychological assessment.
// Only the tested target counts; surrounding sentence words are not credited.
export function buildWordConfidence(events: readonly ProgressEvent[], questions: readonly QuizQuestion[], now = Date.now()): WordConfidence[] {
  const wordQuestions = questions.filter(q => q.examCategory !== 'reading' && q.examCategory !== 'dialogue')
  const byQuestion = new Map(wordQuestions.map(q => [questionProgressKey(q), q]))
  const groups = new Map<string, { row: WordConfidence; days: Set<string>; rounds: Set<string>; examples: Set<string> }>()
  for (const q of wordQuestions) {
    const word = (q.mode === 'vocabulary' ? q.spokenText : q.answer).toLowerCase()
    const key = `${q.mode}:${word}`
    if (!groups.has(key)) groups.set(key, { row: { key, word, mode: q.mode, status: 'Not practised', correct: 0, wrong: 0, helped: 0, days: 0, rounds: 0, examples: 0, successful: 0, lastAnswered: null, legacy: 0, conqueredAt: null }, days: new Set(), rounds: new Set(), examples: new Set() })
  }
  const seenEvidence = new Set<string>()
  const ordered = [...new Map(events.map(e => [e.id, e])).values()].filter(e => Number.isFinite(Date.parse(e.occurred_at)) && Date.parse(e.occurred_at) <= now).sort((a, b) => Date.parse(a.occurred_at) - Date.parse(b.occurred_at) || a.id.localeCompare(b.id))
  for (const event of ordered) {
    if (event.kind !== 'answer' && event.kind !== 'legacy_import') continue
    const q = byQuestion.get(event.payload.questionId ?? '')
    if (!q) continue
    const group = groups.get(`${q.mode}:${(q.mode === 'vocabulary' ? q.spokenText : q.answer).toLowerCase()}`)!
    const { row } = group
    if (event.kind === 'legacy_import') { row.legacy += (event.payload.correctCount ?? 0) + (event.payload.wrongCount ?? 0); continue }
    if (typeof event.payload.correct !== 'boolean') continue
    row.lastAnswered = event.occurred_at
    const helped = Boolean(event.payload.helpWords?.length)
    if (event.payload.correct) row.correct++; else row.wrong++
    if (helped) row.helped++
    if (!event.payload.correct || helped) {
      row.successful = 0; group.days.clear(); group.rounds.clear(); group.examples.clear()
      row.status = 'Needs review'
    } else {
      row.status = 'Building confidence'
      if (event.payload.roundId) {
        // Replayed answers to the same item in one round are one piece of evidence.
        const evidenceKey = `${event.payload.roundId}:${q.id}`
        if (!seenEvidence.has(`${row.key}:${evidenceKey}`)) {
          seenEvidence.add(`${row.key}:${evidenceKey}`)
          row.successful++
          group.days.add(day(event.occurred_at)); group.rounds.add(event.payload.roundId); group.examples.add(q.mode === 'vocabulary' ? q.spokenText : q.prompt)
          if (!row.conqueredAt && row.successful >= 5 && group.days.size >= 3 && group.rounds.size >= 3 && (row.mode === 'vocabulary' || group.examples.size >= 3)) row.conqueredAt = event.occurred_at
        }
      }
    }
  }
  return [...groups.values()].map(({ row, days, rounds, examples }) => {
    row.days = days.size; row.rounds = rounds.size; row.examples = examples.size
    if (row.successful >= 5 && row.days >= 3 && row.rounds >= 3 && (row.mode === 'vocabulary' || row.examples >= 3)) row.status = 'Confident'
    if (row.lastAnswered && now - Date.parse(row.lastAnswered) >= 7 * 86_400_000) row.status = 'Needs review'
    return row
  }).sort((a, b) => a.word.localeCompare(b.word) || a.mode.localeCompare(b.mode))
}
