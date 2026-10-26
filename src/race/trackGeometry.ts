export const startX = 220
export const finishX = 1100
export const laneHeight = 44
export const laneTop = 124

// The course meter and every horse use this same complete-course coordinate.
export function coursePercent(metres: number, finish: number) {
  return Math.max(0, Math.min(100, metres / finish * 100))
}

// Every lane uses exactly the same horizontal scale, start and finish.
export function trackPosition(metres: number, finish: number, lane: number) {
  const progress = coursePercent(metres, finish) / 100
  return { x: startX + progress * (finishX - startX), y: laneTop + laneHeight * (lane + 0.5) }
}
