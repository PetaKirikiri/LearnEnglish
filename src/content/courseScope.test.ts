import { describe, expect, it } from 'vitest'
import { courseScope } from './courseScope'

describe('course scope and sequence', () => {
  it('contains all ten units in order with every curriculum field', () => {
    expect(courseScope.map(({ unit }) => unit)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])

    for (const unit of courseScope) {
      expect(unit.title).toBeTruthy()
      expect(unit.pages).toBeTruthy()
      expect(unit.vocabulary.length).toBeGreaterThan(0)
      expect(unit.grammar.length).toBeGreaterThan(0)
      expect(unit.listening).toBeTruthy()
      expect(unit.speaking).toBeTruthy()
      expect(unit.reading).toBeTruthy()
      expect(unit.writing).toBeTruthy()
      expect(unit.pronunciation).toBeTruthy()
      expect(unit.project).toBeTruthy()
    }
  })
})
