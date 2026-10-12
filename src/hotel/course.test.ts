import { describe, expect, it } from 'vitest'
import { hotelQuestions, isSkillComplete, nextQuestion, recordAnswer, skills, supportOpacity, type Progress } from './course'
describe('hotel listening course', () => {
  it('has 192 real questions, balanced answers and sixteen contexts per focus', () => {
    expect(hotelQuestions).toHaveLength(192)
    expect(new Set(hotelQuestions.map(q => q.id)).size).toBe(192)
    expect(skills).toHaveLength(12)
    for (const skill of skills) {
      const items = hotelQuestions.filter(q => q.skill === skill)
      expect(items).toHaveLength(16)
      expect(items.filter(q => q.correct === 0)).toHaveLength(8)
      expect(new Set(items.map(q => q.english)).size).toBe(16)
      for (const item of items) {
        expect(item.answers[0]).not.toEqual(item.answers[1])
        expect(item.answers[0].map(s => s.skill)).toEqual(item.answers[1].map(s => s.skill))
      }
    }
  })
  it('preserves old question IDs and does not treat the starter four as a completed topic', () => {
    expect(hotelQuestions.find(q => q.id === 'hotel-1')?.english).toBe('The woman.')
    expect(hotelQuestions.find(q => q.id === 'hotel-32')?.english).toBe('I am cleaning the room now.')
    let progress: Progress = {}
    for (const q of hotelQuestions.filter(q => Number(q.id.slice(6)) <= 32)) progress = recordAnswer(progress, q, true, false)
    expect(progress.people.seen).toHaveLength(4)
    expect(isSkillComplete(progress, 'people')).toBe(false)
    const next = nextQuestion(progress, undefined, 0, () => 0)
    expect(next.skill).toBe('people')
    expect(Number(next.id.slice(6))).toBeGreaterThan(32)
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
  it('reaches every question, keeps all completed topics in review, and never ends', () => {
    let progress: Progress = {}
    let previous: string | undefined
    const encountered = new Set<string>()
    for (let round = 0; round < 400; round++) {
      const q = nextQuestion(progress, previous, round, () => 0)
      expect(q).toBeDefined()
      expect(q.id).not.toBe(previous)
      encountered.add(q.id)
      progress = recordAnswer(progress, q, true, false)
      previous = q.id
    }
    expect(encountered.size).toBe(hotelQuestions.length)
    expect(skills.every(skill => isSkillComplete(progress, skill))).toBe(true)
    const reviewed = Array.from({ length: skills.length }, (_, round) => nextQuestion(progress, undefined, round).skill)
    expect(new Set(reviewed).size).toBe(skills.length)
  })
  it('rotates through every earlier topic while keeping two later focuses active', () => {
    let progress: Progress = {}
    for (const q of hotelQuestions.filter(q => skills.slice(0, 4).includes(q.skill))) progress = recordAnswer(progress, q, true, false)
    const reviews = [3, 7, 11, 15].map(round => nextQuestion(progress, undefined, round).skill)
    expect(reviews).toEqual(skills.slice(0, 4))
    const focuses = [0, 1, 2, 4, 5, 6].map(round => nextQuestion(progress, undefined, round).skill)
    expect(focuses).toEqual(['place', 'quantity', 'place', 'quantity', 'place', 'quantity'])
  })
})
