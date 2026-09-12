import type { QuizMode, QuizQuestion } from './quizContent'

export type LearningRecord = {
  questionId: string
  mode: QuizMode
  prompt: string
  answer: string
  sourceTitle: string
  correctCount: number
  wrongCount: number
  lastAnsweredAt: number
  lastWrongAt?: number
}

export type LearningMemory = Readonly<Record<string, LearningRecord>>

const storagePrefix = 'fifa-english:learning-memory:v1'

function storageKey(learnerId: string) {
  const normalizedLearner = learnerId.trim().toLocaleLowerCase('en') || 'player'
  return `${storagePrefix}:${normalizedLearner}`
}

export function loadLearningMemory(
  learnerId: string,
  storage: Pick<Storage, 'getItem'> = window.localStorage,
): LearningMemory {
  try {
    const saved = storage.getItem(storageKey(learnerId))
    return saved ? JSON.parse(saved) as LearningMemory : {}
  } catch {
    return {}
  }
}

export function saveLearningMemory(
  learnerId: string,
  memory: LearningMemory,
  storage: Pick<Storage, 'setItem'> = window.localStorage,
) {
  storage.setItem(storageKey(learnerId), JSON.stringify(memory))
}

export function recordAnswer(
  memory: LearningMemory,
  question: QuizQuestion,
  correct: boolean,
  answeredAt = Date.now(),
): LearningMemory {
  const previous = memory[question.id]

  return {
    ...memory,
    [question.id]: {
      questionId: question.id,
      mode: question.mode,
      prompt: question.prompt,
      answer: question.answer,
      sourceTitle: question.sourceTitle,
      correctCount: (previous?.correctCount ?? 0) + (correct ? 1 : 0),
      wrongCount: (previous?.wrongCount ?? 0) + (correct ? 0 : 1),
      lastAnsweredAt: answeredAt,
      lastWrongAt: correct ? previous?.lastWrongAt : answeredAt,
    },
  }
}

function reviewWeight(record: LearningRecord) {
  return record.wrongCount * 3 - record.correctCount
}

export function getReviewQuestionIds(memory: LearningMemory, mode: QuizMode) {
  return Object.values(memory)
    .filter((record) => record.mode === mode && reviewWeight(record) > 0)
    .sort((left, right) => (
      reviewWeight(right) - reviewWeight(left)
      || (right.lastWrongAt ?? 0) - (left.lastWrongAt ?? 0)
    ))
    .map(({ questionId }) => questionId)
}

export function getReviewCount(memory: LearningMemory, mode: QuizMode) {
  return getReviewQuestionIds(memory, mode).length
}
