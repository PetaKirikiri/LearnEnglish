import { describe, expect, it } from 'vitest'
import { summarizeProgress, type ProgressEvent } from './progressData'

function answer(id: string, correct: boolean, roundId = id): ProgressEvent {
  return { id, learner_id: 'learner', kind: 'answer', occurred_at: `2026-09-12T12:00:${id.padStart(2, '0')}Z`, payload: { questionId: 'word:train', correct, roundId, mode: 'vocabulary' } }
}

describe('learner progress', () => {
  it('requires three independent rounds and deduplicates retried uploads', () => {
    const events = [answer('1', true, 'round-a'), answer('2', true, 'round-a'), answer('3', true, 'round-b')]
    expect(summarizeProgress(events).items.get('word:train')?.status).toBe('Practising')
    events.push(answer('4', true, 'round-c'), answer('4', true, 'round-c'))
    const result = summarizeProgress(events)
    expect(result.items.get('word:train')?.status).toBe('Learned')
    expect(result.correct).toBe(4)
  })

  it('a mistake resets mastery, and three later rounds restore it', () => {
    const events = [answer('1', true), answer('2', true), answer('3', true), answer('4', false)]
    expect(summarizeProgress(events).items.get('word:train')?.status).toBe('Needs review')
    events.push(answer('5', true), answer('6', true))
    expect(summarizeProgress(events).items.get('word:train')?.status).toBe('Practising')
    events.push(answer('7', true))
    expect(summarizeProgress(events).items.get('word:train')?.status).toBe('Learned')
  })

  it('old counters add attempts but do not invent mastery or activity dates', () => {
    const legacy: ProgressEvent = { ...answer('1', true), kind: 'legacy_import', payload: { questionId: 'word:train', correctCount: 8, wrongCount: 2 } }
    const result = summarizeProgress([legacy])
    expect(result.items.get('word:train')?.status).toBe('Practising')
    expect(result.correct).toBe(8)
    expect(result.wrong).toBe(2)
    expect(result.firstTracked).toBeNull()
    expect(result.visits).toBe(0)
  })

  it('keeps visit, login, completed round and active-time totals distinct', () => {
    const kinds = ['visit', 'login', 'round_completed', 'active_time'] as const
    const events = kinds.map((kind, index) => ({ ...answer(String(index), true), kind, payload: { seconds: 15 } }))
    const result = summarizeProgress(events)
    expect([result.visits, result.logins, result.rounds, result.seconds, result.correct]).toEqual([1, 1, 1, 15, 0])
  })
})
