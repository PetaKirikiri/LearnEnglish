import { describe, expect, it, vi } from 'vitest'
import { hotelQuestions, isSkillComplete, loadProgress, nextQuestion, recordAnswer, skills, supportOpacity, type Progress } from './course'
describe('hotel listening course', () => {
  it('has 320 real questions, balanced answers and sixteen contexts per focus', () => {
    expect(hotelQuestions).toHaveLength(320)
    expect(new Set(hotelQuestions.map(q => q.id)).size).toBe(320)
    expect(skills).toHaveLength(20)
    for (const skill of skills) {
      const items = hotelQuestions.filter(q => q.skill === skill)
      expect(items).toHaveLength(16)
      expect(items.filter(q => q.correct === 0)).toHaveLength(8)
      expect(new Set(items.map(q => q.english)).size).toBe(16)
      for (const item of items) {
        expect(item.answers[0]).not.toEqual(item.answers[1])
        expect(item.answers[0].map(s => s.skill)).toEqual(item.answers[1].map(s => s.skill))
      }
    }
  })
  it('preserves unchanged IDs, versions replacements, and does not skip expanded topics', () => {
    expect(hotelQuestions.find(q => q.id === 'hotel-1')?.english).toBe('The woman.')
    expect(hotelQuestions.find(q => q.id === 'hotel-32-r2')?.english).toBe('I am asking housekeeping now.')
    expect(hotelQuestions.find(q => q.id === 'hotel-32')).toBeUndefined()
    let progress: Progress = {}
    for (const q of hotelQuestions.filter(q => parseInt(q.id.slice(6)) <= 32)) progress = recordAnswer(progress, q, true, false)
    expect(progress.people.seen).toHaveLength(4)
    expect(isSkillComplete(progress, 'people')).toBe(false)
    const next = nextQuestion(progress, undefined, 0, () => 0)
    expect(next.skill).toBe('people')
    expect(Number(next.id.slice(6))).toBeGreaterThan(32)
  })
  it('keeps unchanged mastery but does not transfer it to replacement meanings', () => {
    vi.stubGlobal('localStorage', { getItem: () => JSON.stringify({
      things: { seen: ['hotel-5', 'hotel-5', 'hotel-7'], correct: 9, attempts: 12 },
      intention: { seen: ['hotel-31', 'hotel-32'], correct: 2, attempts: 3 },
    }) })
    try {
      const progress = loadProgress('existing-learner')
      expect(progress.things).toEqual({ seen: ['hotel-5'], correct: 9, attempts: 12 })
      expect(progress.intention).toEqual({ seen: [], correct: 2, attempts: 3 })
      expect(isSkillComplete(progress, 'intention')).toBe(false)
    } finally { vi.unstubAllGlobals() }
  })
  it('teaches guest-facing reception interactions rather than personal chores', () => {
    const prompts = hotelQuestions.map(q => q.english)
    expect(prompts).toEqual(expect.arrayContaining([
      'How was your flight?', 'What do you have planned for today?',
      'If you need any help, please call reception.',
      'I will ask housekeeping.', 'May I see your passport?',
    ]))
    expect(prompts.filter(text => /^(I|We)\b.*\b(eat|eating|eaten|clean|cleaning|cleaned|wash|washing|washed|cook|cooking)\b/i.test(text))).toEqual([])
  })
  it('starts with two focuses and reviews completed ones', () => {
    expect(nextQuestion({}, undefined, 0).skill).toBe('people')
    expect(nextQuestion({}, undefined, 1).skill).toBe('things')
    let progress: Progress = {}
    for (const q of hotelQuestions.filter(q => ['people','things'].includes(q.skill))) progress = recordAnswer(progress, q, true, false)
    expect(nextQuestion(progress, undefined, 0).skill).toBe('person')
    expect(nextQuestion(progress, undefined, 1).skill).toBe('action')
    expect(['people','things']).toContain(nextQuestion(progress, undefined, 3).skill)
  })
  it('covers facilities, daily times, rules, wake-up calls and early or late stays', () => {
    const prompts = hotelQuestions.map(q => q.english)
    expect(prompts).toEqual(expect.arrayContaining([
      'The pool is on the second floor.', 'The gym is on the second floor.',
      'The sauna is next to the pool.', 'The pool opens at seven in the morning.',
      'The pool closes at seven in the evening.',
      'You can check in from two in the afternoon.', 'Please check out by eleven in the morning.',
      'Would you like an early check-in?', 'Would you like a late checkout?',
      'What time would you like your wake-up call?',
      'Are you arriving today?', 'Are you departing today?',
      'Please keep the noise down after ten at night.',
    ]))
    expect(hotelQuestions.find(q => q.id === 'hotel-224')?.english).toBe('We can store your bags after checkout.')
    expect(hotelQuestions.find(q => q.id === 'hotel-225')?.english).toBe('The pool.')
    expect(hotelQuestions.find(q => q.id === 'hotel-320')?.audioUrl).toBe('/audio/hotel/hotel-320.wav')
  })
  it('continues into new routines for a learner who completed the previous catalogue', () => {
    let progress: Progress = {}
    for (const q of hotelQuestions.filter(q => parseInt(q.id.slice(6)) <= 224)) {
      progress = recordAnswer(progress, q, true, false)
    }
    expect(nextQuestion(progress, undefined, 0).skill).toBe('facilities')
    expect(nextQuestion(progress, undefined, 1).skill).toBe('hours')
    expect(nextQuestion(progress, undefined, 3).skill).toBe('people')
  })
  it('does not credit repeated or assisted guesses and restores support after error', () => {
    const q = hotelQuestions[0]
    let progress = recordAnswer({}, q, true, true)
    expect(supportOpacity(progress, q.skill)).toBe(1)
    progress = recordAnswer(progress, q, true, false)
    progress = recordAnswer(progress, q, true, false)
    expect(progress.people.seen).toHaveLength(1)
    expect(supportOpacity(progress, q.skill)).toBeLessThan(1)
    progress = recordAnswer(progress, q, false, false)
    expect(supportOpacity(progress, q.skill)).toBe(1)
  })
  it('reaches every question, keeps all completed topics in review, and never ends', () => {
    let progress: Progress = {}
    let previous: string | undefined
    const encountered = new Set<string>()
    for (let round = 0; round < hotelQuestions.length * 2; round++) {
      const q = nextQuestion(progress, previous, round, () => 0)
      expect(q).toBeDefined()
      expect(q.id).not.toBe(previous)
      encountered.add(q.id)
      progress = recordAnswer(progress, q, true, false)
      previous = q.id
    }
    expect(encountered.size).toBe(hotelQuestions.length)
    expect(skills.every(skill => isSkillComplete(progress, skill))).toBe(true)
    const reviewed = Array.from({ length: skills.length }, (_, round) => nextQuestion(progress, undefined, round).skill)
    expect(new Set(reviewed).size).toBe(skills.length)
  })
  it('rotates through every earlier topic while keeping two later focuses active', () => {
    let progress: Progress = {}
    for (const q of hotelQuestions.filter(q => skills.slice(0, 4).includes(q.skill))) progress = recordAnswer(progress, q, true, false)
    const reviews = [3, 7, 11, 15].map(round => nextQuestion(progress, undefined, round).skill)
    expect(reviews).toEqual(skills.slice(0, 4))
    const focuses = [0, 1, 2, 4, 5, 6].map(round => nextQuestion(progress, undefined, round).skill)
    expect(focuses).toEqual(['place', 'quantity', 'place', 'quantity', 'place', 'quantity'])
  })
})
