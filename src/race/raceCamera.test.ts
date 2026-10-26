import { describe, expect, it } from 'vitest'
import { raceCamera } from './raceCamera'
import { demoAt } from './demoRace'
import { FINISH } from './rules'

describe('shared pack camera', () => {
  it('magnifies early gaps without changing their ordering or relative sizes', () => {
    const { players } = demoAt(12500)
    const c = raceCamera(players, FINISH)
    expect(c.span).toBeLessThan(FINISH / 5)
    for (let i = 1; i < players.length; i++) {
      expect(c.position(players[0].metres) - c.position(players[i].metres)).toBeCloseTo((players[0].metres - players[i].metres) / c.span * 100)
    }
  })
  it('keeps the whole pack visible throughout the race and reveals the actual finish', () => {
    for (let t = 0; t < 150000; t += 500) {
      const snapshot = demoAt(t)
      const camera = raceCamera(snapshot.players, FINISH)
      for (const p of snapshot.players) {
        expect(camera.position(p.metres)).toBeGreaterThanOrEqual(0)
        expect(camera.position(p.metres)).toBeLessThanOrEqual(100)
      }
      if (snapshot.finished) expect(camera.position(FINISH)).toBeCloseTo(camera.finishPosition)
    }
    expect(raceCamera(demoAt(0).players, FINISH).finishPosition).toBeGreaterThan(100)
    expect(raceCamera(demoAt(150000).players, FINISH).finishPosition).toBeLessThan(100)
  })
  it('does not invent a leader at the starting line', () => {
    expect(raceCamera(demoAt(0).players, FINISH).leaders).toEqual([])
    expect(raceCamera(demoAt(12500).players, FINISH).leaders).toEqual(['alex'])
  })
  it('keeps tracking at the same rate as the pack approaches the finish', () => {
    const players = demoAt(12500).players.map((p, lane) => ({ ...p, metres: FINISH - 60 - lane * 12 }))
    const before = raceCamera(players, FINISH)
    const after = raceCamera(players.map(p => ({ ...p, metres: p.metres + 20 })), FINISH)
    expect(after.span).toBe(before.span)
    expect(after.start - before.start).toBeCloseTo(20)
    expect(after.position(players[0].metres + 20)).toBeCloseTo(before.position(players[0].metres))
    expect(after.finishPosition).toBeLessThan(before.finishPosition)
  })
  it('lets a breakaway open a proportional gap without constantly squeezing it back', () => {
    const players = demoAt(0).players.map(p => ({ ...p, metres: 200 }))
    const close = raceCamera(players, FINISH)
    const breakaway = raceCamera(players.map((p, i) => ({ ...p, metres: i === 0 ? 230 : 200 })), FINISH)
    const twice = raceCamera(players.map((p, i) => ({ ...p, metres: i === 0 ? 260 : 200 })), FINISH)
    const spread = raceCamera(players.map((p, i) => ({ ...p, metres: i === 0 ? 600 : 200 })), FINISH)
    expect(breakaway.span).toBe(close.span)
    expect(twice.span).toBe(close.span)
    expect(breakaway.position(230)).toBeGreaterThan(close.position(200))
    expect(twice.position(260) - twice.position(200)).toBeCloseTo(2 * (breakaway.position(230) - breakaway.position(200)))
    expect(spread.span).toBeGreaterThan(breakaway.span)
    expect(spread.position(200)).toBeGreaterThanOrEqual(0)
    expect(spread.position(600)).toBeLessThan(100)
  })
  it('widens continuously at the edge rather than jumping between views', () => {
    const players = demoAt(0).players
    let previous = raceCamera(players, FINISH)
    for (let lead = .1; lead < FINISH; lead += .1) {
      const next = raceCamera(players.map((p, i) => ({ ...p, metres: i === 0 ? lead : 0 })), FINISH)
      expect(next.span).toBeGreaterThanOrEqual(previous.span)
      expect(Math.abs(next.position(lead) - previous.position(lead - .1))).toBeLessThan(.2)
      previous = next
    }
  })
})
