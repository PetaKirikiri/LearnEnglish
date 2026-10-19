// @vitest-environment happy-dom
import { afterEach, expect, it } from 'vitest'
import { loadWordFamiliarity, recordWordExposure, wordMemoryKey, wordOpacity, listeningWordOpacity, type WordFamiliarity } from './wordFamiliarity'
afterEach(() => localStorage.clear())
it('removes familiar Hotel words completely while preserving newer words and restores support after mistakes', () => {
  let memory:WordFamiliarity={}
  for(let i=0;i<8;i++) memory=recordWordExposure(memory,'The room.',true,false)
  memory=recordWordExposure(memory,'The room is ready.',true,false)
  expect(listeningWordOpacity(memory,'the')).toBe(0)
  expect(listeningWordOpacity(memory,'room')).toBe(0)
  expect(listeningWordOpacity(memory,'ready')).toBe(1)
  memory=recordWordExposure(memory,'The room is ready.',false,false)
  expect(listeningWordOpacity(memory,'room')).toBeGreaterThan(0)
  expect(wordOpacity({room:{seen:8,strength:8}},'room')).toBe(0.25)
})
it('keeps independent scores for A B C D followed by A C D, including after reload', () => {
  const first = recordWordExposure({}, 'A B C D.', true, false)
  expect(first).toEqual({ a: { seen: 1, strength: 1 }, b: { seen: 1, strength: 1 }, c: { seen: 1, strength: 1 }, d: { seen: 1, strength: 1 } })
  localStorage.setItem(wordMemoryKey('learner'), JSON.stringify(first))
  const second = recordWordExposure(loadWordFamiliarity('learner'), 'A C D.', true, false)
  expect(second).toEqual({ a: { seen: 2, strength: 2 }, b: { seen: 1, strength: 1 }, c: { seen: 2, strength: 2 }, d: { seen: 2, strength: 2 } })
  const third = recordWordExposure(second, 'A C D.', true, false)
  expect(wordOpacity(third, 'a')).toBeLessThan(wordOpacity(third, 'b'))
  expect(wordOpacity(third, 'c')).toBe(wordOpacity(third, 'a'))
  expect(wordOpacity(third, 'd')).toBe(wordOpacity(third, 'a'))
  expect(third.b).toEqual({ seen: 1, strength: 1 })
  expect(first.a.strength).toBe(1)
})
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
