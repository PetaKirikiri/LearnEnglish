export type RaceMotion = { metres: number; speed: number; targetSpeed?: number; accelerationRemainingMs?: number }

/** Exact integration of a one-second linear acceleration/braking ramp. */
export function motionAfter(player: RaceMotion, elapsedSeconds: number): RaceMotion {
  const seconds = Math.max(0, elapsedSeconds)
  const target = player.targetSpeed ?? player.speed
  const remaining = Math.max(0, player.accelerationRemainingMs ?? 0) / 1000
  const ramp = Math.min(seconds, remaining)
  const acceleration = remaining > 0 ? (target - player.speed) / remaining : 0
  const distance = player.speed * ramp + .5 * acceleration * ramp * ramp + target * (seconds - ramp)
  return {
    metres: player.metres + distance,
    speed: seconds >= remaining ? target : player.speed + acceleration * ramp,
    targetSpeed: target,
    accelerationRemainingMs: Math.max(0, remaining - seconds) * 1000,
  }
}

/** Time of the first crossing, including a crossing in the middle of a ramp. */
export function secondsToFinish(player: RaceMotion, finish: number) {
  const distance = Math.max(0, finish - player.metres)
  if (distance === 0) return 0
  const target = player.targetSpeed ?? player.speed
  const remaining = Math.max(0, player.accelerationRemainingMs ?? 0) / 1000
  const rampDistance = (player.speed + target) / 2 * remaining
  if (remaining > 0 && distance <= rampDistance) {
    const acceleration = (target - player.speed) / remaining
    return 2 * distance / (player.speed + Math.sqrt(Math.max(0, player.speed ** 2 + 2 * acceleration * distance)))
  }
  return target > 0 ? remaining + (distance - rampDistance) / target : Infinity
}
