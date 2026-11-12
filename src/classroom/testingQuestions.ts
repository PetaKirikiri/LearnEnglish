import {actionPracticeQuestions} from '../race/actionPracticeContent'
import {identificationQuestions} from '../race/identificationContent'
export const classroomTestingQuestions=[...actionPracticeQuestions,...identificationQuestions]

import type {ActionPracticeQuestion} from '../race/actionPracticeContent'
import type {ClassTurn} from './session'
/** Classroom ordering is authoritative; reuse the existing assessment presentation. */
export function classroomPracticeQuestion(question:ActionPracticeQuestion,turn:ClassTurn):ActionPracticeQuestion{
 const correct=turn.choices.indexOf(question.choices[question.correct])
 if(turn.choices.length!==2||correct<0||turn.choices.some(choice=>!question.choices.includes(choice)))throw new Error('Classroom question choices do not match the practice catalogue')
 return {...question,choices:[turn.choices[0],turn.choices[1]],correct}
}
