import type { RaceView } from './types'

// Extrapolate between server samples, never past the next question boundary or
// indefinitely on a broken connection. The server owns all distance and wins.
export function movingPlayers(view: RaceView, now: number) {
  const elapsed = view.phase === 'answering'
    ? Math.max(0, Math.min(now, view.closesAt, view.serverNow + 750) - Math.max(view.motionAt, view.opensAt)) / 1000
    : 0
  return view.players.map(p => ({ ...p, metres: Math.min(view.finish, p.metres + p.speed * elapsed) }))
}
