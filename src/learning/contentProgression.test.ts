import { describe, expect, it } from 'vitest'
import { createPracticeRound, type QuizQuestion } from './quizContent'
import { orderedQuestionBank } from './questionSheet'
import { questionBlock } from './contentOrder'
import { practiceFocus } from './practiceScheduler'
import { hasLearnedQuestion, loadLearningMemory, recordAnswer, saveLearningMemory, type LearningMemory } from './learningMemory'

const bank = orderedQuestionBank().map(row => row.question)
const blocks = [...new Set(bank.map(questionBlock))]
const pair = (index: number) => bank.filter(q => blocks.slice(index * 2, index * 2 + 2).includes(questionBlock(q)))
function complete(questions: readonly QuizQuestion[] = pair(0), initial: LearningMemory = {}) {
  let memory = initial
  for (let pass = 0; pass < 2; pass++) for (const q of questions) {
    memory = recordAnswer(memory, q, true, 1000 + pass, 'pass-' + pass)
  }
  return memory
}
describe('Paired focus with cumulative review', () => {
  it('mixes the first two corpus-ranked targets with balanced unique examples', () => {
    const round = createPracticeRound()
    expect(blocks.slice(0, 2)).toEqual(['sentences:the', 'sentences:a'])
    expect(round).toHaveLength(10)
    expect(new Set(round.map(q => q.id)).size).toBe(10)
    for (const block of blocks.slice(0, 2)) expect(round.filter(q => questionBlock(q) === block)).toHaveLength(5)
    expect(round[0].id).toBe(bank[0].id)
    expect(createPracticeRound(999).slice(0, -1).every(q => blocks.slice(0, 2).includes(questionBlock(q)))).toBe(true)
    expect(createPracticeRound(0).map(q => q.id)).toEqual(round.map(q => q.id))
  })
  it('does not teach a fixed alternating answer sequence', () => {
    const orders = Array.from({ length: 12 }, (_, i) => createPracticeRound(i).map(questionBlock))
    expect(new Set(orders.map(o => o.join(','))).size).toBeGreaterThan(3)
    for (const order of orders) {
      for (let i = 2; i < order.length; i++) expect(new Set(order.slice(i - 2, i + 1)).size).toBeGreaterThan(1)
    }
  })
  it('requires every example in both targets and two distinct passes, not three days', () => {
    let memory: LearningMemory = {}
    for (const q of pair(0)) for (let n = 0; n < 5; n++) memory = recordAnswer(memory, q, true, 100, 'same-pass')
    expect(practiceFocus(bank, memory).pair).toBe(1)
    memory = complete(pair(0).slice(1), memory)
    expect(practiceFocus(bank, memory).pair).toBe(1)
    memory = recordAnswer(memory, pair(0)[0], true, 200, 'second-pass')
    expect(practiceFocus(bank, memory).pair).toBe(2)
  })
  it('moves to targets 3 and 4 with seven focus questions and three earlier reviews', () => {
    const memory = complete()
    const round = createPracticeRound(0, memory)
    expect(round.filter(q => blocks.slice(2, 4).includes(questionBlock(q)))).toHaveLength(7)
    expect(round.filter(q => blocks.slice(0, 2).includes(questionBlock(q)))).toHaveLength(3)
    expect(new Set(round.filter(q => blocks.slice(0, 2).includes(questionBlock(q))).map(questionBlock)).size).toBe(2)
    expect(new Set(round.map(q => q.id)).size).toBe(round.length)
  })
  it('prioritises mistakes in older material without abandoning the current pair', () => {
    let memory = complete()
    const old = pair(0).at(-1)!
    memory = recordAnswer(memory, old, false, 9000, 'miss')
    expect(hasLearnedQuestion(memory[old.id])).toBe(true)
    expect(practiceFocus(bank, memory).pair).toBe(2)
    expect(createPracticeRound(0, memory)[2].id).toBe(old.id)
  })
  it('does not let legacy totals or random later attempts skip the first pair', () => {
    let memory: LearningMemory = {}
    for (const q of pair(0)) for (let n = 0; n < 20; n++) memory = recordAnswer(memory, q, true, n)
    memory = complete(pair(4), memory)
    expect(practiceFocus(bank, memory).pair).toBe(1)
  })
  it('persists acquisition and resumes the same pair with review', () => {
    const storage = new Map<string, string>()
    const adapter = { setItem: (k: string, v: string) => { storage.set(k, v) }, getItem: (k: string) => storage.get(k) ?? null }
    const memory = complete()
    saveLearningMemory('Fifa', memory, adapter)
    expect(createPracticeRound(2, loadLearningMemory('Fifa', adapter))).toEqual(createPracticeRound(2, memory))
  })
  it('rotates review across both earlier targets instead of retiring either', () => {
    let memory = complete()
    const reviewed = new Set<string>()
    for (let round = 0; round < 10; round++) {
      for (const q of createPracticeRound(round, memory).filter(q => blocks.slice(0, 2).includes(questionBlock(q)))) {
        reviewed.add(q.id)
        memory = recordAnswer(memory, q, true, 10000 + round, 'review-' + round)
      }
    }
    expect(reviewed.size).toBe(pair(0).length)
  })
  it('covers both focus banks before repeating already-seen examples', () => {
    let memory: LearningMemory = {}
    const seen = new Set<string>()
    for (let round = 0; round < 2; round++) for (const q of createPracticeRound(round, memory)) {
      if (seen.has(q.id)) expect(bank.filter(other => questionBlock(other) === questionBlock(q)).every(other => seen.has(other.id))).toBe(true)
      seen.add(q.id)
      memory = recordAnswer(memory, q, true, 10000 + round, 'round-' + round)
    }
    expect(seen.size).toBe(pair(0).length)
  })
  it('eventually reaches every pair and keeps reviewing after course acquisition', () => {
    let memory: LearningMemory = {}
    for (let i = 0; i < Math.ceil(blocks.length / 2); i++) {
      expect(practiceFocus(bank, memory).pair).toBe(i + 1)
      const round = createPracticeRound(i, memory)
      expect(round.some(q => blocks.slice(i * 2, i * 2 + 2).includes(questionBlock(q)))).toBe(true)
      memory = complete(pair(i), memory)
    }
    expect(practiceFocus(bank, memory).pair).toBeNull()
    expect(createPracticeRound(100, memory)).toHaveLength(10)
  })
})
