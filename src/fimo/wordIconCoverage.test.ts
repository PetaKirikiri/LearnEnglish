import { existsSync } from 'node:fs'
import { expect, it } from 'vitest'
import { padelQuestions } from '../padel/course'
import { wordIcons } from './wordIconCatalogue'
import { contextualIcons, iconForMeaning, wordMeaning } from './wordMeaning'

it('has an authored icon for every word occurrence in the entire Padel course', () => {
  const vocabulary = new Set<string>()
  for (const question of padelQuestions) {
    for (const match of question.english.matchAll(/[\p{L}]+(?:[’'][\p{L}]+)*/gu)) {
      const word = match[0]
      const before = question.english.slice(0, match.index)
      const after = question.english.slice(match.index + word.length)
      vocabulary.add(word.toLowerCase())
      const meaning = wordMeaning(word, after, before)
      expect(meaning, `${question.id}: ${word}`).toBeTruthy()
      const icon = iconForMeaning(meaning!)
      expect(icon?.asset || icon?.symbol, `${question.id}: ${word}`).toBeTruthy()
      expect(icon?.description.trim().length).toBeGreaterThan(0)
    }
  }
  expect(vocabulary.size).toBeGreaterThan(200)
  expect(vocabulary.has('net')).toBe(true)
  expect(vocabulary.has('instructor')).toBe(false)
  expect(vocabulary.has('pilates')).toBe(false)
})

it('ships every referenced artwork file, including composited secondary images', () => {
  for (const [word, icon] of Object.entries({ ...wordIcons, ...contextualIcons })) {
    for (const asset of [icon.asset, icon.secondary].filter(Boolean)) {
      expect(existsSync(`public/images/fimo/word-${asset}.png`), `${word}: ${asset}`).toBe(true)
      expect(existsSync(`public/images/fimo/thumbs/word-${asset}.png`), `${word} thumbnail: ${asset}`).toBe(true)
    }
  }
})
