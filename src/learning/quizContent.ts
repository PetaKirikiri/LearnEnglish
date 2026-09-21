import { examPracticeQuestions, type ExamCategory, type PlaceRelation } from './examPracticeContent'
import { selectExamPractice } from './examPracticeScheduler'
import { readings } from '../content/readings'
import { lessonThaiTranslations } from '../content/languageData'
import { buildWordData, parseWords } from '../lib/wordData'
import { grammarLessons } from './grammarLessons'
import { grammarExpansion } from './grammarExpansion'
import { vocabularyContexts } from './vocabularyContexts'
import { compareContent } from './contentOrder'
import type { LearningMemory } from './learningMemory'
import { addRareEncounter, selectPracticeQuestions } from './practiceScheduler'

export type QuizMode = 'vocabulary' | 'sentences'

export type QuizQuestion = {
  id: string
  examCategory?: ExamCategory
  examPage?: number
  examTarget?: string
  examFormat?: string
  examUse?: 'practice' | 'assessment'
  sceneObject?: 'ball' | 'apple' | 'book' | 'cube'
  sceneMirror?: boolean
  passage?: string
  placeRelation?: PlaceRelation
  mode: QuizMode
  instruction: string
  prompt: string
  choices: readonly string[]
  answer: string
  sourceTitle: string
  sourceKind?: 'story' | 'practice'
  sourceReadingId?: string
  example: string
  spokenText: string
  audioUrl: string
  gapAudioUrl?: string
  contextSentence?: string
  contextAudioUrl?: string
  grammarFocus?: string
  thaiPrompt?: string
  explanation?: string
  explanationThai?: string
}

type StorySentence = {
  id: string
  text: string
  sourceTitle: string
}

const questionsPerRound = 10

// Deliberately reviewed for the meaning used in these stories. The larger admin
// dictionary remains useful for analysis, but its automatic glosses are not safe
// enough to teach from without context.

const excludedVocabulary = new Set([
  'a', 'about', 'above', 'all', 'also', 'an', 'and', 'are', 'as', 'at', 'be', 'before', 'but',
  'by', 'can', 'do', 'does', 'for', 'from', 'have', 'he', 'her', 'here', 'him', 'his', 'how',
  'i', "i'm", 'if', 'in', 'is', 'it', "it's", 'its', 'me', 'my', 'no', 'not', 'of', 'on',
  'one', 'or', 'our', 'she', "she's", 'so', 'some', 'that', "that's", 'the', 'their', 'them',
  'there', 'these', 'they', 'this', 'those', 'to', 'too', 'up', 'us', 'very', 'was', 'we',
  "we're", 'were', 'what', 'when', 'where', 'which', 'while', 'who', 'why', 'will', 'with',
  'would', 'you', 'your', 'yourself',
  'alta', 'bali', 'barbara', 'britain', 'cappadocia', 'chicago', 'colorado', 'cunha', 'diamond',
  'drina', 'east', 'inga', 'italy', 'jessica', 'jin', 'korea', 'luisa', 'marilyn', 'mexican',
  'mexico', 'norway', 'pohon', 'roger', 'rome', 'rona', 'rumah', 'seoul', 'serbia', 'smith',
  'stephanie', 'tristan', 'turkey', 'usa',
])

function createRandom(seed: number) {
  let value = (seed || 1) >>> 0

  return () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0
    return value / 4294967296
  }
}

function shuffle<T>(items: readonly T[], random: () => number) {
  const copy = [...items]

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    ;[copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]]
  }

  return copy
}

function getStorySentences(): StorySentence[] {
  return readings.flatMap((reading) => {
    let sentenceIndex = 0

    return reading.paragraphs.flatMap((paragraph) => {
      const normalized = paragraph
        .replaceAll('\n', ' ')
        .replace(/^\s*[•—]\s*/gu, '')
        .replace(/\s+/gu, ' ')
        .trim()
      const sentences = normalized.match(/[^.!?]+[.!?]+/gu) ?? []

      return sentences
        .map((sentence) => sentence.trim())
        .filter((sentence) => {
          const wordCount = parseWords(sentence).length
          return wordCount >= 5 && wordCount <= 22 && !sentence.includes('@')
        })
        .map((text) => ({
          id: `${reading.id}-${sentenceIndex++}`,
          text,
          sourceTitle: reading.title,
        }))
    })
  })
}

