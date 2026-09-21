import { expect, it } from 'vitest'
import { buildWordConfidence } from './wordConfidence'
import type { QuizQuestion } from './quizContent'
import type { ProgressEvent } from './progressData'
const now = Date.parse('2026-09-20T12:00:00Z')
const vocab: QuizQuestion = { id: 'hot', mode: 'vocabulary', spokenText: 'hot', answer: 'ร้อน', prompt: 'hot', choices: [], instruction: '', sourceTitle: '', example: '', audioUrl: '' }
const particles = [1, 2, 3].map(n => ({ ...vocab, id: `can-${n}`, mode: 'sentences' as const, answer: 'can', prompt: `Prompt ${n}` }))
const answer = (n: number, questionId = 'word:hot', extra = {}): ProgressEvent => ({ id: String(n), learner_id: 'person', kind: 'answer', occurred_at: `2026-09-${17 + Math.floor(n / 2)}T10:00:00Z`, payload: { questionId, correct: true, roundId: `round-${n}`, ...extra } })
const successes = () => [0, 1, 2, 3, 4].map(n => answer(n))
it('requires repeated independent recall across days', () => {
 expect(buildWordConfidence([answer(0)], [vocab], now)[0].status).toBe('Building confidence')
 expect(buildWordConfidence(successes(), [vocab], now)[0].status).toBe('Confident')
 expect(buildWordConfidence(successes().map(e => ({ ...e, occurred_at: '2026-09-19T10:00:00Z' })), [vocab], now)[0].status).toBe('Building confidence')
})
it('deduplicates uploads and repeated items within a round', () => {
 const events = successes().map(e => ({ ...e, payload: { ...e.payload, roundId: 'same' } }))
 const row = buildWordConfidence([...events, events[0]], [vocab], now)[0]
 expect(row.successful).toBe(1)
 expect(row.correct).toBe(5)
 expect(row.status).toBe('Building confidence')
})
it('mistakes and help reset evidence', () => {
 for (const extra of [{ correct: false }, { helpWords: ['hot'] }]) {
 const row = buildWordConfidence([...successes(), answer(5, 'word:hot', extra)], [vocab], now)[0]
 expect(row.status).toBe('Needs review'); expect(row.successful).toBe(0)
 }
})
it('requires different sentence prompts for particles', () => {
 const events = successes().map((e, n) => ({ ...e, payload: { ...e.payload, questionId: particles[n % 3].id } }))
 expect(buildWordConfidence(events, particles, now)[0].status).toBe('Confident')
 expect(buildWordConfidence(events.map(e => ({ ...e, payload: { ...e.payload, questionId: particles[0].id } })), particles, now)[0].status).toBe('Building confidence')
})
it('does not infer confidence from imports, missing rounds, or future answers', () => {
 const legacy = { ...answer(0), kind: 'legacy_import' as const, payload: { questionId: 'word:hot', correctCount: 50 } }
 expect(buildWordConfidence([legacy], [vocab], now)[0]).toMatchObject({ status: 'Not practised', legacy: 50 })
 expect(buildWordConfidence(successes().map(e => ({ ...e, payload: { ...e.payload, roundId: undefined } })), [vocab], now)[0].status).toBe('Building confidence')
 expect(buildWordConfidence(successes(), [vocab], Date.parse('2026-09-01'))[0].status).toBe('Not practised')
})
it('moves stale words to review and credits only tested words', () => {
 const rows = buildWordConfidence(successes(), [vocab, ...particles], now + 8 * 86400000)
 expect(rows.find(r => r.word === 'hot')?.status).toBe('Needs review')
 expect(rows.find(r => r.word === 'can')?.status).toBe('Not practised')
})
