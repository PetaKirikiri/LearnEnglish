import { MIN_SPEED, powerLevel } from './rules'

/** Visual intensity only: never changes race speed, distance or horse size. */
export function horsePowerVisuals(speed: number, streak: number) {
  const level = powerLevel(streak)
  const momentum = Math.max(0, speed - MIN_SPEED)
  return {
    powered: level > 0,
    charge: streak === 3 ? 3 : streak === 4 ? 4 : 0,
    level,
    pulseSeconds: streak === 4 ? .8 : 1.8,
    // Smoothly approaches a fast cadence instead of hitting a fixed speed cap.
    gallopSeconds: .22 + .9 / (1 + momentum / 18),
    flowSeconds: .38 + .8 / (1 + momentum / 16),
    auraScale: 1 + .7 * (1 - Math.exp(-(level / 16 + momentum / 65))),
    wakeScale: 1 + 1.2 * (1 - Math.exp(-(level / 18 + momentum / 70))),
  }
}
