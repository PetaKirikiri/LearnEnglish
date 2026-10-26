// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'
import { command, createRoom, joinRoom, selectQuestions, viewRoom, type RaceStage } from './classroomRace'

const random = vi.hoisted(() => ({ draws: [] as number[] }))
vi.mock('node:crypto', async importOriginal => {
  const actual = await importOriginal<typeof import('node:crypto')>()
  return {
    ...actual,
    randomInt: (maximum: number) => {
      const draw = random.draws.shift()
      if (draw === undefined || draw < 0 || draw >= maximum) throw new Error('Unexpected random draw in race test')
      return draw
    },
  }
})

const taxi = 'แท็กซี่อยู่ที่ไหน'
const hotel = 'โรงแรมอยู่ที่ไหน'
const toilet = 'ห้องน้ำอยู่ที่ไหน'
const stage: RaceStage = { id: 'holiday-meaning', title: 'Where is the…?', kind: 'meaning', questions: [
  { id: 'taxi', english: 'Where is the taxi?', audioUrl: '/audio/race-holiday/taxi-complete.wav', choices: [taxi, toilet], correct: 0, meaningDistractor: 'แท็กซี่ราคาเท่าไร' },
  { id: 'hotel', english: 'Where is the hotel?', audioUrl: '/audio/race-holiday/hotel-complete.wav', choices: [toilet, hotel], correct: 1, meaningDistractor: 'โรงแรมชื่ออะไร' },
  { id: 'toilet', english: 'Where is the toilet?', audioUrl: '/audio/race-holiday/toilet-complete.wav', choices: [toilet, taxi], correct: 0, meaningDistractor: 'ห้องน้ำเปิดเมื่อไร' },
] }

afterEach(() => expect(random.draws).toHaveLength(0))

describe('meaning race contrast draws', () => {
  it.each([
    { source: 0, curveball: 0, flip: 0 }, { source: 0, curveball: 0, flip: 1 },
    { source: 0, curveball: 1, flip: 0 }, { source: 0, curveball: 1, flip: 1 },
    { source: 1, curveball: 0, flip: 0 }, { source: 1, curveball: 0, flip: 1 },
    { source: 1, curveball: 1, flip: 0 }, { source: 1, curveball: 1, flip: 1 },
  ])('uses selected source $source, contrast $curveball and correct-side flip $flip independently', ({ source, curveball, flip }) => {
    const selected = selectQuestions(stage, ['taxi', 'hotel'])
    const room = createRoom(selected, 0)
    const player = joinRoom(room, 'Learner', 'a'.repeat(48))
    const originalPool = JSON.stringify(room.pool)
    random.draws = [source, curveball, flip]
    command(room, room.host, 'start', -1, 0)
    const question = room.deck[0]
    const authored = stage.questions[source]
    const expectedCorrect = authored.choices[authored.correct]
    const expectedWrong = curveball ? authored.meaningDistractor : source === 0 ? hotel : taxi
    expect(question.id).toBe(authored.id)
    expect(question.english).toBe(authored.english)
    expect(question.audioUrl).toBe(authored.audioUrl)
    expect(question.correct).toBe(flip ? 1 - authored.correct : authored.correct)
    expect(question.choices[question.correct]).toBe(expectedCorrect)
    expect(question.choices[1 - question.correct]).toBe(expectedWrong)
    expect(question.choices).not.toContain(toilet)
    expect(question.choices).not.toContain(stage.questions[2].meaningDistractor)
    expect(JSON.stringify(room.pool)).toBe(originalPool)
    const phone = viewRoom(room, player.token, room.opensAt)
    expect(phone.question?.choices).toEqual(question.choices)
    expect(phone.question).not.toHaveProperty('meaningDistractor')
    expect(phone.question?.correct).toBeUndefined()
    expect(phone.question?.english).toBeUndefined()
  })

  it('falls back to selected noun contrasts for existing rooms without curveball metadata', () => {
    const withoutMetadata: RaceStage = { ...stage, questions: stage.questions.map(question => ({
      id: question.id, english: question.english, audioUrl: question.audioUrl, correct: question.correct, choices: question.choices,
    })) }
    const room = createRoom(selectQuestions(withoutMetadata, ['taxi', 'hotel']), 0)
    joinRoom(room, 'Learner', 'b'.repeat(48))
    random.draws = [1, 1]
    command(room, room.host, 'start', -1, 0)
    expect(room.deck[0].choices.toSorted()).toEqual([taxi, hotel].toSorted())
    expect(room.deck[0].choices[room.deck[0].correct]).toBe(hotel)
  })

  it('keeps legacy fixed-choice races on their existing two meanings', () => {
    const room = createRoom({ ...stage, kind: undefined, questions: [
      { ...stage.questions[0], choices: [taxi, hotel] },
      { ...stage.questions[1], choices: [taxi, hotel] },
    ] }, 0)
    joinRoom(room, 'Learner', 'c'.repeat(48))
    random.draws = [0, 1]
    command(room, room.host, 'start', -1, 0)
    expect(room.deck[0].choices).toEqual([hotel, taxi])
    expect(room.deck[0].correct).toBe(1)
  })

  it('keeps judgement choices fixed and never uses meaning curveballs', () => {
    const room = createRoom({ ...stage, kind: 'judgement', questions: [
      { ...stage.questions[0], choices: ['Correct', 'Wrong'], correct: 0 },
      { ...stage.questions[1], choices: ['Correct', 'Wrong'], correct: 1 },
    ] }, 0)
    joinRoom(room, 'Learner', 'd'.repeat(48))
    random.draws = [1, 0]
    command(room, room.host, 'start', -1, 0)
    expect(room.deck[0].choices).toEqual(['Correct', 'Wrong'])
    expect(room.deck[0].correct).toBe(1)
  })
})
