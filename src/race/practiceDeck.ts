import { tonightMeaningQuestions } from './tonightQuestions'
import { lessonTwoReviewQuestions } from './lessonTwoQuestions'
export function practiceDeck(lesson = new URLSearchParams(window.location.search).get('lesson') === '2' ? 2 : 1) {
  const source = lesson === 2 ? [...tonightMeaningQuestions, ...lessonTwoReviewQuestions.filter(q => q.id.startsWith('l2-translation-') && q.audioUrl?.startsWith('/audio/race-lesson-two/'))] : [...tonightMeaningQuestions]
  const questions = [...source]
  for (let i = questions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1)); [questions[i], questions[j]] = [questions[j], questions[i]]
  }
  const reading = questions.map(q => {
    const correct = q.answers[q.correct][0].text
    const other = q.meaningDistractor
    const side = Math.random() < .5 ? 0 : 1
    return { attemptId:crypto.randomUUID(), audioOnly: false, id: q.id, english: q.english, audioUrl: q.audioUrl, choices: side === 0 ? [correct, other] : [other, correct], correct: side }
  })
  const listening = [...reading].reverse().map(q => ({...q, attemptId:crypto.randomUUID(), audioOnly: true, choices: [...q.choices].reverse(), correct: 1 - q.correct}))
  return [...reading, ...listening]
}


// Reuse authored meaning pairs rather than translating arbitrary text at runtime.
const englishMeanings = new Map([...tonightMeaningQuestions,...lessonTwoReviewQuestions]
  .map(q => [q.answers[q.correct][0].text,q.english]))
export function practiceEnglishMeaning(thai:string) { return englishMeanings.get(thai) ?? thai }
