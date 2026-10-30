import {lessonOneCatalogue,lessonTwoMatrixCatalogue,lessonThreeMatrixCatalogue} from '../classroom/wordCatalogue'
import {validateSentence} from '../learning/sentenceRules/blueprints'
import type {ClassroomWord} from '../learning/sentenceMatrix/model'
/** First lesson assignment is retained when later lessons enrich a word's forms. */
export type NumberItem=ClassroomWord & {lesson:number;pluralForm:boolean;id:string}
export const numberCatalogue:NumberItem[]=lessonThreeMatrixCatalogue.map(word=>({
 ...word,id:word.word,pluralForm:word.number==='plural'||!!word.pairOnly,
 lesson:lessonOneCatalogue.some(first=>first.word===(word.singular??word.word))?1:lessonTwoMatrixCatalogue.some(first=>first.word===word.word)?2:3,
})).filter(word=>validateSentence({blueprint:'where-noun',noun:word,verb:word.pluralForm?'are':'is',determiner:'the'}).length===0)
export const numberItem=(word:string)=>numberCatalogue.find(item=>item.word===word)
export const numberAudio=(word:string,sentence=false)=>`/audio/number-foundation/${sentence?`where-${numberItem(word)?.pluralForm?'are':'is'}-`:''}the-${word.replaceAll(' ','-')}.wav`
