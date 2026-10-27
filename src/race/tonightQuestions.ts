import type { HotelQuestion } from '../hotel/course'
import { tonightWords } from './tonightVocabulary'

// English always asks location. Thai distractors test object, ownership or intent.
export const tonightMeaningQuestions: (HotelQuestion & { meaningDistractor: string })[] = tonightWords.flatMap(([word, thai], index) =>
  (['the', 'my', 'your'] as const).map((determiner, d) => {
    const owner = ['', 'ของฉัน', 'ของคุณ'][d]
    const correct = `${thai}${owner}อยู่ที่ไหน`
    const differentObject = `${tonightWords[(index + 1) % tonightWords.length][1]}${owner}อยู่ที่ไหน`
    const contrast = d === 0 ? `${thai}อยู่ที่นี่ใช่ไหม` : `${thai}${d === 1 ? 'ของคุณ' : 'ของฉัน'}อยู่ที่ไหน`
    return { id: `tonight-${word}-${determiner}`, english: `Where is ${determiner} ${word}?`, skill: 'race-tonight-slots', audioUrl: '', correct: 0,
      answers: [[{ text: correct, skill: 'race-tonight-slots' }], [{ text: differentObject, skill: 'race-tonight-slots' }]], meaningDistractor: contrast }
  }))

export const tonightJudgementQuestions: HotelQuestion[] = tonightMeaningQuestions.flatMap(source => [
  { suffix:'complete', english:source.english, correct:0 as const },
  { suffix:'missing-is', english:source.english.replace('Where is ', 'Where '), correct:1 as const },
  { suffix:'missing-determiner', english:source.english.replace(/ (the|my|your) /, ' '), correct:1 as const },
].filter(item => item.suffix !== 'missing-determiner' || !/ (school|aircon)\?/.test(item.english)).map(item => ({
  id: `${source.id}-${item.suffix}`, english:item.english, correct:item.correct,
  skill:'race-class-one', audioUrl:'', answers:[[{text:'Correct',skill:'race-class-one'}],[{text:'Wrong',skill:'race-class-one'}]],
})))
