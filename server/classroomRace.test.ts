// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { advanceRace, answer, command, createRoom, FINISH, joinRoom, prepareRace, selectQuestions, token, viewRoom, WINDOW_MS } from './classroomRace'
import type { RaceStage } from './classroomRace'
import { racePools } from '../src/race/pools'
import { MIN_SPEED } from '../src/race/rules'
const stage = { ...racePools[0], questions: racePools[0].questions.map(q => ({ id: q.id, english: q.english, audioUrl: q.audioUrl!, choices: q.answers.map(a => a.map(t => t.text).join('')), correct: q.correct })) }
function setup(count = 2) {
  const room = createRoom(stage, 100)
  const players = Array.from({length:count}, (_, i) => joinRoom(room, `Rider ${i}`, token()))
  command(room, room.host, 'start', -1, 1000)
  return {room, players, start:room.opensAt}
}
describe('simultaneous classroom race', () => {
  it('holds every horse still until the opening round closes, then ramps together',()=>{
    const {room,players,start}=setup(4)
    const correct=room.deck[0].correct
    answer(room,players[0].token,0,correct,start+500)
    answer(room,players[1].token,0,correct,start+1500)
    answer(room,players[2].token,0,1-correct,start+2000)
    advanceRace(room,start+3500)
    players.forEach(p=>expect(p).toMatchObject({metres:0,speed:0,targetSpeed:0}))
    answer(room,players[3].token,0,correct,start+4000)
    expect(room.round).toBe(1)
    expect(room.opensAt).toBe(start+4000)
    expect(room.closesAt).toBe(start+14000)
    players.forEach(p=>expect(p).toMatchObject({metres:0,speed:0,accelerationRemainingMs:1000}))
    expect(players[0].targetSpeed!*3.6).toBeCloseTo(24.75)
    expect(players[1].targetSpeed!*3.6).toBeCloseTo(24.25)
    expect(players[2].targetSpeed!*3.6).toBeCloseTo(20)
    advanceRace(room,start+4500)
    players.forEach(p=>expect(p.speed).toBeCloseTo(p.targetSpeed!/2))
    advanceRace(room,start+5000)
    players.forEach(p=>expect(p.speed).toBeCloseTo(p.targetSpeed!))
  })
  it('does not give an early answer any extra movement at the new speed',()=>{
    const {room,players,start}=setup()
    players.forEach(p=>{p.speed=7;p.targetSpeed=7;p.streak=3})
    answer(room,players[0].token,0,room.deck[0].correct,start+100)
    advanceRace(room,start+7000)
    players.forEach(p=>expect(p.metres).toBeCloseTo(49))
    expect(players.map(p=>p.speed)).toEqual([7,7])
    expect(players.map(p=>p.streak)).toEqual([3,3])
    answer(room,players[1].token,0,room.deck[0].correct,start+8000)
    players.forEach(p=>expect(p.metres).toBeCloseTo(56))
    expect(players[0].targetSpeed).toBeGreaterThan(players[1].targetSpeed!)
    expect(players.every(p=>p.speed===7&&p.accelerationRemainingMs===1000)).toBe(true)
  })
  it('applies recorded boosts and missing-answer penalties at the common deadline',()=>{
    const {room,players,start}=setup()
    players.forEach(p=>{p.speed=40/3.6;p.targetSpeed=p.speed})
    answer(room,players[0].token,0,room.deck[0].correct,start+2000)
    advanceRace(room,start+10000)
    expect(room.round).toBe(0)
    expect(players.every(p=>p.speed===40/3.6)).toBe(true)
    advanceRace(room,start+10000.125)
    expect(room.round).toBe(1)
    expect(players[0].targetSpeed!*3.6).toBeCloseTo(40)
    expect(players[1].targetSpeed!*3.6).toBeCloseTo(20)
    expect(players[0].metres-players[1].metres).toBeLessThan(.000001)
  })
  it('accepts exactly ten seconds with zero boost and rejects late answers',()=>{
    const {room,players,start}=setup()
    answer(room,players[0].token,0,room.deck[0].correct,start+10000)
    expect(players[0].speed).toBe(0)
    expect(()=>answer(room,players[1].token,0,room.deck[0].correct,start+10000.125)).toThrow('That question has finished.')
    expect(players[0].targetSpeed).toBe(MIN_SPEED)
    expect(players[0].streak).toBe(1)
    expect(players[1].streak).toBe(0)
  })
  it('applies position penalties together and integrates the full braking second',()=>{
    const {room,players,start}=setup()
    players.forEach((p,i)=>{p.speed=(i?30:40)/3.6;p.targetSpeed=p.speed;p.streak=9})
    answer(room,players[0].token,0,1-room.deck[0].correct,start+100)
    expect(players[0].speed*3.6).toBeCloseTo(40)
    answer(room,players[1].token,0,1-room.deck[0].correct,start+900)
    expect(players.map(p=>p.streak)).toEqual([0,0])
    advanceRace(room,start+1400)
    expect(players[0].speed*3.6).toBeCloseTo(30)
    expect(players[1].speed*3.6).toBeCloseTo(27)
    advanceRace(room,start+1900)
    expect(players[0].speed*3.6).toBeCloseTo(20)
    expect(players[1].speed*3.6).toBeCloseTo(24)
  })
  it.each(['answers', 'timeout'])('uses all four distance ranks at the shared %s boundary', mode=>{
    const {room,players,start}=setup(4)
    // Join/lane order deliberately differs from race position.
    const metres=[60,120,30,90]
    players.forEach((p,i)=>Object.assign(p,{metres:metres[i],speed:40/3.6,targetSpeed:40/3.6}))
    if(mode==='answers') {
      players.forEach((p,i)=>answer(room,p.token,0,1-room.deck[0].correct,start+(i+1)*100))
    } else {
      advanceRace(room,start+WINDOW_MS+.125)
    }
    ;[28,20,32,24].forEach((speed,i)=>expect(players[i].targetSpeed!*3.6).toBeCloseTo(speed))
  })
  it('uses position after an overtake, not position when the early answer arrived',()=>{
    const {room,players,start}=setup(4)
    players.forEach((p,i)=>Object.assign(p,{metres:[1,0,-10,-20][i],speed:[35,40,20,20][i]/3.6,targetSpeed:[35,40,20,20][i]/3.6}))
    const wrong=1-room.deck[0].correct
    answer(room,players[0].token,0,wrong,start+100)
    expect(players[0].metres).toBeGreaterThan(players[1].metres)
    expect(players[0].targetSpeed!*3.6).toBeCloseTo(35)
    players.slice(1).forEach(p=>answer(room,p.token,0,wrong,start+1000))
    expect(players[1].metres).toBeGreaterThan(players[0].metres)
    expect(players[0].targetSpeed!*3.6).toBeCloseTo(21)
    expect(players[1].targetSpeed!*3.6).toBeCloseTo(20)
  })
  it('locks first answers and retries the last answer without applying the round twice',()=>{
    const {room,players,start}=setup()
    const correct=room.deck[0].correct
    answer(room,players[0].token,0,correct,start+500)
    answer(room,players[0].token,0,1-correct,start+600)
    answer(room,players[1].token,0,correct,start+1000)
    const targets=players.map(p=>p.targetSpeed)
    answer(room,players[1].token,0,correct,start+1001)
    expect(room.round).toBe(1)
    expect(players.map(p=>p.targetSpeed)).toEqual(targets)
    expect(players.map(p=>p.streak)).toEqual([1,1])
  })
  it('waits for all ten players rather than settling after four',()=>{
    const {room,players,start}=setup(10)
    players.slice(0,4).forEach(p=>answer(room,p.token,0,room.deck[0].correct,start+100))
    expect(room.round).toBe(0)
    expect(players.every(p=>p.speed===0)).toBe(true)
    players.slice(4).forEach(p=>answer(room,p.token,0,room.deck[0].correct,start+200))
    expect(room.round).toBe(1)
    expect(players.every(p=>p.accelerationRemainingMs===1000)).toBe(true)
  })
  it('settles solo rounds immediately but still accelerates smoothly',()=>{
    const {room,players,start}=setup(1)
    answer(room,players[0].token,0,room.deck[0].correct,start+100)
    expect(room.round).toBe(1)
    expect(players[0].speed).toBe(0)
    advanceRace(room,start+600)
    const priorTarget=players[0].targetSpeed!
    answer(room,players[0].token,1,room.deck[1].correct,start+600)
    expect(players[0].speed).toBeCloseTo(priorTarget/2)
    expect(players[0].targetSpeed).toBeGreaterThan(priorTarget)
  })
  it('rejects outside, invalid, premature and unauthorized actions',()=>{
    const {room,players,start}=setup()
    expect(()=>answer(room,players[0].token,0,0,start-1)).toThrow()
    expect(()=>answer(room,'outsider',0,0,start)).toThrow()
    expect(()=>answer(room,players[0].token,0,2,start)).toThrow()
    expect(()=>command(room,players[0].token,'finish',0,start)).toThrow()
    expect(()=>command(room,room.host,'start',0,start)).toThrow()
  })
  it('stops everyone at the exact crossing during an acceleration ramp',()=>{
    const {room,players,start}=setup()
    Object.assign(players[0],{metres:FINISH-5,speed:10,targetSpeed:20,accelerationRemainingMs:1000})
    Object.assign(players[1],{metres:100,speed:10,targetSpeed:10})
    const crossing=Math.sqrt(2)-1
    advanceRace(room,start+3000)
    expect(room.phase).toBe('finished')
    expect(room.updatedAt).toBeCloseTo(start+crossing*1000,8)
    expect(players[0].metres).toBe(FINISH)
    expect(players[1].metres).toBeCloseTo(100+crossing*10)
    const stopped=players[1].metres
    advanceRace(room,start+30000)
    expect(players[1].metres).toBe(stopped)
  })
  it('replays persisted ramps identically with frequent polls or after an outage',()=>{
    const {room,players,start}=setup(1)
    answer(room,players[0].token,0,room.deck[0].correct,start+500)
    const restored=JSON.parse(JSON.stringify(room))
    for(let t=start+600;t<=start+30500;t+=100)advanceRace(room,t)
    advanceRace(restored,start+30500)
    expect(room.players[0].metres).toBeCloseTo(restored.players[0].metres,8)
    expect(room.players[0].speed).toBeCloseTo(restored.players[0].speed,8)
    expect(room.round).toBe(restored.round)
  })
  it.each(racePools.map(pool=>pool.id))('finishes %s with every answer missed in 103 seconds from Start',stageId=>{
    const {room,players,start}=setup(10)
    room.stageId=stageId
    advanceRace(room,start+100499)
    expect(room.phase).toBe('answering')
    expect(room.round).toBeGreaterThanOrEqual(10)
    advanceRace(room,start+100501)
    expect(room.phase).toBe('finished')
    expect(players[0].metres).toBe(FINISH)
    expect(room.updatedAt-1000).toBeCloseTo(103000,5)
  })
  it('preserves identity on rejoin and enforces ten unique players',()=>{
    const {room,players,start}=setup(10)
    expect(joinRoom(room,players[0].name,players[0].token)).toBe(players[0])
    expect(()=>joinRoom(room,'Late',token())).toThrow()
    advanceRace(room,start+1000)
    expect(players.every(p=>p.metres===0)).toBe(true)
  })
  it('does not expose answers or credentials to phones',()=>{
    const {room,players,start}=setup()
    const view=viewRoom(room,players[0].token,start)
    expect(view.question?.english).toBe(room.deck[room.round].english)
    expect(view.question?.correct).toBeUndefined()
    expect(view.question?.audioUrl).toBeUndefined()
    expect(JSON.stringify(view)).not.toContain(room.host)
    expect(JSON.stringify(view)).not.toContain(players[0].token)
  })
})

