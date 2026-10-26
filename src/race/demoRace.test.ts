// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { answer, advanceRace, command, createRoom, joinRoom } from '../../server/classroomRace'
import { demoAt, demoQuestion, scriptedAnswer } from './demoRace'
import { FINISH, START_DELAY_MS, WINDOW_MS } from './rules'

describe('four-player scripted race', () => {
  it('starts everyone at the same point and preserves gaps between questions', () => {
    expect(demoAt(0).players.every(p => p.metres === 0)).toBe(true)
    const before = demoAt(START_DELAY_MS + WINDOW_MS - 1)
    const deadline = demoAt(START_DELAY_MS + WINDOW_MS)
    expect(deadline.round).toBe(0)
    expect(deadline.remaining).toBe(0)
    expect(deadline.players.every(p => p.answered)).toBe(true)
    const after = demoAt(START_DELAY_MS + WINDOW_MS + .125)
    expect(after.round).toBe(1)
    expect(after.players.every(p => !p.answered)).toBe(true)
    after.players.forEach((p, i) => expect(p.metres - before.players[i].metres).toBeLessThan(.02))
    expect(after.players[0].metres).toBeGreaterThan(after.players[1].metres)
  })
  it('shows wrong, slow and fast responses and Dan learning', () => {
    const first = demoAt(START_DELAY_MS + 4000)
    expect(first.players.map(p => p.mood)).toEqual(['confident', 'steady', 'struggling', 'struggling'])
    const later = demoAt(START_DELAY_MS + 5 * WINDOW_MS + 1000)
    expect(later.players[3].mood).toBe('confident')
    expect(first.players.every(p => !!p.choice)).toBe(true)
  })
  it('matches actual classroom distance/speed integration for identical answers', () => {
    const questions = [demoQuestion(0), demoQuestion(1)].map(q => ({id:q.id,english:q.english,audioUrl:q.audioUrl ?? '',choices:q.answers.map(a=>a.map(s=>s.text).join(' ')),correct:q.correct}))
    const room = createRoom({id:'test',title:'Test',questions}, 0)
    const tokens = Array.from({length:4}, (_, i) => String(i + 1).repeat(48))
    tokens.forEach((token,i) => joinRoom(room, `Player ${i}`, token))
    command(room,room.host,'start',-1,0)
    for (let round = 0; round < 40 && room.phase !== 'finished'; round++) {
      const events = tokens.map((token,lane)=>({token,...scriptedAnswer(lane,round)})).sort((a,b)=>a.delay-b.delay)
      for (const event of events) {
        const at = START_DELAY_MS + round * WINDOW_MS + event.delay
        advanceRace(room,at)
        if (room.phase === 'finished') break
        const correct = room.deck[round].correct
        answer(room,event.token,round,event.correct ? correct : 1-correct,at)
        const demo = demoAt(at)
        room.players.forEach((p,i)=>{
          expect(demo.players[i].metres).toBeCloseTo(p.metres,6)
          expect(demo.players[i].speed).toBeCloseTo(p.speed,6)
        })
      }
      const deadline = START_DELAY_MS + (round+1)*WINDOW_MS
      advanceRace(room,deadline)
      const boundary = demoAt(deadline)
      expect(boundary.round).toBe(room.round)
      room.players.forEach((p,i)=>{
        expect(boundary.players[i].metres).toBeCloseTo(p.metres,6)
        expect(boundary.players[i].answered).toBe(!!room.answers[p.id])
      })
    }
    const result = demoAt(300000)
    expect(result.finished).toBe(true)
    expect(result.players[0].metres).toBe(FINISH)
    room.players.forEach((p,i)=>expect(result.players[i].metres).toBeCloseTo(p.metres,6))
  })
})
