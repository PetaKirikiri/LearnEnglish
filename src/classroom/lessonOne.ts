import { holidayMeaningQuestions, holidayQuestions } from '../race/holidayQuestions'
import { holidayVocabulary, type HolidayWord } from '../race/holidayVocabulary'

export const firstWords: readonly HolidayWord[] = ['hotel', 'toilet', 'taxi']
export const wordChoices = [
  ...firstWords.map(word => holidayVocabulary.find(item => item.word === word)!),
  ...holidayVocabulary.filter(item => !firstWords.includes(item.word)),
]
export const lessonTitles = {
  recall: 'ทบทวนรูปประโยค', idea: 'ถามหาสถานที่',
  example: 'เปลี่ยนคำ รูปแบบเดิม', mistake: 'คำเล็ก ๆ ก็สำคัญ',
  practice: 'แข่งม้า', review: 'หนึ่งรูปแบบ ใช้ได้หลายที่',
} as const
export type LessonPage = keyof typeof lessonTitles
export type PracticeMode = 'judgement' | 'meaning'
export type PracticeQuestion = { id: string; english: string; audio: string; choices: readonly string[]; correct: number; word: HolidayWord }

// Start with the same three familiar nouns. A noun appears in every grammatical
// variant, so recognising that noun cannot reveal whether the sentence is complete.
export const judgementPractice: PracticeQuestion[] = [
  ['hotel', 'complete'], ['hotel', 'missing-is'], ['hotel', 'missing-the'],
  ['toilet', 'missing-the'], ['toilet', 'complete'], ['toilet', 'missing-is'],
  ['taxi', 'missing-is'], ['taxi', 'missing-the'], ['taxi', 'complete'],
].map(([word, variant]) => {
  const source = holidayQuestions.find(q => q.id === `race-where-${word}-${variant}`)!
  return { id: source.id, word: word as HolidayWord, english: source.english, audio: source.audioUrl, choices: ['ถูก', 'ผิด'], correct: source.correct }
})

// Alternate noun and question-intent contrasts. The English frame never changes.
export const meaningPractice: PracticeQuestion[] = firstWords.flatMap((word, index) => {
  const source = holidayMeaningQuestions.find(q => q.id === `race-meaning-${word}`)!
  const other = holidayVocabulary.find(item => item.word === firstWords[(index + 1) % firstWords.length])!
  return [`${other.thai}อยู่ที่ไหน`, source.meaningDistractor].map((distractor, contrast) => {
    const correct = (index + contrast) % 2
    const answer = source.answers[source.correct][0].text
    return { id: `${source.id}-${contrast}`, word, english: source.english, audio: source.audioUrl, choices: correct === 0 ? [answer, distractor] : [distractor, answer], correct }
  })
})
