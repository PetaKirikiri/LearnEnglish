import type { HotelQuestion } from '../hotel/course'
import { holidayVocabulary } from './holidayVocabulary'

// Specific, singular count nouns only. Avoid reception/home/school, where
// omitting the article can be natural. The noun never determines the answer.
export const holidayNouns = holidayVocabulary.map(item => item.word)
export const holidaySkill = 'race-where-is-the'
const holidayMeanings = holidayVocabulary.map(item => `${item.thai}อยู่ที่ไหน`)
export const holidayMeaningQuestions: (HotelQuestion & { meaningDistractor: string })[] = holidayNouns.map((noun, i) => ({
  id: `race-meaning-${noun}`, english: `Where is the ${noun}?`, skill: holidaySkill, correct: 0,
  answers: [[{ text: holidayMeanings[i], skill: holidaySkill }], [{ text: holidayVocabulary[i].meaningDistractor, skill: holidaySkill }]],
  audioUrl: `/audio/race-holiday/${noun}-complete.wav`,
  meaningDistractor: holidayVocabulary[i].meaningDistractor,
}))
export function holidayWordFor(id: string) {
  return holidayNouns.find(noun => id === `race-meaning-${noun}` || id.startsWith(`race-where-${noun}-`))
}
export const holidayQuestions: HotelQuestion[] = holidayNouns.flatMap(noun => [
  { variant: 'complete', english: `Where is the ${noun}?`, correct: 0 as const },
  { variant: 'missing-is', english: `Where the ${noun}?`, correct: 1 as const },
  { variant: 'missing-the', english: `Where is ${noun}?`, correct: 1 as const },
].map(item => ({
  id: `race-where-${noun}-${item.variant}`,
  english: item.english,
  skill: holidaySkill,
  correct: item.correct,
  answers: [[{ text: 'Correct', skill: holidaySkill }], [{ text: 'Wrong', skill: holidaySkill }]],
  audioUrl: `/audio/race-holiday/${noun}-${item.variant}.wav`,
  grammar: { kind: 'meaning', context: 'Ask where a particular holiday place or thing is.', phase: 'practice', targets: ['where is the'], contrast: item.variant, explanation: `Where + is + the + ${noun}?` },
})))
