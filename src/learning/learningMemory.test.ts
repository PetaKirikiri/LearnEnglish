import { describe, expect, it } from 'vitest'
import { createQuizRound } from './quizContent'
import { getReviewQuestionIds, recordAnswer } from './learningMemory'

describe('learning memory', () => {
  it('remembers a wrong answer and prioritizes it in the next round', () => {
    const missedQuestion = createQuizRound('vocabulary')[7]
    const memory = recordAnswer({}, missedQuestion, false, 100)
    const reviewIds = getReviewQuestionIds(memory, 'vocabulary')
    const nextRound = createQuizRound('vocabulary', 1, reviewIds)

    expect(reviewIds).toEqual([missedQuestion.id])
    expect(nextRound[0]?.id).toBe(missedQuestion.id)
  })

  it('requires repeated correct answers before removing a missed item from review', () => {
    const question = createQuizRound('sentences')[0]
    let memory = recordAnswer({}, question, false, 100)
    memory = recordAnswer(memory, question, true, 200)
    memory = recordAnswer(memory, question, true, 300)

    expect(getReviewQuestionIds(memory, 'sentences')).toContain(question.id)

    memory = recordAnswer(memory, question, true, 400)
    expect(getReviewQuestionIds(memory, 'sentences')).not.toContain(question.id)
  })

  it('keeps vocabulary and sentence review queues separate', () => {
    const vocabularyQuestion = createQuizRound('vocabulary')[0]
    const memory = recordAnswer({}, vocabularyQuestion, false, 100)

    expect(getReviewQuestionIds(memory, 'sentences')).toEqual([])
  })
})
