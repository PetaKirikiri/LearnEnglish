import {nextPersonalQuestion} from '../race/practiceForecast'
import {evidenceScores,type ListeningEvidence} from '../race/generatedPracticeProgress'
import {lessonPracticeTemplate} from '../race/lessonPracticeTemplate'
import type {WordProgress} from '../learning/wordProgress/model'
/** Classroom games use the same selector and account lifecycle as individual practice. */
export function classroomWordQuestion(lesson:unknown,learner:string,rows:WordProgress[],history:ListeningEvidence[],turn:number,seed:string){
 const template=lessonPracticeTemplate(lesson)
 const question=nextPersonalQuestion(template.level,rows,history,`${learner}:${seed}`,turn,template.options)
 return {question,scores:evidenceScores(rows,history)}
}
