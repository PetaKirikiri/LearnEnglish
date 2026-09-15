import { expect, it } from 'vitest'
import { availableQuestionPoints } from './helpPoints'

it('deducts two per distinct normalized word without going below zero', () => {
  expect(availableQuestionPoints([])).toBe(10)
  expect(availableQuestionPoints(['train'])).toBe(8)
  expect(availableQuestionPoints(['Train', ' train ', 'city'])).toBe(6)
  expect(availableQuestionPoints(["it's", 'it’s'])).toBe(8)
  expect(availableQuestionPoints(['a', 'b', 'c', 'd', 'e', 'f'])).toBe(0)
})
