export const WINDOW_MS = 5_000
export const FINISH = 1_600
export const MIN_SPEED = 4
export const CORRECT_MIN_SPEED = 8
export const MAX_SPEED = 16
export const GOLDEN_MIN_SPEED = 18
export const GOLDEN_SPEED = 30
export const START_DELAY_MS = 2_500

// Metres/second from the exact elapsed milliseconds; never bucket or round.
// At t=0 use the band's maximum; at t=WINDOW_MS use its minimum.
// Wrong/missed answers are always slower than any correct answer.
export function speedFor(correct: boolean, elapsedMs: number, streak = 0) {
  if (!correct) return MIN_SPEED
  const quickness = Math.max(0, 1 - Math.max(0, elapsedMs) / WINDOW_MS)
  if (streak >= 3) return GOLDEN_MIN_SPEED + (GOLDEN_SPEED - GOLDEN_MIN_SPEED) * quickness
  return CORRECT_MIN_SPEED + (MAX_SPEED - CORRECT_MIN_SPEED) * quickness
}
