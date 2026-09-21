import { act, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { useWordCollection } from './useWordCollection'
import type { ProgressEvent } from './progressData'
const { load, pending } = vi.hoisted(() => ({ load: vi.fn(), pending: vi.fn(() => []) }))
vi.mock('./progressSync', () => ({ loadLearnerEvents: load, pending }))
vi.mock('./quizContent', () => ({ getQuizCatalogue: () => ({ sentences: [], vocabulary: [{ id: 'hot', mode: 'vocabulary', spokenText: 'hot', answer: 'ร้อน', prompt: 'hot' }] }) }))
const events: ProgressEvent[] = [0,1,2,3,4].map(n => ({ id: String(n), learner_id: 'a', kind: 'answer', occurred_at: `2026-09-${17 + Math.floor(n / 2)}T10:00:00Z`, payload: { questionId: 'word:hot', correct: true, roundId: `r-${n}` } }))
let current: ReturnType<typeof useWordCollection>
function Harness({ id }: { id: string }) { const value = useWordCollection(id); useEffect(() => { current = value }, [value]); return <span>{value.collection.conquered}</span> }
const container = document.createElement('div')
let root: ReturnType<typeof createRoot>
beforeEach(() => { localStorage.clear(); vi.clearAllMocks(); Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true }); root = createRoot(container) })
afterEach(() => act(() => root.unmount()))
it('merges live answers with a pending server load, deduplicates, and restores earned progress', async () => {
 let resolve!: (data: ProgressEvent[]) => void
 load.mockImplementationOnce(() => new Promise<ProgressEvent[]>(r => { resolve = r }))
 await act(async () => root.render(<Harness id="a" />))
 expect(current.ready).toBe(false)
 act(() => window.dispatchEvent(new CustomEvent('fifa-progress-recorded', { detail: events[4] })))
 await act(async () => resolve(events.slice(0,4)))
 expect(current.ready).toBe(true)
 expect(current.collection.conquered).toBe(1)
 act(() => window.dispatchEvent(new CustomEvent('fifa-progress-recorded', { detail: events[4] })))
 expect(current.collection.conquered).toBe(1)
 load.mockRejectedValue(new Error('offline'))
 await act(async () => root.render(<Harness key="reload" id="a" />))
 expect(current.collection.conquered).toBe(1)
 expect(current.error).toBe(true)
 await act(async () => root.render(<Harness key="other" id="b" />))
 expect(current.ready).toBe(false)
 expect(current.collection.conquered).toBe(0)
 act(() => window.dispatchEvent(new CustomEvent('fifa-progress-recorded', { detail: events[0] })))
 expect(current.collection.words[0].status).toBe('Yet to see')
})
