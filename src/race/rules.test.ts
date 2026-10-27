import { describe, expect, it } from 'vitest'
import { CORRECT_MIN_SPEED, GOLDEN_MIN_SPEED, GOLDEN_SPEED, MAX_SPEED, MIN_SPEED, WINDOW_MS, speedFor } from './rules'

describe('exact response-time speed', () => {
  it.each([
    [0, 16, 24],
    [2000, 14.4, 22.8],
    [2469, 14.0248, 22.5186],
    [5000, 12, 21],
    [9999.75, 8.0002, 18.00015],
    [10000, 8, 18],
  ])('maps %sms without fast/slow buckets', (ms, normal, golden) => {
    expect(speedFor(true, ms)).toBeCloseTo(normal, 10)
    expect(speedFor(true, ms, 5)).toBeCloseTo(golden, 10)
    expect(speedFor(false, ms, 5)).toBe(MIN_SPEED)
  })

  it('uses exact endpoints and distinguishes adjacent milliseconds throughout the window', () => {
    for (const streak of [0, 5]) {
      const min = streak ? GOLDEN_MIN_SPEED : CORRECT_MIN_SPEED
      const max = streak ? GOLDEN_SPEED : MAX_SPEED
      expect(speedFor(true, 0, streak)).toBe(max)
      expect(speedFor(true, WINDOW_MS, streak)).toBe(min)
      expect(MIN_SPEED).toBeLessThan(min)
      for (let ms = 0; ms < WINDOW_MS; ms++) {
        expect(speedFor(true, ms, streak) - speedFor(true, ms + 1, streak)).toBeCloseTo((max - min) / WINDOW_MS, 10)
      }
    }
  })
})

it('keeps charging at three and four, transforms at five, and has no speed level cap', () => {
  for (const n of [3,4]) expect(speedFor(true, 0, n)).toBe(MAX_SPEED)
  expect(speedFor(true, 0, 5)).toBe(24)
  for (const n of [6,20,1000]) expect(speedFor(true, 1000, n) - speedFor(true, 1000, n-1)).toBeCloseTo(1)
  expect(speedFor(false, 0, 1000)).toBe(MIN_SPEED)
})
