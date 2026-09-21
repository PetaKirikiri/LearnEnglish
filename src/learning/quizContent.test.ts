import { describe, expect, it } from 'vitest'
import { readings } from '../content/readings'
import { parseWords } from '../lib/wordData'
import { createQuizRound, createGeneralPracticeRound as createPracticeRound, getQuizCatalogue, getLessonAudioItems } from './quizContent'
import { grammarLessons } from './grammarLessons'
import { grammarExpansion } from './grammarExpansion'
import { existsSync, readFileSync } from 'node:fs'

const storyText = readings.map(({ title, paragraphs }) => [title, ...paragraphs].join(' ')).join(' ')
const storyWords = new Set(parseWords(storyText))

describe('story-powered quiz content', () => {
  it('gives every grammar target at least five distinct, individually tracked questions', () => {
    const questions = getQuizCatalogue().sentences.filter(q => !q.examCategory)
    const targets = ['a','and','are','at','because','before','but','by','do','does','for','from','her','in','is','its','me','my','of','our','the','them','these','they','this','to','us','was','we','will','with','your']
    expect([...new Set(questions.map(q => q.answer.toLowerCase()))].sort()).toEqual(targets)
    for (const word of targets) {
      const examples = questions.filter(q => q.answer.toLowerCase() === word)
      expect(examples.length, word).toBeGreaterThanOrEqual(5)
      expect(new Set(examples.map(q => q.example.toLowerCase())).size, word).toBe(examples.length)
      for (const q of examples) expect(createQuizRound('sentences', 0, [q.id])[0].id).toBe(q.id)
    }
  })
  it('does not use meaning-only contrasts as grammar distractors', () => {
    for (const q of getQuizCatalogue().sentences.filter(q => !q.examCategory)) {
      const choices = q.choices.map(c => c.toLowerCase())
      if (q.answer.toLowerCase() === 'before') expect(choices).not.toContain('after')
      if (q.answer.toLowerCase() === 'because') expect(choices).not.toContain('although')
      if (q.answer.toLowerCase() === 'but') expect(choices).not.toContain('because')
      if (q.answer.toLowerCase() === 'and') expect(q.prompt.toLowerCase()).toContain('both')
    }
  })
  it('teaches the in ten distinct story sentences with separate review IDs and audio', () => {
    const questions = getQuizCatalogue().sentences.filter(q => !q.examCategory).filter(q => q.answer.toLowerCase() === 'the')
    expect(questions).toHaveLength(10)
    expect(new Set(questions.map(q => q.example)).size).toBe(10)
    expect(new Set(questions.map(q => q.id)).size).toBe(10)
    expect(new Set(questions.map(q => q.sourceTitle)).size).toBe(8)
    for (const q of questions) {
      expect(createQuizRound('sentences', 0, [q.id])[0].id).toBe(q.id)
      expect(existsSync(`public${q.gapAudioUrl}`)).toBe(true)
    }
  })
  it('excludes the ambiguous cloudy/rainy conjunction question, including from review', () => {
    const retired = 'grammar-v1-climate-around-the-world-17-and'
    expect(getQuizCatalogue().sentences.filter(q => !q.examCategory).some(q => q.id === retired)).toBe(false)
    for (let round = 0; round < 12; round++) {
      expect(createQuizRound('sentences', round, [retired]).some(q => q.id === retired)).toBe(false)
    }
    expect(storyText).toContain('It is very cloudy and rainy here, although it is not snowy.')
  })
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

  it('distinguishes exact story sentences from labelled story-based practice', () => {
    const questions = getQuizCatalogue().sentences.filter(q => !q.examCategory)
    for (const question of questions) {
      if (question.sourceKind === 'story') {
        expect(storyText).toContain(question.example)
      } else {
        expect(question.sourceKind).toBe('practice')
        expect(question.sourceTitle).toMatch(/^Practice · /)
        expect(readings.some(r => r.id === question.sourceReadingId)).toBe(true)
      }
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
    for (const q of getQuizCatalogue().vocabulary.filter(q => !q.examCategory)) {
      expect(q.contextSentence).toBeTruthy()
      expect(parseWords(q.contextSentence!)).toContain(q.spokenText)
      expect(parseWords(q.contextSentence!).length).toBeLessThanOrEqual(9)
      expect(existsSync(`public${q.contextAudioUrl}`)).toBe(true)
      const wav = readFileSync(`public${q.contextAudioUrl}`)
      let samples: Buffer | undefined
      for (let offset = 12; offset + 8 <= wav.length;) {
        const size = wav.readUInt32LE(offset + 4)
        if (wav.toString('ascii', offset, offset + 4) === 'data') {
          samples = wav.subarray(offset + 8, offset + 8 + size)
          break
        }
        offset += 8 + size + size % 2
      }
      // A valid header or a successful play() promise can still be silent.
      expect(samples?.length, q.contextAudioUrl).toBeGreaterThan(22050)
      expect(samples?.some(byte => byte !== 0), q.contextAudioUrl).toBe(true)
    }
  })

  it('only serves authored grammar contrasts with meaning, feedback, and existing audio', () => {
    const questions = getQuizCatalogue().sentences.filter(q => !q.examCategory)
    expect(questions).toHaveLength(grammarLessons.length + grammarExpansion.length)
    expect(new Set(questions.map(q => q.id)).size).toBe(questions.length)
    for (const question of questions) {
      expect(question.id).toMatch(/^grammar-(v1|practice-v1)-/)
      expect(question.prompt.replace('_____', question.answer)).toBe(question.example)
      expect(new Set(question.choices).size).toBe(question.choices.length)
      expect(question.grammarFocus).toBeTruthy()
      expect(question.thaiPrompt).toMatch(/[\u0e00-\u0e7f]/)
      expect(question.explanationThai).toMatch(/[\u0e00-\u0e7f]/)
      expect(question.explanation).toBeTruthy()
      expect(existsSync(`public${question.audioUrl}`)).toBe(true)
      expect(existsSync(`public${question.gapAudioUrl}`)).toBe(true)
      for (const url of [question.audioUrl, question.gapAudioUrl]) {
        const wav = readFileSync(`public${url}`)
        let samples: Buffer | undefined
        for (let offset = 12; offset + 8 <= wav.length;) {
          const size = wav.readUInt32LE(offset + 4)
          if (wav.toString('ascii', offset, offset + 4) === 'data') {
            samples = wav.subarray(offset + 8, offset + 8 + size)
            break
          }
          offset += 8 + size + size % 2
        }
        expect(samples?.length, url).toBeGreaterThan(22050)
        expect(samples?.some(byte => byte !== 0), url).toBe(true)
      }
      expect(['father', 'mother', 'sister', 'brother', 'cold', 'train', 'house']).not.toContain(question.answer)
    }
  })

  it('tests my versus me or I, not who the narrator visited', () => {
    const questions = getQuizCatalogue().sentences.filter(q => !q.examCategory).filter(q => q.example === 'This week, I went to Colorado to visit my sister.')
    expect(questions).toHaveLength(1)
    expect(questions[0].prompt).toBe('This week, I went to Colorado to visit _____ sister.')
    expect([...questions[0].choices].sort()).toEqual(['I', 'me', 'my'])
  })

  it('does not revive retired story-recall questions from review memory', () => {
    expect(createQuizRound('sentences', 0, ['sentence-story-9-0-sister']).every(q => q.id.startsWith('grammar-'))).toBe(true)
  })
})

it('starts on the first two content targets, rather than random later material', () => {
  const first = createPracticeRound()
  expect(first).toHaveLength(10)
  expect(new Set(first.map(q => q.id)).size).toBe(10)
  expect(new Set(first.map(q => q.answer.toLowerCase()))).toEqual(new Set(['the', 'a']))
  expect(createPracticeRound(999).slice(0, -1).every(q => ['the', 'a'].includes(q.answer.toLowerCase()))).toBe(true)
})

it('ships a matching neural recording for every lesson, with blanks kept silent', () => {
  const manifest = JSON.parse(readFileSync('public/audio/lessons/voice-manifest.json', 'utf8')) as Record<string, { voice: string; text: string; seconds: number }>
  for (const item of getLessonAudioItems()) {
    const entry = manifest[item.audioUrl.split('/').at(-1)!]
    expect(entry?.voice).toBe('kokoro-1.0-heart-v1')
    expect(entry?.text).toBe(item.spokenText)
    expect(entry?.seconds).toBeGreaterThan(0.1)
    const bytes = readFileSync(`public${item.audioUrl}`)
    expect(bytes.toString('ascii', 0, 4)).toBe('RIFF')
    expect(bytes.readUInt32LE(24)).toBe(24000)
    if (item.audioUrl.includes('/gap-')) {
      expect(entry.text).toContain('_____')
      expect(entry.text).not.toContain('slnc')
      let longestSilence = 0
      let silence = 0
      for (let offset = 44; offset + 2 <= bytes.length; offset += 2) {
        silence = bytes.readInt16LE(offset) === 0 ? silence + 1 : 0
        longestSilence = Math.max(longestSilence, silence)
      }
      expect(longestSilence).toBeGreaterThanOrEqual(24000 * 0.65)
    }
  }
})
