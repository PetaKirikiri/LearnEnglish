// @vitest-environment node
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { holidayMeaningQuestions, holidayNouns, holidayQuestions, holidayWordFor } from './holidayQuestions'
import { holidayVocabulary } from './holidayVocabulary'
import { racePools } from './pools'
import { advanceRace, command, createRoom, joinRoom, token, viewRoom } from '../../server/classroomRace'
import { demoQuestion } from './demoRace'

describe('Where is the holiday batch', () => {
  it('offers twenty unique holiday words, including ATM and airport without station', () => {
    expect(holidayNouns).toEqual(['taxi', 'hotel', 'toilet', 'restaurant', 'beach', 'airport', 'shop', 'ATM', 'bank', 'pharmacy', 'hospital', 'supermarket', 'market', 'cafe', 'bus stop', 'car park', 'entrance', 'exit', 'lift', 'swimming pool'])
    expect(new Set(holidayNouns).size).toBe(20)
    expect(holidayNouns).not.toContain('station')
    expect(holidayWordFor('race-meaning-station')).toBeUndefined()
    expect(holidayWordFor('race-where-station-complete')).toBeUndefined()
  })
  it('tests only the complete frame and its two omissions, for every noun', () => {
    expect(holidayQuestions).toHaveLength(60)
    for (const noun of holidayNouns) {
      const questions = holidayQuestions.filter(q => q.id.startsWith(`race-where-${noun}-`))
      expect(questions.map(q => [q.english, q.correct])).toEqual([
        [`Where is the ${noun}?`, 0], [`Where the ${noun}?`, 1], [`Where is ${noun}?`, 1],
      ])
      questions.forEach(q => expect(q.answers.map(a => a.map(t => t.text).join(''))).toEqual(['Correct', 'Wrong']))
    }
    expect(new Set(holidayQuestions.map(q => q.id)).size).toBe(60)
  })
  it('provides twenty distinct complete-frame Thai meanings and shares their matching recordings', () => {
    expect(holidayMeaningQuestions).toHaveLength(20)
    expect(new Set(holidayMeaningQuestions.map(q => q.id)).size).toBe(20)
    expect(new Set(holidayMeaningQuestions.map(q => q.answers[q.correct].map(part => part.text).join(''))).size).toBe(20)
    for (const noun of holidayNouns) {
      const meaning = holidayMeaningQuestions.find(q => holidayWordFor(q.id) === noun)!
      const complete = holidayQuestions.find(q => holidayWordFor(q.id) === noun && q.correct === 0)!
      expect(meaning.english).toBe(`Where is the ${noun}?`)
      expect(meaning.audioUrl).toBe(complete.audioUrl)
      expect(meaning.answers[meaning.correct].map(part => part.text).join('')).toMatch(/อยู่ที่ไหน$/)
      expect(meaning.answers.map(answer => answer.map(part => part.text).join(''))).toHaveLength(2)
    }
  })
  it('adds a distinct same-noun Thai curveball for every word without changing the English question or audio', () => {
    expect(new Set(holidayMeaningQuestions.map(q => q.meaningDistractor)).size).toBe(20)
    for (const { word, thai } of holidayVocabulary) {
      const question = holidayMeaningQuestions.find(q => holidayWordFor(q.id) === word)!
      const correct = question.answers[question.correct].map(part => part.text).join('')
      expect(question.meaningDistractor?.trim()).toBeTruthy()
      expect(question.meaningDistractor).toMatch(/[ก-๙]/)
      expect(question.meaningDistractor).toContain(thai)
      expect(question.meaningDistractor).not.toContain('อยู่ที่ไหน')
      expect(question.meaningDistractor).not.toBe(correct)
      expect(question.english).toBe(`Where is the ${word}?`)
      expect(question.audioUrl).toBe(`/audio/race-holiday/${word}-complete.wav`)
      expect(correct).toBe(`${thai}อยู่ที่ไหน`)
    }
  })
  it.each([
    ['ATM', 'ตู้เอทีเอ็มอยู่ที่ไหน'],
    ['bus stop', 'ป้ายรถเมล์อยู่ที่ไหน'],
    ['car park', 'ที่จอดรถอยู่ที่ไหน'],
    ['swimming pool', 'สระว่ายน้ำอยู่ที่ไหน'],
  ])('keeps %s together in the English frame and its Thai meaning', (word, thai) => {
    const questions = holidayQuestions.filter(q => holidayWordFor(q.id) === word)
    expect(questions.map(q => q.english)).toEqual([`Where is the ${word}?`, `Where the ${word}?`, `Where is ${word}?`])
    const meaning = holidayMeaningQuestions.find(q => holidayWordFor(q.id) === word)!
    expect(meaning.answers[meaning.correct].map(part => part.text).join('')).toBe(thai)
  })
  it('uses exact recordings for the malformed sentences, without correcting them', () => {
    const manifest = JSON.parse(readFileSync('public/audio/race-holiday/voice-manifest.json', 'utf8'))
    holidayQuestions.forEach(q => {
      const name = q.audioUrl!.split('/').pop()!
      expect(manifest[name].text).toBe(q.english)
      expect(manifest[name].seconds).toBeGreaterThan(.5)
      expect(manifest[name].seconds).toBeLessThan(5)
      const bytes = readFileSync(`public${q.audioUrl}`)
      expect(bytes.subarray(0, 4).toString()).toBe('RIFF')
      expect(bytes.subarray(8, 12).toString()).toBe('WAVE')
      let byteRate = 0
      let data = Buffer.alloc(0)
      for (let offset = 12; offset + 8 <= bytes.length;) {
        const chunk = bytes.subarray(offset, offset + 4).toString()
        const length = bytes.readUInt32LE(offset + 4)
        const start = offset + 8
        expect(start + length).toBeLessThanOrEqual(bytes.length)
        if (chunk === 'fmt ') {
          expect(bytes.readUInt16LE(start)).toBe(1)
          expect(bytes.readUInt16LE(start + 14)).toBe(16)
          byteRate = bytes.readUInt32LE(start + 8)
        }
        if (chunk === 'data') data = bytes.subarray(start, start + length)
        offset = start + length + length % 2
      }
      expect(byteRate).toBeGreaterThan(0)
      expect(data.length).toBeGreaterThan(0)
      expect(data.length / byteRate).toBeCloseTo(manifest[name].seconds, 2)
      let peak = 0
      for (let offset = 0; offset + 2 <= data.length; offset += 2) peak = Math.max(peak, Math.abs(data.readInt16LE(offset)))
      expect(peak, `${name} must contain audible samples`).toBeGreaterThan(0)
    })
  })
  it('keeps judgement buttons fixed, hides answers on phones, and accepts the full bank', () => {
    const pool = racePools.find(p => p.id === 'where-is-the')!
    const room = createRoom({ ...pool, questions: pool.questions.map(q => ({ id: q.id, english: q.english, audioUrl: q.audioUrl!, correct: q.correct, choices: q.answers.map(a => a.map(t => t.text).join('')) })) }, 0)
    const participant = joinRoom(room, 'Test', token())
    command(room, room.host, 'start', -1, 0)
    advanceRace(room, 190000)
    room.deck.forEach(q => {
      expect(q.choices).toEqual(['Correct', 'Wrong'])
      expect(q.correct).toBe(q.english.startsWith('Where is the ') ? 0 : 1)
    })
    expect(viewRoom(room, participant.token).question?.correct).toBeUndefined()
    expect(viewRoom(room, participant.token).question?.english).toBeUndefined()
    expect(viewRoom(room, room.host).question?.audioUrl).toContain('/audio/race-holiday/')
  })
  it('balances complete and broken frames in the scripted demonstration', () => {
    const questions = Array.from({ length: 32 }, (_, round) => demoQuestion(round))
    expect(questions.filter(q => q.correct === 0)).toHaveLength(16)
    expect(questions.filter(q => q.correct === 1)).toHaveLength(16)
  })
})