describe('selected holiday meanings', () => {
  const taxi = 'แท็กซี่อยู่ที่ไหน'
  const hotel = 'โรงแรมอยู่ที่ไหน'
  const toilet = 'ห้องน้ำอยู่ที่ไหน'
  const meaningStage: RaceStage = { id: 'holiday-meaning', title: 'Where is the…?', kind: 'meaning', questions: [
    { id: 'taxi', english: 'Where is the taxi?', audioUrl: '/audio/race-holiday/taxi-complete.wav', choices: [taxi, toilet], correct: 0 },
    { id: 'hotel', english: 'Where is the hotel?', audioUrl: '/audio/race-holiday/hotel-complete.wav', choices: [toilet, hotel], correct: 1 },
    { id: 'toilet', english: 'Where is the toilet?', audioUrl: '/audio/race-holiday/toilet-complete.wav', choices: [toilet, taxi], correct: 0 },
  ] }
  it('rebuilds distractors from selected taxi/hotel meanings while preserving the correct index', () => {
    const original = JSON.stringify(meaningStage)
    const selected = selectQuestions(meaningStage, ['hotel', 'taxi'])
    expect(selected.questions.map(q => q.id)).toEqual(['taxi', 'hotel'])
    expect(selected.questions.map(q => q.correct)).toEqual([0, 1])
    expect(selected.questions.map(q => q.choices[q.correct])).toEqual([taxi, hotel])
    selected.questions.forEach(q => expect(q.choices).toEqual([taxi, hotel]))
    expect(JSON.stringify(meaningStage)).toBe(original)
    const room = createRoom(selected, 0)
    joinRoom(room, 'Learner', token())
    command(room, room.host, 'start', -1, 0)
    advanceRace(room, room.opensAt + WINDOW_MS * 40)
    room.deck.forEach(q => {
      expect(q.choices.toSorted()).toEqual([taxi, hotel].toSorted())
      expect(q.choices[q.correct]).toBe(q.id === 'taxi' ? taxi : hotel)
      expect(q.audioUrl).toBe(`/audio/race-holiday/${q.id}-complete.wav`)
    })
  })
  it('supports more than two selected meanings and keeps each question binary', () => {
    const room = createRoom(meaningStage, 0)
    expect(room.kind).toBe('meaning')
    expect(room.pool).toHaveLength(3)
    expect(new Set(room.pool.map(q => q.choices.join('|'))).size).toBeGreaterThan(1)
    room.pool.forEach(q => {
      expect(q.choices).toHaveLength(2)
      expect(new Set(q.choices).size).toBe(2)
      expect(q.choices.every(choice => [taxi, hotel, toilet].includes(choice))).toBe(true)
    })
    prepareRace(room, room.host, selectQuestions(meaningStage, ['taxi', 'hotel']), 1, 100)
    expect(room.run).toBe(2)
    room.pool.forEach(q => expect(q.choices.toSorted()).toEqual([taxi, hotel].toSorted()))
  })
  it('rejects a single word, a single distinct meaning and duplicate binary options', () => {
    expect(() => selectQuestions(meaningStage, ['taxi'])).toThrow()
    expect(() => createRoom({ ...meaningStage, questions: [meaningStage.questions[0], { ...meaningStage.questions[0], id: 'taxi-again' }] })).toThrow('two different meanings')
    expect(() => createRoom({ ...meaningStage, questions: [{ ...meaningStage.questions[0], choices: [taxi, taxi] }, meaningStage.questions[1]] })).toThrow('two different meanings')
  })
  it('leaves legacy fixed-choice and judgement selections unchanged', () => {
    expect(selectQuestions(stage).questions).toEqual(stage.questions)
    const pool = racePools.find(p => p.id === 'where-is-the')!
    const judgement = { ...pool, questions: pool.questions.map(q => ({ id: q.id, english: q.english, audioUrl: q.audioUrl ?? '', correct: q.correct, choices: q.answers.map(a => a.map(s => s.text).join('')) })) }
    const selected = selectQuestions(judgement, judgement.questions.slice(0, 2).map(q => q.id))
    expect(selected.questions).toEqual(judgement.questions.slice(0, 2))
    expect(() => createRoom({ ...meaningStage, kind: undefined })).toThrow()
  })
})

