export const WINDOW_MS = 10_000
export const FINISH = 6_000
// Internal units are metres/second; the visible rules are 5 km/h and +0..5 km/h.
export const MIN_SPEED = 5 / 3.6
export const MAX_BOOST = 5 / 3.6
export const SPEED_TRANSITION_MS = 1_000
export const MAX_SPEED = MIN_SPEED + MAX_BOOST
// Legacy renderer thresholds only; golden form has no extra scoring bonus.
export const GOLDEN_MIN_SPEED = MIN_SPEED
export const GOLDEN_SPEED = MAX_SPEED
export const powerLevel = (streak: number) => Math.max(0, Math.floor(streak) - 4)
export const START_DELAY_MS = 2_500

// Tied horses share a position; lane/join order must never decide a penalty.
export function racePositions(players: readonly { metres: number }[]) {
  return players.map(player => 1 + players.filter(other => other.metres > player.metres + 1e-8).length)
}

export function wrongAnswerPenalty(position: number, fieldSize = 4) {
  if (position <= 1) return 0.6
  if (position >= fieldSize) return 0.2
  return position === 2 ? 0.4 : position === 3 ? 0.3 : 0.2
}

export function speedFor(correct: boolean, elapsedMs: number, _streak = 0, previousSpeed = MIN_SPEED, position = 1, fieldSize = 4) {
  void _streak // Retained for callers; golden power is visual, not a scoring bonus.
  const previous = Math.max(MIN_SPEED, previousSpeed)
  if (!correct) return Math.max(MIN_SPEED, previous * (1 - wrongAnswerPenalty(position, fieldSize)))
  const quickness = Math.max(0, 1 - Math.max(0, elapsedMs) / WINDOW_MS)
  return previous + MAX_BOOST * quickness
}

export function roundResult(player: { speed: number; targetSpeed?: number; streak?: number }, correct: boolean, elapsedMs: number, position = 1, fieldSize = 4) {
  const streak = correct ? (player.streak ?? 0) + 1 : 0
  return {
    streak,
    targetSpeed: speedFor(correct, elapsedMs, streak, player.targetSpeed ?? player.speed, position, fieldSize),
    accelerationRemainingMs: SPEED_TRANSITION_MS,
  }
}
