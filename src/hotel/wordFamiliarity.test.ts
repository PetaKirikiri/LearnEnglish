// @vitest-environment happy-dom
import { afterEach, expect, it } from 'vitest'
import { loadWordFamiliarity, recordWordExposure, wordMemoryKey, wordOpacity, type WordFamiliarity } from './wordFamiliarity'
afterEach(() => localStorage.clear())
it('fades each word gradually with successful repeated encounters across sentences', () => {
  let memory: WordFamiliarity = {}
  expect(wordOpacity(memory, 'The')).toBe(1)
  for (let i = 0; i < 8; i++) memory = recordWordExposure(memory, 'The woman.', true, false)
  expect(wordOpacity(memory, 'THE')).toBe(0.25)
  expect(wordOpacity(memory, 'key')).toBe(1)
  memory = recordWordExposure(memory, 'The key.', true, false)
  expect(memory.the.seen).toBe(9)
  expect(wordOpacity(memory, 'key')).toBe(1)
})
it('does not mistake repeated text or assisted exposure for mastery and restores support after errors', () => {
  let memory: WordFamiliarity = {}
  for (let i = 0; i < 8; i++) memory = recordWordExposure(memory, 'The woman and the man.', true, true)
  expect(memory.the.seen).toBe(8)
  expect(wordOpacity(memory, 'the')).toBe(1)
  for (let i = 0; i < 8; i++) memory = recordWordExposure(memory, 'The woman.', true, false)
  memory = recordWordExposure(memory, 'The woman.', false, false)
  expect(wordOpacity(memory, 'the')).toBe(0.5)
})
it('persists by learner, loads older users with full support, and rejects corrupt values', () => {
  expect(loadWordFamiliarity('new')).toEqual({})
  localStorage.setItem(wordMemoryKey('one'), JSON.stringify({ the: { seen: 8, strength: 8 }, bad: { seen: -1, strength: 100 } }))
  expect(loadWordFamiliarity('one')).toEqual({ the: { seen: 8, strength: 8 } })
  expect(loadWordFamiliarity('two')).toEqual({})
})
