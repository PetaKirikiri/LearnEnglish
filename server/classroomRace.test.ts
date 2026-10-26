// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { advanceRace, answer, command, createRoom, FINISH, joinRoom, prepareRace, selectQuestions, speedFor, token, viewRoom, WINDOW_MS } from './classroomRace'
import type { RaceStage } from './classroomRace'
import { racePools } from '../src/race/pools'
import { CORRECT_MIN_SPEED, GOLDEN_MIN_SPEED, GOLDEN_SPEED, MAX_SPEED, MIN_SPEED } from '../src/race/rules'
const stage = { ...racePools[0], questions: racePools[0].questions.map(q => ({ id: q.id, english: q.english, audioUrl: q.audioUrl!, choices: q.answers.map(a => a.map(t => t.text).join('')), correct: q.correct })) }
function setup(count = 1) {
  const room = createRoom(stage, 100)
  const players = Array.from({length:count}, (_, i) => joinRoom(room, `Rider ${i}`, token()))
  command(room, room.host, 'start', -1, 1000)
  return {room, players, start:room.opensAt}
}
describe('continuous classroom race', () => {
  it('uses ten-second windows and bounded speed, not distance bonuses', () => {
    expect(WINDOW_MS).toBe(10000); expect(FINISH).toBe(1600)
    expect(speedFor(true, 0)).toBe(16); expect(speedFor(true, 5000)).toBe(12)
    expect(speedFor(true, 10000)).toBe(8); expect(speedFor(false, 0)).toBe(4)
  })
  it('starts once with a single countdown; nobody moves before the start', () => {
    const {room, players, start} = setup()
    advanceRace(room, start - 1); expect(players[0].metres).toBe(0)
    expect(() => command(room, room.host, 'start', 0, start)).toThrow()
    expect(() => answer(room, players[0].token, 0, 0, start - 1)).toThrow()
    expect(viewRoom(room, room.host).question?.english).toBe(room.deck[0].english)
  })
  it('changes speed immediately without jumping distance, then integrates distance continuously', () => {
    const {room,players,start} = setup()
    answer(room, players[0].token, 0, room.deck[0].correct, start+1000)
    expect(players[0].metres).toBe(4); expect(players[0].speed).toBeCloseTo(15.2)
    advanceRace(room,start+2000); expect(players[0].metres).toBeCloseTo(19.2)
    advanceRace(room,start+3000); expect(players[0].metres).toBeCloseTo(34.4)
  })
  it.each([
    { streak: 0, minimum: CORRECT_MIN_SPEED },
    { streak: 2, minimum: GOLDEN_MIN_SPEED },
  ])('accepts a correct answer at exactly ten seconds with prior streak $streak', ({ streak, minimum }) => {
    const {room,players,start} = setup()
    players[0].streak = streak
    advanceRace(room, start + WINDOW_MS)
    expect(room.round).toBe(0)
    answer(room, players[0].token, 0, room.deck[0].correct, start + WINDOW_MS)
    expect(players[0].speed).toBe(minimum)
    expect(players[0].streak).toBe(streak + 1)
    expect(room.answers[players[0].id].at).toBe(start + WINDOW_MS)
    advanceRace(room, start + WINDOW_MS + .125)
    expect(room.round).toBe(1)
    expect(players[0].speed).toBe(minimum)
    expect(players[0].metres).toBeCloseTo(MIN_SPEED * 10 + minimum * .000125, 8)
  })
  it('rejects an answer even a fraction of a millisecond beyond its deadline', () => {
    const {room,players,start} = setup()
    const correct = room.deck[0].correct
    expect(() => answer(room, players[0].token, 0, correct, start + WINDOW_MS + .125)).toThrow('That question has finished.')
    expect(room.round).toBe(1)
    expect(room.answers[players[0].id]).toBeUndefined()
    expect(players[0].speed).toBe(MIN_SPEED)
  })
  it.each([
    { streak: 0, maximum: MAX_SPEED, minimum: CORRECT_MIN_SPEED },
    { streak: 2, maximum: GOLDEN_SPEED, minimum: GOLDEN_MIN_SPEED },
  ])('preserves fractional-millisecond response timing with prior streak $streak', ({ streak, maximum, minimum }) => {
    const {room,players,start} = setup()
    const responseMs = 1234.125
    const expectedSpeed = maximum - (maximum - minimum) * responseMs / WINDOW_MS
    players[0].streak = streak
    answer(room, players[0].token, 0, room.deck[0].correct, start + responseMs)
    expect(room.answers[players[0].id].at).toBe(start + responseMs)
    expect(players[0].speed).toBeCloseTo(expectedSpeed, 10)
    expect(players[0].speed).not.toBe(speedFor(true, Math.round(responseMs), streak + 1))
    expect(players[0].metres).toBeCloseTo(MIN_SPEED * responseMs / 1000, 10)
    advanceRace(room, start + responseMs + 1000)
    expect(players[0].metres).toBeCloseTo(MIN_SPEED * responseMs / 1000 + expectedSpeed, 10)
  })
  it('does not end the time window early when everyone answers', () => {
    const {room,players,start} = setup(2)
    for (const p of players) answer(room,p.token,0,room.deck[0].correct,start+100)
    expect(room.phase).toBe('answering'); expect(room.round).toBe(0)
    advanceRace(room,start+9999); expect(room.round).toBe(0)
    advanceRace(room,start+10000); expect(room.round).toBe(0)
    expect(Object.keys(room.answers)).toHaveLength(2)
    advanceRace(room,start+10000.125); expect(room.round).toBe(1)
    expect(room.opensAt).toBe(start+10000); expect(room.closesAt).toBe(start+20000)
    expect(room.answers).toEqual({})
  })
  it('keeps unequal distances across boundaries, never snapping to a checkpoint', () => {
    const {room,players,start} = setup(2)
    answer(room,players[0].token,0,room.deck[0].correct,start)
    answer(room,players[1].token,0,1-room.deck[0].correct,start)
    advanceRace(room,start+5000)
    expect(players.map(p=>p.metres)).toEqual([80,20])
    advanceRace(room,start+7500)
    expect(players.map(p=>p.metres)).toEqual([120,30])
  })
  it('slows a wrong answer immediately and a missing answer at its deadline', () => {
    const {room,players,start} = setup()
    answer(room,players[0].token,0,room.deck[0].correct,start)
    advanceRace(room,start+10000.125)
    answer(room,players[0].token,1,1-room.deck[1].correct,start+10500)
    expect(players[0].speed).toBe(4); expect(players[0].metres).toBeCloseTo(168, 8)
    advanceRace(room,start+20000.125)
    answer(room,players[0].token,2,room.deck[2].correct,start+20000.125)
    advanceRace(room,start+40000.125)
    expect(players[0].speed).toBe(4); expect(room.round).toBe(4)
  })
  it('locks first tap, rejects stale/outside/invalid inputs and keeps authoritative timing', () => {
    const {room,players,start} = setup()
    expect(() => answer(room,'outsider',0,0,start)).toThrow()
    expect(() => answer(room,players[0].token,0,2,start)).toThrow()
    answer(room,players[0].token,0,1-room.deck[0].correct,start+10)
    answer(room,players[0].token,0,room.deck[0].correct,start+20)
    expect(players[0].speed).toBe(4)
    expect(() => answer(room,players[0].token,0,0,start+10000.125)).toThrow()
    expect(room.round).toBe(1)
    expect(() => command(room,players[0].token,'finish',1,start+10000.125)).toThrow()
  })
  it('perfect play crosses at the integrated boosted time without a next/reveal action', () => {
    const {room,players,start} = setup()
    const responseMs = .25
    const normalSpeed = MAX_SPEED - (MAX_SPEED - CORRECT_MIN_SPEED) * responseMs / WINDOW_MS
    const goldenSpeed = GOLDEN_SPEED - (GOLDEN_SPEED - GOLDEN_MIN_SPEED) * responseMs / WINDOW_MS
    const warmup = 2 * WINDOW_MS
    const distanceBeforeGolden = MIN_SPEED * responseMs / 1000 + normalSpeed * warmup / 1000
    const finishMs = warmup + responseMs + (FINISH - distanceBeforeGolden) / goldenSpeed * 1000
    for(let i=0;i<=Math.floor(finishMs / WINDOW_MS);i++) {
      const at = start + i * WINDOW_MS + responseMs
      advanceRace(room,at)
      answer(room,players[0].token,i,room.deck[i].correct,at)
    }
    advanceRace(room,start+finishMs-1); expect(room.phase).toBe('answering')
    advanceRace(room,start+finishMs+1); expect(room.phase).toBe('finished'); expect(players[0].metres).toBe(FINISH)
    expect(room.updatedAt).toBeCloseTo(start + finishMs, 6)
  })
  it('continues beyond 20 questions for slower players; no fixed deck limit', () => {
    const {room,players,start} = setup()
    advanceRace(room,start+200000.125)
    expect(room.phase).toBe('answering'); expect(room.round).toBe(20); expect(players[0].metres).toBeCloseTo(800.0005, 8)
    advanceRace(room,start+400000)
    expect(room.phase).toBe('finished'); expect(players[0].metres).toBe(FINISH)
  })
  it('stops all horses at the first crossing, even halfway through a question', () => {
    const {room,players,start} = setup(2)
    players[0].metres=1590; players[0].speed=16; players[1].metres=1000
    advanceRace(room,start+3000)
    expect(room.phase).toBe('finished'); expect(room.updatedAt).toBe(start+625)
    expect(players[0].metres).toBe(1600); expect(players[1].metres).toBe(1002.5)
    advanceRace(room,start+30000); expect(players[1].metres).toBe(1002.5)
  })
  it('catch-up/restart and frequent polls integrate to the same result', () => {
    const {room,start} = setup(); const restored = JSON.parse(JSON.stringify(room))
    for(let t=start+100;t<=start+12000;t+=100) advanceRace(room,t)
    advanceRace(restored,start+12000)
    expect(room.players[0].metres).toBeCloseTo(restored.players[0].metres,8)
    expect(room.round).toBe(restored.round); expect(room.opensAt).toBe(restored.opensAt)
  })
  it('rejoins without losing speed or distance and enforces 10 unique players', () => {
    const room = createRoom(stage); const key = token(); const player=joinRoom(room,'Peta',key)
    expect(() => joinRoom(room,'peta',token())).toThrow()
    for(let i=1;i<10;i++) joinRoom(room,`P${i}`,token())
    expect(() => joinRoom(room,'Eleven',token())).toThrow()
    command(room,room.host,'start',-1,1000)
    answer(room,key,0,room.deck[0].correct,3500); advanceRace(room,4000)
    expect(joinRoom(room,'Peta',key)).toBe(player); expect(player.speed).toBe(16); expect(player.metres).toBe(8)
    expect(() => joinRoom(room,'Late',token())).toThrow()
  })
  it('does not send phones the English prompt, correct side, audio path or secrets', () => {
    const {room,players,start}=setup(); const view=viewRoom(room,players[0].token,start)
    expect(view.question?.english).toBeUndefined(); expect(view.question?.correct).toBeUndefined(); expect(view.question?.audioUrl).toBeUndefined()
    expect(JSON.stringify(view)).not.toContain(room.host); expect(JSON.stringify(view)).not.toContain(players[0].token)
  })
  it('keeps every race inside its selected pool with binary answers', () => {
    for(const pool of racePools) {
      if (pool.kind) expect(pool.questions.length).toBeGreaterThanOrEqual(2)
      else expect(pool.questions).toHaveLength(2)
      const choices=pool.questions.map(q=>q.answers.map(a=>a.map(t=>t.text).join('')).sort())
      choices.forEach(pair => expect(pair).toHaveLength(2))
      if (pool.kind !== 'meaning') expect(choices[0]).toEqual(choices[1])
    }
    expect(stage.questions.map(q=>q.english)).toEqual(['A man','A woman'])
    const {room,start}=setup(); advanceRace(room,start+150000)
    for(const q of room.deck) {
      const source=stage.questions.find(s=>s.id===q.id)!
      expect(source).toBeDefined(); expect(q.choices[q.correct]).toBe(source.choices[source.correct])
    }
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
    room.players.forEach(player => expect(player).toMatchObject({ metres: 0, speed: MIN_SPEED, streak: 0 }))
    expect(joinRoom(room, players[0].name, players[0].token)).toBe(players[0])
    command(room, room.host, 'start', -1, start + 4000, 2)
    expect(room.round).toBe(0)
    answer(room, players[0].token, 0, room.deck[0].correct, room.opensAt + 250, 2)
    expect(players[0].speed).toBeCloseTo(15.8)
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
