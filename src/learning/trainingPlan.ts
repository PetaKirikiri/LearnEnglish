import { readings, type Reading } from '../content/readings'
import { buildWordData, parseWords } from '../lib/wordData'
import { getQuizCatalogue, type QuizQuestion } from './quizContent'
import type { ItemProgress } from './progressData'

export type TrainingExample = {
  id: string
  text: string
  context: string
  story: string
  chapter?: number
  questions: readonly QuizQuestion[]
}
export type TrainingWord = {
  word: string
  rank: number
  frequency: number
  examples: readonly TrainingExample[]
}

export function buildTrainingPlan(stories: readonly Reading[] = readings, questions: readonly QuizQuestion[] = getQuizCatalogue().sentences): TrainingWord[] {
  const exerciseIndex = new Map<string, Map<string, QuizQuestion>>()
  for (const question of questions) {
    const key = JSON.stringify([question.sourceTitle, question.example, question.answer.toLowerCase()])
    const entries = exerciseIndex.get(key) ?? new Map<string, QuizQuestion>()
    entries.set(question.id, question)
    exerciseIndex.set(key, entries)
  }
  const sentences = stories.flatMap(story => {
    const seen = new Set<string>()
    return story.paragraphs.flatMap((paragraph, paragraphIndex) => {
      const normalized = paragraph.replaceAll('\n', ' ').replace(/^\s*[•—]\s*/gu, '').replace(/\s+/gu, ' ').trim()
      return (normalized.match(/[^.!?]+[.!?]+/gu) ?? []).flatMap((part, sentenceIndex) => {
        const text = part.trim()
        if (text.includes('@') || parseWords(text).length === 0 || seen.has(text)) return []
        seen.add(text)
        return [{ id: `${story.id}:${paragraphIndex}:${sentenceIndex}`, text, context: paragraph, story: story.title, chapter: story.chapter, words: new Set(parseWords(text)) }]
      })
    })
  })
  return buildWordData(stories).ranking.map(({ word, count }, index) => ({
    word, rank: index + 1, frequency: count,
    examples: sentences.filter(sentence => sentence.words.has(word)).map(sentence => ({
      ...sentence,
      questions: [...(exerciseIndex.get(JSON.stringify([sentence.story, sentence.text, word]))?.values() ?? [])],
    })),
  }))
}

export function exampleEvidence(example: TrainingExample, records: ReadonlyMap<string, ItemProgress>) {
  if (!example.questions.length) return { rounds: 0, status: 'No exercise yet' }
  const counts = example.questions.map(question => records.get(question.id))
  const rounds = Math.max(0, ...counts.map(record => Math.min(3, record?.correctRounds.size ?? 0)))
  if (rounds >= 3) return { rounds, status: '3 correct rounds' }
  if (counts.some(record => record?.status === 'Needs review')) return { rounds, status: 'Needs review' }
  return { rounds, status: counts.some(Boolean) ? 'Practising' : 'Not attempted' }
}
