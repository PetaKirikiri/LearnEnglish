import { readings } from '../content/readings'
import { buildWordData } from '../lib/wordData'
import type { QuizQuestion } from './quizContent'

const frequency = new Map(buildWordData(readings).ranking.map((entry, index) => [entry.word, { count: entry.count, rank: index + 1 }]))
export const questionWord = (q: QuizQuestion) => (q.mode === 'vocabulary' ? q.spokenText : q.answer).toLowerCase()
export const questionFrequency = (q: QuizQuestion) => frequency.get(questionWord(q)) ?? { count: 0, rank: Infinity }
export const questionBlock = (q: QuizQuestion) => `${q.mode}:${questionWord(q)}`
export function compareContent(a: QuizQuestion, b: QuizQuestion) {
  return questionFrequency(a).rank - questionFrequency(b).rank || questionWord(a).localeCompare(questionWord(b)) || a.mode.localeCompare(b.mode) || a.id.localeCompare(b.id)
}
