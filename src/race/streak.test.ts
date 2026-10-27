// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { answer, advanceRace, command, createRoom, joinRoom } from '../../server/classroomRace'
import { demoAt, demoQuestion, demoRoundStart } from './demoRace'
import { START_DELAY_MS, WINDOW_MS, speedFor } from './rules'

describe('golden visual streak at shared resolution',()=>{
  it('charges and transforms only when the round resolves, and clears on wrong or missed answers',()=>{
    const questions=[demoQuestion(0),demoQuestion(1)].map(q=>({id:q.id,english:q.english,audioUrl:'',correct:q.correct,choices:['Correct','Wrong']}))
    const room=createRoom({id:'test',title:'Test',questions},0)
    const player=joinRoom(room,'Rider','a'.repeat(48))
    joinRoom(room,'Waiting rider','b'.repeat(48))
    command(room,room.host,'start',-1,0)
    for(let round=0;round<5;round++) {
      const start=room.opensAt
      answer(room,player.token,round,room.deck[round].correct,start+500)
      answer(room,player.token,round,room.deck[round].correct,start+501)
      expect(player.streak??0).toBe(round)
      advanceRace(room,start+WINDOW_MS+.125)
      expect(player.streak).toBe(round+1)
    }
    const before=player.targetSpeed!
    const start=room.opensAt
    answer(room,player.token,5,1-room.deck[5].correct,start+500)
    expect(player.streak).toBe(5)
    advanceRace(room,start+WINDOW_MS+.125)
    expect(player.streak).toBe(0)
    expect(player.targetSpeed).toBeCloseTo(before*.4)
    for(let n=0;n<3;n++) {
      const start=room.opensAt
      answer(room,player.token,room.round,room.deck[room.round].correct,start+500)
      advanceRace(room,start+WINDOW_MS+.125)
    }
    expect(player.streak).toBe(3)
    advanceRace(room,room.closesAt+.125)
    expect(player.streak).toBe(0)
  })
  it('keeps golden purely visual: identical answers get identical gains',()=>{
    for(const ms of [0,1000,5000,10000]) expect(speedFor(true,ms,29,20)).toBe(speedFor(true,ms,1,20))
  })
  it('replays the same resolved streaks in the demo',()=>{
    expect(demoAt(START_DELAY_MS+demoRoundStart(3)).players.map(p=>p.streak??0)).toEqual([3,3,2,0])
    expect(demoAt(START_DELAY_MS+demoRoundStart(5)).players[0].streak).toBe(5)
    expect(demoAt(START_DELAY_MS+demoRoundStart(8)).players[3].streak).toBe(3)
  })
})
