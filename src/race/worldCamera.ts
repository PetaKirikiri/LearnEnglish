import type { RacePlayer } from './types'

// Fixed game-world artwork dimensions, never a minimum screen-pixel size.
export const WORLD_HORSE_WIDTH = 120

// Race distance and horse artwork share one scale. Lane spacing is a layout
// dimension: widen it as the camera pulls back so the track still fills the view.
export function worldCamera(players: RacePlayer[], width: number, height: number, lanes: number) {
  const first = Math.max(0, ...players.map(p => p.metres))
  const last = players.length ? Math.min(...players.map(p => p.metres)) : 0
  // The stadium plate's horizon is 32% from the top. Keep every lane on turf.
  const top = height * .32
  const lanePixels = Math.max(1, height - top - 24) / Math.max(1, lanes)
  const span = Math.max(800, first - last + WORLD_HORSE_WIDTH + 40)
  // Leave screen-space room for the readable names even at the widest zoom.
  const scale = Math.min(Math.max(1, width - 72) / span, Math.max(1, lanePixels - (lanes > 6 ? 22 : 28)) / (WORLD_HORSE_WIDTH / 1.8), .8)
  const laneHeight = lanePixels / scale
  const trackHeight = Math.max(1, lanes) * laneHeight
  const centre = (first + last) / 2
  // Follow the whole field from the start. The rails and distance marks travel
  // backwards at actual world speed; no independent scrolling or fake gaps.
  const edge = 36 + WORLD_HORSE_WIDTH / 2 * scale
  const x = Math.min(width - edge - first * scale, Math.max(edge - last * scale, width * .38 - centre * scale))
  const y = top
  const screenX = (metres: number) => x + metres * scale
  const screenY = (lane: number) => y + (lane + .5) * lanePixels
  const ruler = [10, 20, 50, 100, 200, 400].find(metres => metres * scale >= 65) ?? 400
  return { scale, x, y, screenX, screenY, trackHeight, laneHeight, ruler }
}
