import { FINISH, MIN_SPEED, START_DELAY_MS, WINDOW_MS, speedFor } from './rules'
import { holidayQuestions, holidayNouns } from './holidayQuestions'
import type { RacePlayer } from './types'
import type { HorseMood } from './horseGait'

export const demoRoster = [
  { id: 'alex', name: 'Alex', description: 'Fast & accurate' },
  { id: 'bea', name: 'Bea', description: 'Slow & accurate' },
  { id: 'chai', name: 'Chai', description: 'Fast, sometimes wrong' },
  { id: 'dan', name: 'Dan', description: 'Struggles, then learns' },
] as const
export function scriptedAnswer(lane: number, round: number) {
  if (lane === 0) return { correct: true, delay: 800 }
  if (lane === 1) return { correct: true, delay: 3600 }
  if (lane === 2) return { correct: round % 4 >= 2, delay: 650 }
  return { correct: round >= 5, delay: round < 5 ? 2200 : 350 }
}
export function demoQuestion(round: number) {
  const sequence = [0, 1, 2, 0, 2, 0, 0, 1]
  const r = Math.max(0, round)
  const noun = (Math.floor(r / 8) * 2 + r % 2) % holidayNouns.length
  return holidayQuestions[noun * 3 + sequence[r % sequence.length]]
}
export type DemoPlayer = RacePlayer & { mood: HorseMood; choice?: string; correct?: boolean; responseMs?: number }

// A replayable local simulation: same fixed windows, persistent speeds and
// distance integration as the classroom engine, with known answer timestamps.
// It never creates student accounts or writes scores to the database.
export function demoAt(time: number) {
  const players: DemoPlayer[] = demoRoster.map((p, lane) => ({ ...p, lane, metres: 0, speed: MIN_SPEED, answered: false, mood: 'steady' }))
  const target = Math.max(0, time - START_DELAY_MS)
  let cursor = 0
  let finished = false
  let round = 0
  const move = (until: number) => {
    const duration = (until - cursor) / 1000
    const crossing = Math.min(...players.map(p => (FINISH - p.metres) / p.speed))
    const seconds = Math.min(duration, crossing)
    players.forEach(p => { p.metres = Math.min(FINISH, p.metres + p.speed * seconds) })
    cursor += seconds * 1000
    if (crossing <= duration + 1e-9) {
      finished = true
      players.forEach(p => { if (p.metres > FINISH - 1e-8) p.metres = FINISH })
    }
  }
  while (!finished && round < 60) {
    const start = round * WINDOW_MS
    players.forEach(p => { p.answered = false; p.choice = undefined; p.correct = undefined; p.responseMs = undefined })
    const events = players.map(p => ({ lane: p.lane, ...scriptedAnswer(p.lane, round) })).sort((a, b) => a.delay - b.delay)
    for (const event of events) {
      const at = start + event.delay
      if (at > target) break
      move(at)
      if (finished) break
      const p = players[event.lane]
      const q = demoQuestion(round)
      p.answered = true
      p.correct = event.correct
      p.responseMs = event.delay
      p.choice = q.answers[event.correct ? q.correct : 1 - q.correct].map(segment => segment.text).join(' ')
      p.streak = event.correct ? (p.streak ?? 0) + 1 : 0
      p.speed = speedFor(event.correct, event.delay, p.streak)
      p.mood = !event.correct ? 'struggling' : event.delay <= 1500 ? 'confident' : 'steady'
    }
    if (finished) break
    move(Math.min(target, start + WINDOW_MS))
    if (finished || target <= start + WINDOW_MS) break
    round++
  }
  return { players, round, finished, elapsed: cursor, question: demoQuestion(round), countdown: Math.max(0, Math.ceil((START_DELAY_MS - time) / 1000)), remaining: Math.max(0, (round + 1) * WINDOW_MS - target) / 1000 }
}
