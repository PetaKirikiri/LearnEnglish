import { describe, expect, it } from 'vitest'
import { readings } from '../content/readings'
import { parseWords } from '../lib/wordData'
import { createQuizRound, getQuizCatalogue } from './quizContent'
import { grammarLessons } from './grammarLessons'
import { existsSync } from 'node:fs'

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
      expect(question.example.toLocaleLowerCase('en')).toContain(question.answer.toLowerCase())
    }
  })

  it('changes the practice set on a new round', () => {
    expect(createQuizRound('vocabulary', 0).map(({ id }) => id))
      .not.toEqual(createQuizRound('vocabulary', 1).map(({ id }) => id))
  })

  it('gives every vocabulary word a short context and its matching audio', () => {
    for (const q of getQuizCatalogue().vocabulary) {
      expect(q.contextSentence).toBeTruthy()
      expect(parseWords(q.contextSentence!)).toContain(q.spokenText)
      expect(parseWords(q.contextSentence!).length).toBeLessThanOrEqual(9)
      expect(existsSync(`public${q.contextAudioUrl}`)).toBe(true)
    }
  })

  it('only serves authored grammar contrasts with meaning, feedback, and existing audio', () => {
    const questions = getQuizCatalogue().sentences
    expect(questions).toHaveLength(grammarLessons.length)
    expect(new Set(questions.map(q => q.id)).size).toBe(questions.length)
    for (const question of questions) {
      expect(question.id).toMatch(/^grammar-v1-/)
      expect(question.prompt.replace('_____', question.answer)).toBe(question.example)
      expect(new Set(question.choices).size).toBe(question.choices.length)
      expect(question.grammarFocus).toBeTruthy()
      expect(question.thaiPrompt).toMatch(/[\u0e00-\u0e7f]/)
      expect(question.explanationThai).toMatch(/[\u0e00-\u0e7f]/)
      expect(question.explanation).toBeTruthy()
      expect(existsSync(`public${question.audioUrl}`)).toBe(true)
      expect(['father', 'mother', 'sister', 'brother', 'cold', 'train', 'house']).not.toContain(question.answer)
    }
  })

  it('tests my versus me or I, not who the narrator visited', () => {
    const questions = getQuizCatalogue().sentences.filter(q => q.example === 'This week, I went to Colorado to visit my sister.')
    expect(questions).toHaveLength(1)
    expect(questions[0].prompt).toBe('This week, I went to Colorado to visit _____ sister.')
    expect([...questions[0].choices].sort()).toEqual(['I', 'me', 'my'])
  })

  it('does not revive retired story-recall questions from review memory', () => {
    expect(createQuizRound('sentences', 0, ['sentence-story-9-0-sister']).every(q => q.id.startsWith('grammar-v1-'))).toBe(true)
  })
})
