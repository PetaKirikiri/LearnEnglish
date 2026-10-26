// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { answer, advanceRace, command, createRoom, joinRoom, viewRoom } from '../../server/classroomRace'
import { demoAt, demoQuestion } from './demoRace'
import { GOLDEN_SPEED, MAX_SPEED, MIN_SPEED, START_DELAY_MS, WINDOW_MS, speedFor } from './rules'

describe('golden horse streak', () => {
  it('activates on the third correct tap, ignores duplicate taps and clears on wrong or missed answers', () => {
    const questions = [demoQuestion(0), demoQuestion(1)].map(q => ({ id:q.id, english:q.english, audioUrl:q.audioUrl ?? '', correct:q.correct, choices:['Correct','Wrong'] }))
    const room = createRoom({ id:'test', title:'Test', questions }, 0)
    const token = 'a'.repeat(48)
    const player = joinRoom(room, 'Rider', token)
    command(room, room.host, 'start', -1, 0)
    for (let round = 0; round < 3; round++) {
      const at = START_DELAY_MS + WINDOW_MS * round + 500
      advanceRace(room, at)
      const correct = room.deck[round].correct
      answer(room, token, round, correct, at)
      answer(room, token, round, correct, at + 1)
      expect(viewRoom(room, room.host, at).players[0].streak).toBe(round + 1)
      expect(player.speed).toBe(speedFor(true, 500, round + 1))
    }
    const wrongAt = START_DELAY_MS + WINDOW_MS * 3 + 500
    advanceRace(room, wrongAt)
    answer(room, token, 3, 1 - room.deck[3].correct, wrongAt)
    expect(player.streak).toBe(0)
    expect(player.speed).toBe(MIN_SPEED)
    for (let round = 4; round < 7; round++) {
      const at = START_DELAY_MS + WINDOW_MS * round + 500
      advanceRace(room, at)
      answer(room, token, round, room.deck[round].correct, at)
    }
    expect(player.streak).toBe(3)
    advanceRace(room, START_DELAY_MS + WINDOW_MS * 8 + .125)
    expect(player.streak).toBe(0)
    expect(player.speed).toBe(MIN_SPEED)
  })
  it('makes even a slow golden answer faster than the fastest normal answer', () => {
    expect(speedFor(true, 4900, 3)).toBeCloseTo(18.24)
    expect(speedFor(true, 4900, 3)).toBeGreaterThan(MAX_SPEED)
    expect(speedFor(true, 0, 2)).toBe(MAX_SPEED)
    expect(speedFor(false, 0, 3)).toBe(MIN_SPEED)
  })
  it('gains ground against a normal horse while golden', () => {
    // Bea is the slow responder; Chai answers quickly but cannot sustain a streak.
    const start = demoAt(START_DELAY_MS + WINDOW_MS * 2 + 3700)
    const later = demoAt(START_DELAY_MS + WINDOW_MS * 2 + 4700)
    expect(start.players[1].streak).toBe(3)
    expect(start.players[2].streak).toBe(1)
    const gapBefore = start.players[2].metres - start.players[1].metres
    const gapAfter = later.players[2].metres - later.players[1].metres
    expect(gapAfter).toBeLessThan(gapBefore)
    expect(gapBefore - gapAfter).toBeCloseTo(start.players[1].speed - start.players[2].speed)
  })
  it.each([
    { label: 'fast normal horse', speed: MAX_SPEED, streak: 0 },
    { label: 'slow golden horse', speed: speedFor(true, 3600, 3), streak: 3 },
  ])('overtakes a $label from behind through continuous movement', ({ speed, streak }) => {
    const questions = [demoQuestion(0), demoQuestion(1)].map(q => ({ id:q.id, english:q.english, audioUrl:q.audioUrl ?? '', correct:q.correct, choices:['Correct','Wrong'] }))
    const room = createRoom({ id:'catch', title:'Catch', questions }, 0)
    const golden = joinRoom(room, 'Golden', 'b'.repeat(48))
    const normal = joinRoom(room, 'Normal', 'c'.repeat(48))
    command(room, room.host, 'start', -1, 0)
    golden.metres = 100; golden.streak = 2
    normal.metres = 120; normal.speed = speed; normal.streak = streak
    answer(room, golden.token, 0, room.deck[0].correct, START_DELAY_MS)
    expect(golden.metres).toBe(100)
    advanceRace(room, START_DELAY_MS + 4000)
    expect(golden.metres).toBe(100 + GOLDEN_SPEED * 4)
    expect(normal.metres).toBe(120 + speed * 4)
    expect(golden.metres).toBeGreaterThan(normal.metres)
  })
  it('replays streaks in the demo using the same correct-answer rule', () => {
    expect(demoAt(START_DELAY_MS + WINDOW_MS + 4000).players[0].streak).toBe(2)
    const third = demoAt(START_DELAY_MS + WINDOW_MS * 2 + 4000)
    expect(third.players.map(p => p.streak ?? 0)).toEqual([3, 3, 1, 0])
    expect(demoAt(START_DELAY_MS + WINDOW_MS * 4 + 4000).players[2].streak).toBe(0)
    expect(demoAt(START_DELAY_MS + WINDOW_MS * 7 + 4000).players[3].streak).toBe(3)
  })
})