function includesWord(text: string, word: string) {
  return parseWords(text).includes(word)
}

function replaceFirstWord(text: string, word: string) {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')
  const pattern = new RegExp(`(^|[^\\p{L}])${escaped}(?=[^\\p{L}]|$)`, 'iu')
  return text.replace(pattern, '$1_____')
}

function createSentencePool(random: () => number): QuizQuestion[] {
  const sentences = getStorySentences()
  const pool = [...grammarLessons, ...grammarExpansion].map((lesson): QuizQuestion => {
    const sentence = sentences.find(({ text }) => text === lesson.sentence)
    const reading = readings.find(r => r.id === lesson.practice?.readingId)
    if (!sentence && !reading) throw new Error(`Grammar lesson source not found: ${lesson.sentence}`)
    const prompt = replaceFirstWord(lesson.sentence, lesson.target)
    if (prompt === lesson.sentence || !lesson.choices.includes(lesson.target)) {
      throw new Error(`Invalid grammar lesson target: ${lesson.target}`)
    }
    return {
      // New IDs keep old story-recall answers from counting as grammar mastery.
      id: sentence ? `grammar-v1-${sentence.id}-${lesson.target.toLowerCase()}` : lesson.practice!.id,
      mode: 'sentences',
      instruction: 'Choose the word that fits this meaning',
      prompt,
      choices: shuffle(lesson.choices, random),
      answer: lesson.target,
      sourceTitle: sentence ? sentence.sourceTitle : `Practice · ${reading!.title}`,
      sourceKind: sentence ? 'story' : 'practice',
      sourceReadingId: sentence ? readings.find(r => r.title === sentence.sourceTitle)!.id : reading!.id,
      example: lesson.sentence,
      spokenText: lesson.sentence,
      audioUrl: sentence ? `/audio/lessons/sentence-${sentence.id}.wav` : `/audio/lessons/${lesson.practice!.id}.wav`,
      gapAudioUrl: sentence ? `/audio/lessons/gap-${sentence.id}-${lesson.target.toLowerCase()}.wav` : `/audio/lessons/gap-${lesson.practice!.id}.wav`,
      grammarFocus: lesson.focus,
      thaiPrompt: lesson.thai,
      explanation: lesson.why,
      explanationThai: lesson.whyThai,
    }
  })

  return shuffle(pool, random)
}

function createVocabularyPool(random: () => number): QuizQuestion[] {
  const sentences = getStorySentences()
  const ranking = buildWordData(readings).ranking
  const candidates = ranking.filter(({ word }) => (
    !excludedVocabulary.has(word)
    && word.length >= 3
    && Boolean(lessonThaiTranslations[word])
  ))
  const uniqueTranslations = candidates.filter(({ word }, index, entries) => (
    entries.findIndex(({ word: otherWord }) => lessonThaiTranslations[otherWord] === lessonThaiTranslations[word]) === index
  ))

  const pool = uniqueTranslations.flatMap(({ word, count }, index) => {
    const example = sentences.find(({ text }) => includesWord(text, word))
    if (!example) return []

    const nearbyCandidates = uniqueTranslations
      .slice(Math.max(0, index - 12), index + 13)
      .filter(({ word: otherWord }) => otherWord !== word)
    const distractors = shuffle(nearbyCandidates, random).slice(0, 3)
    if (distractors.length < 3) return []

    const englishToThai = index % 2 === 0
    const answer = englishToThai ? lessonThaiTranslations[word] : word
    const otherChoices = distractors.map(({ word: distractor }) => (
      englishToThai ? lessonThaiTranslations[distractor] : distractor
    ))

    return [{
      id: `vocabulary-${word}-${count}`,
      mode: 'vocabulary' as const,
      instruction: englishToThai ? 'Choose the Thai meaning' : 'Choose the English word',
      prompt: englishToThai ? word : lessonThaiTranslations[word],
      choices: shuffle([answer, ...otherChoices], random),
      answer,
      sourceTitle: example.sourceTitle,
      example: example.text,
      spokenText: word,
      audioUrl: `/audio/lessons/vocabulary-${word}.wav`,
      contextSentence: vocabularyContexts[word],
      contextAudioUrl: `/audio/lessons/vocabulary-context-${word}.wav`,
    }]
  })

  return shuffle(pool, random)
}

