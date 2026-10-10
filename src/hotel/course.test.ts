import { describe, expect, it } from 'vitest'
import { hotelQuestions, nextQuestion, recordAnswer, skills, supportOpacity, type Progress } from './course'
describe('hotel listening course', () => {
  it('has two distinct answers, balanced targets and four contexts per focus', () => {
    expect(hotelQuestions).toHaveLength(32)
    expect(new Set(hotelQuestions.map(q => q.id)).size).toBe(32)
    for (const skill of skills) {
      const items = hotelQuestions.filter(q => q.skill === skill)
      expect(items).toHaveLength(4)
      expect(items.filter(q => q.correct === 0)).toHaveLength(2)
      for (const item of items) {
        expect(item.answers[0]).not.toEqual(item.answers[1])
        expect(item.answers[0].map(s => s.skill)).toEqual(item.answers[1].map(s => s.skill))
      }
    }
  })
  it('starts with two focuses and reviews completed ones', () => {
    expect(nextQuestion({}, undefined, 0).skill).toBe('people')
    expect(nextQuestion({}, undefined, 1).skill).toBe('things')
    let progress: Progress = {}
    for (const q of hotelQuestions.filter(q => ['people','things'].includes(q.skill))) progress = recordAnswer(progress, q, true, false)
    expect(nextQuestion(progress, undefined, 0).skill).toBe('person')
    expect(nextQuestion(progress, undefined, 1).skill).toBe('action')
    expect(['people','things']).toContain(nextQuestion(progress, undefined, 3).skill)
  })
  it('does not credit repeated or assisted guesses and restores support after error', () => {
    const q = hotelQuestions[0]
    let progress = recordAnswer({}, q, true, true)
    expect(supportOpacity(progress, q.skill)).toBe(1)
    progress = recordAnswer(progress, q, true, false)
    progress = recordAnswer(progress, q, true, false)
    expect(progress.people.seen).toHaveLength(1)
    expect(supportOpacity(progress, q.skill)).toBeLessThan(1)
    progress = recordAnswer(progress, q, false, false)
    expect(supportOpacity(progress, q.skill)).toBe(1)
  })
})
