import { expect, it } from 'vitest'
import { wordRarity, RARITIES } from './wordRarity'
import { PENDING_WORD_RATINGS, wordBenchmark } from './wordBenchmarks'
import { createPracticeRound, getQuizCatalogue } from './quizContent'
import { questionWord } from './contentOrder'
import { recordAnswer, type LearningMemory } from './learningMemory'
it('uses external meaning benchmarks instead of course-topic frequency', () => {
  for (const word of ['city','cities','train','winter']) {
    expect(wordRarity(word)).toBe('Foundation')
    expect(wordBenchmark(word)?.level).toBe('A1')
  }
  expect(wordBenchmark('cities')?.lemma).toBe('city')
  expect(wordRarity('thunder')).toBe('Silver')
  expect(wordRarity(' Winter ')).toBe('Foundation')
  expect(wordRarity('basketball')).toBe('Bronze')
  expect(wordRarity('handouts')).toBe('Gold')
  expect(wordRarity('unreviewed-word')).toBeNull()
})
it('uses the paper sense for school equipment and withholds unsupported advanced rewards', () => {
  expect(wordBenchmark('notebooks')).toMatchObject({ level:'A2', lemma:'notebook' })
  expect(wordRarity('notebooks')).toBe('Bronze')
  expect(wordRarity('folders')).toBe('Bronze')
  expect(wordBenchmark('nest')?.level).toBe('C1')
  expect(wordRarity('nest')).toBeNull()
  expect(wordRarity('corn')).toBeNull()
})
it('limits encounters to one reviewed four-choice vocabulary item every fifth round', () => {
  for(let round=0;round<15;round++) {
    const questions = createPracticeRound(round)
    const rare = questions.filter(q => q.mode === 'vocabulary')
    expect(rare).toHaveLength((round+1)%5 === 0 ? 1 : 0)
    if(rare.length) {
      expect(rare[0].mode).toBe('vocabulary')
      expect(rare[0].prompt).toBe(rare[0].spokenText)
      expect(rare[0].choices).toHaveLength(4)
      expect(RARITIES.indexOf(wordRarity(questionWord(rare[0]))!)).toBeGreaterThan(0)
    }
  }
})
it('revisits a discovery across sessions until five passes on three dates', () => {
  const q = createPracticeRound(4).at(-1)!
  let memory: LearningMemory = {}
  for(let n=0;n<5;n++) {
    if(n) expect(createPracticeRound(4,memory).at(-1)?.id).toBe(q.id)
    memory=recordAnswer(memory,q,true,Date.parse(`2026-09-${17+Math.floor(n/2)}T10:00:00Z`),`pass-${n}`)
  }
  expect(memory[q.id].correctPasses).toHaveLength(5)
  expect(createPracticeRound(4,memory).at(-1)?.id).not.toBe(q.id)
})
it('audits every current target without inventing advanced content', () => {
  const bank = getQuizCatalogue()
  for (const q of [...bank.vocabulary,...bank.sentences]) {
    const word = questionWord(q)
    if (wordRarity(word) === null) expect(PENDING_WORD_RATINGS[word]).toBeTruthy()
    else {
      expect(['Foundation','Bronze','Silver','Gold']).toContain(wordRarity(word))
      expect(wordBenchmark(word)?.source).toMatch(/^https:\/\/(www\.oxfordlearnersdictionaries\.com|dictionary\.cambridge\.org)\//)
    }
  }
  for (const round of [4,9,14,99]) {
    expect(['Bronze','Silver','Gold']).toContain(wordRarity(questionWord(createPracticeRound(round).at(-1)!)))
  }
})
it('keeps helped discoveries in practice without earning independent passes', () => {
  const q = createPracticeRound(4).at(-1)!
  let memory: LearningMemory = {}
  for(let n=0;n<6;n++) memory=recordAnswer(memory,q,true,Date.parse(`2026-09-${10+n}T10:00:00Z`),`pass-${n}`,false)
  expect(memory[q.id].correctCount).toBe(6)
  expect(memory[q.id].correctPasses).toHaveLength(0)
  expect(createPracticeRound(4,memory).at(-1)?.id).toBe(q.id)
})
