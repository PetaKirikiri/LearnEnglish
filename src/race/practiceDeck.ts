import {lessonPracticeQuestions} from './lessonPractice'
import {requestedLesson} from '../learning/lessonRequests'
export function practiceDeck(lesson:number = Number(requestedLesson(window.location.search)), questionIds?:readonly string[]) {
  const source = lessonPracticeQuestions(lesson)
  const questions = source.filter(q=>!questionIds||questionIds.includes(q.id))
  for (let i = questions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1)); [questions[i], questions[j]] = [questions[j], questions[i]]
  }
  const reading = questions.map(q => {
    const correct = q.answers[q.correct][0].text
    const other = q.meaningDistractor
    const side = Math.random() < .5 ? 0 : 1
    return { attemptId:crypto.randomUUID(), audioOnly: false, id: q.id, english: q.english, audioUrl: q.audioUrl, document:q.document, choices: side === 0 ? [correct, other] : [other, correct], correct: side }
  })
  const listening = [...reading].reverse().map(q => ({...q, attemptId:crypto.randomUUID(), audioOnly: true, choices: [...q.choices].reverse(), correct: 1 - q.correct}))
  return [...reading, ...listening]
}


// Reuse authored meaning pairs rather than translating arbitrary text at runtime.
const englishMeanings = new Map([...lessonPracticeQuestions(1),...lessonPracticeQuestions(2),...lessonPracticeQuestions(3),...lessonPracticeQuestions(4),...lessonPracticeQuestions(5)]
  .map(q => [q.answers[q.correct][0].text,q.english]))
export function practiceEnglishMeaning(thai:string) { return englishMeanings.get(thai) ?? thai }