export function createQuizRound(
  mode: QuizMode,
  round = 0,
  reviewQuestionIds: readonly string[] = [],
): readonly QuizQuestion[] {
  const random = createRandom(20260912 + round * 97 + (mode === 'vocabulary' ? 11 : 29))
  const pool = mode === 'vocabulary'
    ? createVocabularyPool(random)
    : createSentencePool(random)

  const chosen: QuizQuestion[] = []
  const usedSources = new Set<string>()

  for (const questionId of reviewQuestionIds.slice(0, 5)) {
    const reviewQuestion = pool.find(({ id }) => id === questionId)
    if (reviewQuestion && !chosen.some(({ id }) => id === reviewQuestion.id)) {
      chosen.push(reviewQuestion)
      usedSources.add(reviewQuestion.sourceTitle)
    }
  }

  for (const question of pool) {
    if (chosen.length >= questionsPerRound) break
    if (!usedSources.has(question.sourceTitle)) {
      chosen.push(question)
      usedSources.add(question.sourceTitle)
    }
  }

  for (const question of pool) {
    if (chosen.length >= questionsPerRound) break
    if (!chosen.some(({ id }) => id === question.id)) chosen.push(question)
  }

  return chosen
}

// The admin preview and learner share the same paired focus/review scheduler.
export function createGeneralPracticeRound(round = 0, memory: LearningMemory = {}): readonly QuizQuestion[] {
  const random = createRandom(20260912 + round * 97)
  const bank = [...createSentencePool(random), ...createVocabularyPool(random)].sort(compareContent)
  return addRareEncounter(selectPracticeQuestions(bank, memory, random, questionsPerRound), bank, memory, round, random)
}

// Prioritise the supplied textbook within the existing ten-question practice flow.
export function createPracticeRound(round = 0, memory: LearningMemory = {}): readonly QuizQuestion[] {
  const random = createRandom(20260921 + round * 97)
  return selectExamPractice(examPracticeQuestions, memory, round, random, questionsPerRound).map(q => ({ ...q, choices: shuffle(q.choices, random) }))
}

export function getLessonAudioItems() {
  const random = createRandom(20260912)
  const questions = [...createVocabularyPool(random), ...createSentencePool(random), ...examPracticeQuestions]
  const byUrl = new Map(questions.map(({ audioUrl, spokenText }) => [audioUrl, { audioUrl, spokenText }]))
  for (const question of questions) {
    if (question.gapAudioUrl) byUrl.set(question.gapAudioUrl, { audioUrl: question.gapAudioUrl, spokenText: question.prompt })
    if (question.contextSentence && question.contextAudioUrl) {
      byUrl.set(question.contextAudioUrl, { audioUrl: question.contextAudioUrl, spokenText: question.contextSentence })
    }
  }
  return Array.from(byUrl.values())
}

// The admin catalogue uses the same complete pools as the learner's rounds.
export function getQuizCatalogue() {
  const random = createRandom(20260912)
  return {
    vocabulary: [...createVocabularyPool(random), ...examPracticeQuestions.filter(q => q.mode === 'vocabulary')].sort((a, b) => a.spokenText.localeCompare(b.spokenText)),
    sentences: [...createSentencePool(random), ...examPracticeQuestions.filter(q => q.mode === 'sentences')].sort((a, b) => a.sourceTitle.localeCompare(b.sourceTitle) || a.example.localeCompare(b.example) || a.answer.localeCompare(b.answer)),
  }
}
