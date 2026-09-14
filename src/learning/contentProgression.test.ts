import { describe, expect, it } from 'vitest'
import { createPracticeRound, type QuizQuestion } from './quizContent'
import { orderedQuestionBank } from './questionSheet'
import { questionBlock } from './contentOrder'
import { hasCompletedQuestion, loadLearningMemory, recordAnswer, saveLearningMemory, type LearningMemory } from './learningMemory'

const bank = orderedQuestionBank().map(row => row.question)
const the = bank.filter(q => questionBlock(q) === 'sentences:the')
function complete(questions: readonly QuizQuestion[] = the, initial: LearningMemory = {}) {
  let memory = initial
  for (let day = 0; day < 3; day++) for (const q of questions) {
    memory = recordAnswer(memory, q, true, Date.UTC(2026, 8, 1 + day), `pass-${day}`)
  }
  return memory
}
describe('Content controls learner progression', () => {
  it('uses exactly the admin table order, including every the sentence', () => {
    expect(createPracticeRound().map(q => q.id)).toEqual(bank.slice(0, 10).map(q => q.id))
    expect(createPracticeRound().map(q => q.id)).toEqual(the.map(q => q.id))
  })
  it('does not move on after a single correct pass or many same-day passes', () => {
    let memory: LearningMemory = {}
    for (let pass = 0; pass < 6; pass++) {
      for (const q of the) memory = recordAnswer(memory, q, true, Date.UTC(2026, 8, 1), `pass-${pass}`)
      expect(createPracticeRound(pass + 1, memory).every(q => q.answer.toLowerCase() === 'the')).toBe(true)
    }
  })
  it('unlocks a only when all the sentences are complete, then is after a', () => {
    const memory = complete()
    const next = createPracticeRound(0, memory)
    expect(next.every(q => questionBlock(q) === 'sentences:a')).toBe(true)
    const afterA = createPracticeRound(0, complete(next, memory))
    expect(afterA.every(q => questionBlock(q) === 'sentences:is')).toBe(true)
  })
  it('keeps an incomplete sentence in the active block and resets its evidence after a mistake', () => {
    let memory = complete()
    memory = recordAnswer(memory, the[4], false, Date.UTC(2026, 8, 4), 'mistake')
    expect(hasCompletedQuestion(memory[the[4].id])).toBe(false)
    expect(createPracticeRound(500, memory).map(q => q.id)).toEqual([the[4].id])
    expect(createPracticeRound(0, complete([the[4]], memory)).every(q => q.answer.toLowerCase() === 'a')).toBe(true)
  })
  it('does not let old counters or later-word mistakes bypass the content order', () => {
    let memory: LearningMemory = {}
    for (let i = 0; i < 20; i++) for (const q of the) memory = recordAnswer(memory, q, true, i)
    const these = bank.find(q => q.answer.toLowerCase() === 'these')!
    memory = recordAnswer(memory, these, false, 100)
    expect(createPracticeRound(0, memory).every(q => q.answer.toLowerCase() === 'the')).toBe(true)
  })
  it('resumes the active block from persisted progress rather than restarting or skipping', () => {
    const storage = new Map<string, string>()
    const adapter = { setItem: (key: string, value: string) => { storage.set(key, value) }, getItem: (key: string) => storage.get(key) ?? null }
    saveLearningMemory('Fifa', complete(), adapter)
    expect(createPracticeRound(0, loadLearningMemory('Fifa', adapter)).every(q => q.answer.toLowerCase() === 'a')).toBe(true)
  })
  it('eventually reaches every ordered content block and keeps revising after completion', () => {
    let memory: LearningMemory = {}
    const blocks = [...new Set(bank.map(questionBlock))]
    const visited: string[] = []
    for (const block of blocks) {
      const next = createPracticeRound(0, memory)
      expect(next.every(q => questionBlock(q) === block)).toBe(true)
      visited.push(questionBlock(next[0]))
      memory = complete(bank.filter(q => questionBlock(q) === block), memory)
    }
    expect(visited).toEqual(blocks)
    expect(createPracticeRound(0, memory)).toHaveLength(10)
  })
})
