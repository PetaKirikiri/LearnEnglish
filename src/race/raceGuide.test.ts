import { describe, expect, it } from 'vitest'
import { raceGuide, guideModes } from './raceGuide'
import { racePools } from './pools'

describe('race teaching walkthrough', () => {
  it.each(guideModes)('teaches actual questions from $id with aligned matrix meanings', ({ id }) => {
    const guide = raceGuide(id)!
    const pool = racePools.find(p => p.id === id)!
    expect(guide.questionCount).toBe(pool.questions.length)
    expect(guide.examples.length).toBeGreaterThan(1)
    for (const example of guide.examples) {
      const source = pool.questions.find(q => q.id === example.sourceId)!
      expect(source).toBeTruthy()
      expect(example.english).toBe(source.english)
      expect(example.units.map(u => u.english).join(' ')).toBe(source.english)
      expect(example.choices).toHaveLength(2)
      expect(example.choices[0]).not.toBe(example.choices[1])
      expect(example.choices[example.correct]).toBe(guide.judgement ? source.correct === 0 ? 'ถูกต้อง' : 'ไม่ถูกต้อง' : source.answers[source.correct].map(a => a.text).join(''))
    }
  })
  it('only demonstrates the teacher-selected questions and their valid distractors', () => {
    const selected = ['tonight-toilet-my', 'tonight-toilet-your']
    const guide = raceGuide('tonight-slots', selected)!
    expect(guide.questionCount).toBe(2)
    expect(guide.examples.every(e => selected.includes(e.sourceId))).toBe(true)
    expect(guide.examples.every(e => e.choices.every(c => c.includes('ห้องน้ำ')))).toBe(true)
    expect(guide.examples.every(e => e.choices.some(c => c.includes('ของฉัน')) && e.choices.some(c => c.includes('ของคุณ')))).toBe(true)
  })
  it('shows both complete and missing-word sentences in judgement mode', () => {
    const guide = raceGuide('where-is-the')!
    expect(guide.examples.map(e => e.correct)).toEqual([0, 1, 1])
    expect(guide.examples.map(e => e.units.length)).toEqual([4, 3, 3])
  })
  it('does not promise audio or plural questions in the current tonight pool', () => {
    const guide = raceGuide('tonight-slots')!
    expect(guide.hasAudio).toBe(false)
    expect(guide.examples.every(e => e.english.startsWith('Where is '))).toBe(true)
    expect(raceGuide('holiday-meaning')!.hasAudio).toBe(true)
  })
  it('does not substitute unrelated questions for empty or unsupported selections', () => {
    expect(raceGuide('tonight-slots', [])!.examples).toEqual([])
    expect(raceGuide('unknown')).toBeNull()
  })
})
