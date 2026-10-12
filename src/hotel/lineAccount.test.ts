import { afterEach, expect, it, vi } from 'vitest'
import { bounded } from './lineAccount'
afterEach(() => vi.useRealTimers())
it('aborts stalled account requests', async () => {
  vi.useFakeTimers()
  let signal!: AbortSignal
  const pending = bounded(async s => { signal = s; return new Promise(() => {}) }, 10)
  const rejected = expect(pending).rejects.toThrow('too long')
  await vi.advanceTimersByTimeAsync(10); await rejected
  expect(signal.aborted).toBe(true)
})
it('returns successful account results and clears its timer', async () => {
  vi.useFakeTimers()
  expect(await bounded(async () => 'account')).toBe('account')
  expect(vi.getTimerCount()).toBe(0)
})
