import type { RacePlayer } from './types'

// A single camera and scale for every lane: gaps remain honest, but the entire
// 1,600m course no longer compresses a few metres of gain into a single pixel.
export function raceCamera(players: RacePlayer[], finish: number) {
  const leader = Math.max(0, ...players.map(p => p.metres))
  const last = players.length ? Math.min(...players.map(p => p.metres)) : 0
  const spread = leader - last
  // Hold metres-to-screen scale steady so gains actually open a visible gap.
  // Widen only as the field approaches the edge, then hold that wider view.
  // Continuous fit-to-pack was cancelling the very movement we need to show.
  let span = 120
  while (spread > span * .65) {
    const t = Math.min(1, (spread - span * .65) / (span * .25))
    if (t < 1) { span *= 1 + t * t * (3 - 2 * t); break }
    span *= 2
  }
  const start = last - span * .12
  const position = (metres: number) => (metres - start) / span * 100
  const spacing = span > 300 ? 50 : 20
  const marks: number[] = []
  for (let m = Math.max(0, Math.ceil(start / spacing) * spacing); m < Math.min(finish, start + span); m += spacing) marks.push(position(m))
  const leaders = players.filter(p => leader > .1 && Math.abs(p.metres - leader) < .001).map(p => p.id)
  return { start, span, position, marks, leaders, finishPosition: position(finish) }
}
