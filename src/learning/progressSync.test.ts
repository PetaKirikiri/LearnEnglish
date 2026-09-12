import { beforeEach, describe, expect, it, vi } from 'vitest'

const mock = vi.hoisted(() => ({ userId: 'learner', upsert: vi.fn() }))
vi.mock('../lib/supabase', () => ({ supabase: {
  auth: { getSession: async () => ({ data: { session: { user: { id: mock.userId } } } }) },
  from: () => ({ upsert: mock.upsert }),
} }))
import { flushProgress, queueProgress } from './progressSync'
import type { ProgressEvent } from './progressData'

const event: ProgressEvent = { id: 'test-event', learner_id: 'learner', kind: 'answer', occurred_at: '2026-09-12T00:00:00Z', payload: { questionId: 'word:train', correct: true } }
const key = 'fifa-english:pending-progress:v1:learner'

beforeEach(() => {
  localStorage.clear()
  mock.userId = 'learner'
  mock.upsert.mockReset()
  mock.upsert.mockResolvedValue({ error: null })
})

describe('progress upload queue', () => {
  it('retains an answer when offline and removes it only after a successful retry', async () => {
    mock.upsert.mockResolvedValueOnce({ error: new Error('offline') })
    queueProgress(event)
    await flushProgress('learner')
    expect(JSON.parse(localStorage.getItem(key)!)).toHaveLength(1)
    await flushProgress('learner')
    expect(JSON.parse(localStorage.getItem(key)!)).toEqual([])
    expect(mock.upsert).toHaveBeenCalledWith([event], { onConflict: 'id', ignoreDuplicates: true })
  })

  it('never uploads one learner’s pending answers under another account', async () => {
    mock.userId = 'other-learner'
    queueProgress(event)
    await flushProgress('learner')
    expect(mock.upsert).not.toHaveBeenCalled()
    expect(JSON.parse(localStorage.getItem(key)!)).toHaveLength(1)
  })
})
