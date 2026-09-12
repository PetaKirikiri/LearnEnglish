import { describe, expect, it } from 'vitest'
import { readings } from '../content/readings'
import { parseWords } from '../lib/wordData'
import { createQuizRound } from './quizContent'

const storyText = readings.map(({ title, paragraphs }) => [title, ...paragraphs].join(' ')).join(' ')
const storyWords = new Set(parseWords(storyText))

describe('story-powered quiz content', () => {
  it('builds a full vocabulary round from words in the supplied stories', () => {
    const questions = createQuizRound('vocabulary')

    expect(questions).toHaveLength(10)
    for (const question of questions) {
      const englishValues = [question.prompt, question.answer, ...question.choices]
      expect(englishValues.some((value) => storyWords.has(value.toLocaleLowerCase('en')))).toBe(true)
      expect(question.choices).toContain(question.answer)
      expect(readings.some(({ title }) => title === question.sourceTitle)).toBe(true)
    }
  })

  it('builds sentence questions from exact story sentences', () => {
    const questions = createQuizRound('sentences')

    expect(questions).toHaveLength(10)
    for (const question of questions) {
      expect(storyText).toContain(question.example)
      expect(question.prompt).toContain('_____')
      expect(question.choices).toContain(question.answer)
      expect(question.example.toLocaleLowerCase('en')).toContain(question.answer)
    }
  })

  it('changes the practice set on a new round', () => {
    expect(createQuizRound('vocabulary', 0).map(({ id }) => id))
      .not.toEqual(createQuizRound('vocabulary', 1).map(({ id }) => id))
  })
})
