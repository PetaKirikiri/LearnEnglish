import { expect, it } from 'vitest'
import { tonightMeaningQuestions } from './tonightQuestions'
import { tonightWords } from './tonightVocabulary'
import { selectQuestions } from '../../server/classroomRace'

it('builds 60 binary location questions from the same 20 lesson words', () => {
  expect(tonightWords).toHaveLength(20)
  expect(tonightMeaningQuestions).toHaveLength(60)
  expect(new Set(tonightMeaningQuestions.map(q => q.id)).size).toBe(60)
  for (const q of tonightMeaningQuestions) {
    expect(q.english).toMatch(/^Where is (the|my|your) .+\?$/)
    expect(q.answers).toHaveLength(2)
    expect(q.answers[q.correct][0].text).toContain('อยู่ที่ไหน')
    expect(q.meaningDistractor).not.toBe(q.answers[q.correct][0].text)
    for (const answer of q.answers) expect(answer[0].text).toMatch(/[ก-๙]/)
  }
})
it('keeps both meanings within the teacher’s selected phone ownership questions', () => {
  const questions = tonightMeaningQuestions.map(q => ({ ...q, audioUrl: '', choices: q.answers.map(a => a[0].text) }))
  const selected = selectQuestions({id:'tonight-slots',title:'Tonight',kind:'meaning',questions}, ['tonight-phone-my','tonight-phone-your'])
  expect(selected.questions).toHaveLength(2)
  for (const q of selected.questions) expect(new Set(q.choices)).toEqual(new Set(['โทรศัพท์ของฉันอยู่ที่ไหน','โทรศัพท์ของคุณอยู่ที่ไหน']))
})

it('never lets a different noun reveal an ownership answer', () => {
  for (const [word, thai] of tonightWords) {
    for (const q of tonightMeaningQuestions.filter(q => q.id.startsWith(`tonight-${word}-`))) {
      for (const answer of q.answers) expect(answer[0].text.startsWith(thai)).toBe(true)
      expect(q.answers[1][0].text).toBe(q.meaningDistractor)
    }
  }
})
