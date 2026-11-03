import {wordId,wordTokens,type WordScores} from '../wordProgress/model'
import type {LanguageDocument} from './LanguageQuadrant'
export type CurriculumRequest={vocabularyThroughLesson:number;allowedStructures:readonly LanguageDocument['construction'][];familiarWordShare?:number;familiarScore?:number}
export type CurriculumCandidate={document:LanguageDocument;/** Highest prerequisite lesson of any unit, from the catalogue. */ vocabularyLesson:number}
/** Select from authored, semantically validated candidates. Never rewrite a source message or subtitle. */
export function rankQuadrantCandidates<T extends CurriculumCandidate>(candidates:readonly T[],request:CurriculumRequest,scores:WordScores={}){
 const target=request.familiarWordShare??0.8,threshold=request.familiarScore??5
 if(!Number.isInteger(request.vocabularyThroughLesson)||request.vocabularyThroughLesson<1||!Number.isFinite(target)||target<0||target>1||!Number.isFinite(threshold)||threshold<=0)throw new Error('Invalid curriculum request')
 return candidates.filter(candidate=>candidate.vocabularyLesson<=request.vocabularyThroughLesson&&candidate.vocabularyLesson>=1&&request.allowedStructures.includes(candidate.document.construction)).map(candidate=>{
  const words=wordTokens(candidate.document.english)
  const familiarShare=words.length?words.filter(word=>(scores[wordId(word)]??0)>=threshold).length/words.length:0
  return {candidate,familiarShare,distance:Math.abs(familiarShare-target)}
 }).sort((a,b)=>a.distance-b.distance)
}
