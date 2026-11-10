import type {LanguageDocument} from '../learning/sentenceMatrix/LanguageQuadrant'
import {lessonPracticeQuestions} from './lessonPractice'
import {requestedLesson} from '../learning/lessonRequests'
export function practiceDeck(lesson:number = Number(requestedLesson(window.location.search)), questionIds?:readonly string[]) {
  const source = lessonPracticeQuestions(lesson)
  const documentFor=(q:typeof source[number]):LanguageDocument=>{
    if(q.document)return q.document
    const match=q.english.match(/^(Where) (is|are) (the|my|your) (.+)$/)
    if(!match)throw new Error(`Missing picture document: ${q.id}`)
    const roles=['question','be','determiner','object'] as const
    return {english:q.english,thai:q.answers[q.correct][0].text,construction:'question',units:match.slice(1).map((english,index)=>({english,thai:'',role:roles[index]}))}
  }
  const meanings=new Map(source.map(q=>[q.answers[q.correct][0].text,documentFor(q)]))
  const questions = source.filter(q=>!questionIds||questionIds.includes(q.id))
  for (let i = questions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1)); [questions[i], questions[j]] = [questions[j], questions[i]]
  }
  const reading = questions.map(q => {
    const correct = q.answers[q.correct][0].text
    const other = q.meaningDistractor
    const side = Math.random() < .5 ? 0 : 1
    const correctDocument=documentFor(q),otherDocument=q.distractorDocument??meanings.get(other)
    if(!otherDocument)throw new Error(`Missing picture alternative: ${q.id}`)
    return { attemptId:crypto.randomUUID(), audioOnly: false, id: q.id, english: q.english, audioUrl: q.audioUrl, document:correctDocument, choiceDocuments:{[correct]:correctDocument,[other]:otherDocument}, choices: side === 0 ? [correct, other] : [other, correct], correct: side }
  })
  const listening = [...reading].reverse().map(q => ({...q, attemptId:crypto.randomUUID(), audioOnly: true, choices: [...q.choices].reverse(), correct: 1 - q.correct}))
  return [...reading, ...listening]
}


// Reuse authored meaning pairs rather than translating arbitrary text at runtime.
const englishMeanings = new Map([...lessonPracticeQuestions(1),...lessonPracticeQuestions(2),...lessonPracticeQuestions(3),...lessonPracticeQuestions(4),...lessonPracticeQuestions(5)]
  .map(q => [q.answers[q.correct][0].text,q.english]))
export function practiceEnglishMeaning(thai:string) { return englishMeanings.get(thai) ?? thai }
