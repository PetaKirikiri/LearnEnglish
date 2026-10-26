import type { HotelQuestion } from '../hotel/course'
import { scenarios } from './scenarios'

// Owner-selected lesson content. Do not seed from another course.
export const questionWords = [
  {english:'Who',thai:'ใคร',other:'อะไร'},
  {english:'What',thai:'อะไร',other:'ใคร'},
  {english:'Where',thai:'ที่ไหน',other:'เมื่อไหร่'},
  {english:'When',thai:'เมื่อไหร่',other:'ที่ไหน'},
  {english:'How much',thai:'เท่าไหร่',other:'กี่'},
  {english:'How many',thai:'กี่',other:'เท่าไหร่'},
  {english:'Why',thai:'ทำไม',other:'ที่ไหน'},
] as const
export const successLessons = [{
  id:'question-words',number:1,title:'Question words',
  questions:[...questionWords.map(({english,thai,other},index):HotelQuestion=>({
    id:`success-lesson-1-${index+1}`,skill:'question-words',english,correct:0,
    answers:[[{text:thai,skill:'question-words'}],[{text:other,skill:'question-words'}]],
    audioUrl:`/audio/success/success-lesson-1-${index+1}.wav`,
  })), ...scenarios.map(([english,thai,other],index):HotelQuestion=>({
    id:`success-scenario-${index+1}`,skill:'question-words',english,correct:0,
    answers:[[{text:thai,skill:'question-words'}],[{text:other,skill:'question-words'}]],
    audioUrl:`/audio/success/success-scenario-${index+1}.wav`,
  }))],
}]
export const successCourse = {
  id: 'success',
  name: 'Success',
  status: 'draft',
  lessons: successLessons,
  questions: successLessons.flatMap(lesson=>lesson.questions),
} as const

export const isSuccessRoute = (path:string) => /^\/success(?:\/|$)/.test(path)
