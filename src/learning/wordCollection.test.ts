import { expect, it } from 'vitest'
import type { QuizQuestion } from './quizContent'
import type { ProgressEvent } from './progressData'
import { buildWordCollection } from './wordCollection'
import { COLLECTION_CATALOGUE, COLLECTION_TOTALS } from './collectionCatalogue'
const now = Date.parse('2026-09-20T12:00:00Z')
const q = (word: string): QuizQuestion => ({ id: word, mode: 'vocabulary', spokenText: word, answer: 'meaning', prompt: word, choices: [], instruction: '', sourceTitle: '', example: '', audioUrl: '' })
const attempts = (word: string): ProgressEvent[] => [0,1,2,3,4].map(n => ({ id: `${word}-${n}`, learner_id: 'a', kind: 'answer', occurred_at: `2026-09-${17 + Math.floor(n/2)}T10:00:00Z`, payload: { questionId: `word:${word}`, correct: true, roundId: `r-${n}` } }))
it('levels up for ten distinct conquered words, never for question volume', () => {
 const words = ['hot','cold','table','train','city','home','mother','father','brother','sister']
 const bank = words.map(q)
 const events = words.flatMap(attempts)
 expect(buildWordCollection(events.slice(0,-1), bank, now)).toMatchObject({ level: 1, conquered: 9, toNextLevel: 1 })
 expect(buildWordCollection([...events, ...events], [...bank, bank[0]], now)).toMatchObject({ level: 2, conquered: 10, toNextLevel: 10 })
})
it('keeps conquered words and earned levels after errors or time away', () => {
 const events = attempts('hot')
 events.push({ ...events[0], id: 'wrong', occurred_at: '2026-09-20T10:00:00Z', payload: { questionId: 'word:hot', correct: false } })
 const result = buildWordCollection(events, [q('hot')], now + 30 * 86400000)
 expect(result.conquered).toBe(1)
 expect(result.words[0]).toMatchObject({ status: 'Conquered', needsReview: true })
})
it('orders unseen words by corpus frequency and separates practice from conquest', () => {
 const result = buildWordCollection(attempts('hot').slice(0,1), [q('hot'),q('the'),q('zxunknown')], now)
 expect(result.words[0]).toMatchObject({ word: 'the', status: 'Yet to see' })
 expect(result.words.find(w => w.word === 'zxunknown')).toMatchObject({ rarity:null, available:true })
 expect(result.words.find(w => w.word === 'hot')?.status).toBe('Practising')
 expect(result.level).toBe(1)
})
it('keeps fixed tier totals when lessons are added or removed', () => {
 const noLessons = buildWordCollection([], [], now)
 const oneLesson = buildWordCollection([], [q('basketball')], now)
 const moreLessons = buildWordCollection([], [q('basketball'),q('diary'),q('unlisted-new-word')], now)
 expect(COLLECTION_TOTALS.Bronze).toBe(801)
 expect(COLLECTION_TOTALS.Silver).toBe(692)
 for (const collection of [noLessons,oneLesson,moreLessons]) {
   expect(collection.catalogueTotal).toBe(3018)
   expect(collection.tierTotals).toEqual(COLLECTION_TOTALS)
   expect(collection.words.filter(w => w.rarity === 'Bronze')).toHaveLength(801)
 }
 expect(new Set(COLLECTION_CATALOGUE.map(w => w.word)).size).toBe(COLLECTION_CATALOGUE.length)
 expect(noLessons.words.find(w => w.word === 'basketball')).toMatchObject({ available:false, status:'Yet to see' })
 expect(oneLesson.words.find(w => w.word === 'basketball')).toMatchObject({ available:true, status:'Yet to see' })
 expect(oneLesson.words.find(w => w.word === 'diary')).toMatchObject({ available:false, status:'Yet to see' })
})
it('earns a catalogue word without changing the tier size or filling unplayed words', () => {
 const result = buildWordCollection(attempts('basketball'), [q('basketball')], now)
 expect(result.words.find(w => w.word === 'basketball')).toMatchObject({ rarity:'Bronze', status:'Conquered' })
 expect(result.words.filter(w => w.rarity === 'Bronze' && w.status === 'Conquered')).toHaveLength(1)
 expect(result.tierTotals.Bronze).toBe(801)
 expect(result.words.find(w => w.word === 'diary')?.status).toBe('Yet to see')
 expect(result).toMatchObject({ conquered:1, level:1, toNextLevel:9 })
})
it('does not treat imported attempts as unseen or conquered', () => {
 const event: ProgressEvent = { ...attempts('hot')[0], kind: 'legacy_import', payload: { questionId: 'word:hot', correctCount: 30 } }
 expect(buildWordCollection([event], [q('hot')], now).words[0].status).toBe('Practising')
})
