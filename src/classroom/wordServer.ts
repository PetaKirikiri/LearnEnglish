import {sharedCasinoQuestion} from './casinoWordServer'
import {evidenceScores,type ListeningEvidence} from '../race/generatedPracticeProgress'
import type {WordProgress} from '../learning/wordProgress/model'
/** Classroom games use the shared blueprints with familiar content-word contrasts for every participant. */
export function classroomWordQuestion(lesson:unknown,learner:string,rows:WordProgress[],history:ListeningEvidence[],turn:number,seed:string,players:readonly (readonly WordProgress[])[]=[rows]){
 const question=sharedCasinoQuestion(lesson,learner,rows,history,turn,seed,players)
 return {question,scores:evidenceScores(rows,history)}
}