describe('repeated races in one classroom', () => {
  const nextStage: RaceStage = { id: 'questions', title: 'Correct or wrong', kind: 'judgement', questions: [
    { id: 'complete', english: 'Where is the hotel?', audioUrl: '', choices: ['Correct', 'Wrong'], correct: 0 },
    { id: 'missing-is', english: 'Where the hotel?', audioUrl: '', choices: ['Correct', 'Wrong'], correct: 1 },
    { id: 'missing-the', english: 'Where is hotel?', audioUrl: '', choices: ['Correct', 'Wrong'], correct: 1 },
  ] }
  it('prepares another race without changing the room, join identity or roster', () => {
    const {room,players,start} = setup(2)
    answer(room, players[0].token, 0, room.deck[0].correct, start + 1000)
    command(room, room.host, 'finish', room.round, start + 2000, 1)
    const identity = { id: room.id, host: room.host, createdAt: room.createdAt }
    const roster = room.players.map(({ id, token, name, lane }) => ({ id, token, name, lane }))
    prepareRace(room, room.host, selectQuestions(nextStage, ['missing-the', 'complete']), 1, start + 3000)
    expect({ id: room.id, host: room.host, createdAt: room.createdAt }).toEqual(identity)
    expect(room.players.map(({ id, token, name, lane }) => ({ id, token, name, lane }))).toEqual(roster)
    expect(room).toMatchObject({ run: 2, stageId: 'questions', title: 'Correct or wrong', kind: 'judgement', phase: 'lobby', round: -1, deck: [], answers: {}, opensAt: 0, closesAt: 0, updatedAt: start + 3000 })
    expect(room.pool.map(q => q.id)).toEqual(['complete', 'missing-the'])
    room.players.forEach(player => expect(player).toMatchObject({ metres: 0, speed: 0, streak: 0 }))
    expect(joinRoom(room, players[0].name, players[0].token)).toBe(players[0])
    command(room, room.host, 'start', -1, start + 4000, 2)
    expect(room.round).toBe(0)
    answer(room, players[0].token, 0, room.deck[0].correct, room.opensAt + 250, 2)
    expect(players[0].speed).toBe(0)
    expect(room.deck.every(q => ['complete', 'missing-the'].includes(q.id))).toBe(true)
  })
  it('permits changing content in the lobby and removes the previous judgement mode', () => {
    const room = createRoom(nextStage, 0)
    prepareRace(room, room.host, stage, 1, 1)
    expect(room.run).toBe(2)
    expect(room.kind).toBeUndefined()
    expect(room.stageId).toBe(stage.id)
    expect(room.pool.map(q => q.id)).toEqual(stage.questions.map(q => q.id))
  })
  it('rejects preparation by students or during an active race without resetting progress', () => {
    const {room,players,start} = setup()
    const before = JSON.stringify(room)
    expect(() => prepareRace(room, players[0].token, nextStage, 1, start + 100)).toThrow('Only the host')
    expect(() => prepareRace(room, room.host, nextStage, 1, start + 100)).toThrow('Finish the current race')
    expect(JSON.stringify(room)).toBe(before)
  })
  it('rejects old-run answers, controls and repeated prepare requests even when round numbers match', () => {
    const room = createRoom(stage, 0)
    const player = joinRoom(room, 'Rider', token())
    prepareRace(room, room.host, nextStage, 1, 100)
    command(room, room.host, 'start', -1, 200, 2)
    const before = JSON.stringify(room)
    expect(() => answer(room, player.token, 0, room.deck[0].correct, room.opensAt + 1000, 1)).toThrow('This race has changed')
    expect(() => command(room, room.host, 'finish', 0, room.opensAt + 1000, 1)).toThrow('This race has changed')
    expect(() => prepareRace(room, room.host, stage, 1, room.opensAt + 1000)).toThrow('This race has changed')
    expect(JSON.stringify(room)).toBe(before)
  })
  it('defaults old rooms to run one and exposes selected question IDs only to the host', () => {
    const room = createRoom(stage, 0)
    const player = joinRoom(room, 'Rider', token())
    delete room.run
    expect(viewRoom(room, room.host, 0)).toMatchObject({ run: 1, stageId: stage.id, questionIds: stage.questions.map(q => q.id) })
    expect(viewRoom(room, player.token, 0).questionIds).toBeUndefined()
    expect(viewRoom(room, '', 0).questionIds).toBeUndefined()
    prepareRace(room, room.host, nextStage, 1, 100)
    expect(room.run).toBe(2)
  })
  it('validates selection membership, uniqueness and both meanings before changing content', () => {
    expect(selectQuestions(nextStage).questions).toHaveLength(3)
    expect(selectQuestions(nextStage, ['missing-the', 'complete']).questions.map(q => q.id)).toEqual(['complete', 'missing-the'])
    for (const ids of [[], ['complete'], ['missing-is', 'missing-the'], ['complete', 'complete'], ['complete', 'other-section'], 'complete', [1, 2]]) {
      expect(() => selectQuestions(nextStage, ids)).toThrow()
    }
    expect(() => selectQuestions(stage, [stage.questions[0].id])).toThrow()
    const room = createRoom(stage, 0), before = JSON.stringify(room)
    expect(() => prepareRace(room, room.host, { ...nextStage, questions: [nextStage.questions[0]] }, 1, 100)).toThrow()
    expect(JSON.stringify(room)).toBe(before)
  })
})

it('finishes ten fast accurate players in about 55 seconds without exceeding 40 km/h',()=>{
  const {room,players}=setup(10)
  while(room.phase!=='finished') {
    const at=room.opensAt+3000
    advanceRace(room,at)
    if(room.phase==='finished') break
    const round=room.round, correct=room.deck[round].correct
    players.forEach(p=>answer(room,p.token,round,correct,at))
    players.forEach(p=>expect(p.targetSpeed!*3.6).toBeLessThanOrEqual(40))
  }
  expect((room.updatedAt-1000)/1000).toBeGreaterThan(54)
  expect((room.updatedAt-1000)/1000).toBeLessThan(56)
  expect(players.every(p=>p.metres===FINISH)).toBe(true)
})
