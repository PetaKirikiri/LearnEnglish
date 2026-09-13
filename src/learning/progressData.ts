import type { QuizQuestion } from './quizContent'

export type ProgressEvent = {
  id: string
  learner_id: string
  kind: 'answer' | 'round_completed' | 'visit' | 'login' | 'active_time' | 'legacy_import'
  occurred_at: string
  payload: {
    questionId?: string
    mode?: 'vocabulary' | 'sentences'
    word?: string
    correct?: boolean
    choice?: string
    roundId?: string
    seconds?: number
    correctCount?: number
    wrongCount?: number
  }
}

export type ItemProgress = {
  correct: number
  wrong: number
  correctRounds: Set<string>
  lastAnswered: string | null
  status: 'Not started' | 'Practising' | 'Needs review' | 'Learned'
}

export function summarizeProgress(events: readonly ProgressEvent[]) {
  const items = new Map<string, ItemProgress>()
  const unique = [...new Map(events.map(event => [event.id, event])).values()]
    .sort((a, b) => a.occurred_at.localeCompare(b.occurred_at) || a.id.localeCompare(b.id))
  const activity = unique.filter(event => event.kind !== 'legacy_import')
  for (const event of unique) {
    const p = event.payload
    if ((event.kind !== 'answer' && event.kind !== 'legacy_import') || !p.questionId) continue
    const item = items.get(p.questionId) ?? { correct: 0, wrong: 0, correctRounds: new Set<string>(), lastAnswered: null, status: 'Not started' as const }
    if (event.kind === 'legacy_import') {
      item.correct += p.correctCount ?? 0
      item.wrong += p.wrongCount ?? 0
      // Old counters cannot prove separate successful rounds.
      item.status = item.wrong > item.correct ? 'Needs review' : 'Practising'
    } else if (p.correct) {
      item.correct += 1
      if (p.roundId) item.correctRounds.add(p.roundId)
      item.status = item.correctRounds.size >= 3 ? 'Learned' : 'Practising'
    } else {
      item.wrong += 1
      item.correctRounds.clear()
      item.status = 'Needs review'
    }
    item.lastAnswered = event.occurred_at
    items.set(p.questionId, item)
  }
  return {
    items,
    visits: activity.filter(event => event.kind === 'visit').length,
    logins: activity.filter(event => event.kind === 'login').length,
    rounds: activity.filter(event => event.kind === 'round_completed').length,
    seconds: activity.filter(event => event.kind === 'active_time').reduce((sum, event) => sum + Math.max(0, Math.min(30, event.payload.seconds ?? 0)), 0),
    lastActive: activity.at(-1)?.occurred_at ?? null,
    firstTracked: activity[0]?.occurred_at ?? null,
    correct: [...items.values()].reduce((sum, item) => sum + item.correct, 0),
    wrong: [...items.values()].reduce((sum, item) => sum + item.wrong, 0),
  }
}

export function questionProgressKey(question: QuizQuestion) {
  // Word counts may change as stories are added; the word's identity must not.
  return question.mode === 'vocabulary' ? `word:${question.spokenText}` : question.id
}
