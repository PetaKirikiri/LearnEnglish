import { describe, expect, it } from 'vitest'
import { buildTrainingPlan, exampleEvidence } from './trainingPlan'

describe('training plan review', () => {
  it('counts title and repeat occurrences but shows each distinct sentence only once', () => {
    const plan = buildTrainingPlan([{ id: 'one', title: 'Them', chapter: 1, paragraphs: ['They see them. I help them.', 'They see them.'] }], [])
    expect(plan[0].word).toBe('them')
    expect(plan[0].frequency).toBe(4)
    expect(plan[0].rank).toBe(1)
    expect(plan[0].examples.map(example => example.text)).toEqual(['They see them.', 'I help them.'])
    expect(plan[0].examples[0].context).toBe('They see them. I help them.')
  })

  it('keeps frequent words with missing exercises visible instead of skipping them', () => {
    const plan = buildTrainingPlan()
    const them = plan.find(item => item.word === 'them')!
    expect(them.examples.length).toBeGreaterThan(0)
    expect(them.examples.every(example => !example.questions.length)).toBe(true)
    expect(exampleEvidence(them.examples[0], new Map()).status).toBe('No exercise yet')
    expect(plan.slice(0, 3).map(item => item.word)).toEqual(['the', 'a', 'is'])
  })

  it('connects evidence to the exact sentence and target word only', () => {
    const plan = buildTrainingPlan()
    const word = plan.find(item => item.word === 'is')!
    const example = word.examples.find(item => item.questions.length)!
    expect(example.questions.every(question => question.answer === 'is' && question.example === example.text)).toBe(true)
    expect(exampleEvidence(example, new Map([['word:is', { correct: 20, wrong: 0, correctRounds: new Set(['a', 'b', 'c']), lastAnswered: null, status: 'Learned' }]])).rounds).toBe(0)
  })
})
