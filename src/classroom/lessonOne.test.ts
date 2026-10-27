import { existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { holidayVocabulary } from '../race/holidayVocabulary'
import { firstWords, judgementPractice, meaningPractice, wordChoices } from './lessonOne'

describe('Classroom Lesson 1', () => {
  it('retains the lesson vocabulary without adding later ownership or plural frames', () => {
    expect(new Set(wordChoices.map(item => item.word))).toEqual(new Set(holidayVocabulary.map(item => item.word)))
    expect(wordChoices).toHaveLength(20)
    expect(wordChoices.slice(0, 3).map(item => item.word)).toEqual(firstWords)
  })
  it('uses every familiar noun in all three forms, so nouns cannot give away grammar answers', () => {
    for (const word of firstWords) {
      const questions = judgementPractice.filter(item => item.word === word)
      expect(questions.map(item => item.english)).toEqual(expect.arrayContaining([`Where is the ${word}?`, `Where the ${word}?`, `Where is ${word}?`]))
      expect(questions.find(item => item.english === `Where is the ${word}?`)?.correct).toBe(0)
      expect(questions.filter(item => item.correct === 1)).toHaveLength(2)
    }
  })
  it('keeps the English frame fixed and tests both the noun and question meaning in Thai', () => {
    for (const word of firstWords) {
      const item = holidayVocabulary.find(item => item.word === word)!
      const questions = meaningPractice.filter(q => q.word === word)
      expect(questions).toHaveLength(2)
      expect(questions.every(q => q.english === `Where is the ${word}?`)).toBe(true)
      expect(questions.map(q => q.choices[1 - q.correct])).toContain(item.meaningDistractor)
      expect(questions.every(q => q.choices[q.correct] === `${item.thai}อยู่ที่ไหน`)).toBe(true)
      expect(new Set(questions.map(q => q.correct)).size).toBe(2)
    }
  })
  it('has real local audio for every practice question and every available example', () => {
    for (const question of [...judgementPractice, ...meaningPractice]) expect(existsSync(`public${question.audio}`), question.audio).toBe(true)
    for (const { word } of wordChoices) for (const variant of ['complete', 'missing-is', 'missing-the']) {
      const path = `public/audio/race-holiday/${word}-${variant}.wav`
      expect(existsSync(path), path).toBe(true)
    }
  })
})
