import {everydayPeopleCatalogue} from '../learning/everydayVocabulary'
import {lessonOneCatalogue,lessonTwoMatrixCatalogue,lessonThreeMatrixCatalogue} from '../classroom/wordCatalogue'
import {hasUntaughtIt} from '../learning/sentenceRules/assessmentScope'
import {validateSentence} from '../learning/sentenceRules/blueprints'
import type {ClassroomWord} from '../learning/sentenceMatrix/model'
/** First lesson assignment is retained when later lessons enrich a word's forms. */
export type NumberItem=ClassroomWord & {lesson:number;pluralForm:boolean;id:string}
export const numberCatalogue:NumberItem[]=lessonThreeMatrixCatalogue.map(word=>({
 ...word,id:word.word,pluralForm:word.number==='plural'||!!word.pairOnly,
 lesson:lessonOneCatalogue.some(first=>first.word===(word.singular??word.word))?1:lessonTwoMatrixCatalogue.some(first=>first.word===word.word)?2:3,
})).filter(word=>!hasUntaughtIt(word.word)&&validateSentence({blueprint:'where-noun',noun:word,verb:word.pluralForm?'are':'is',determiner:'the'}).length===0)
// Preserve the recorded foundation archive; composed practice has its own
// expanded inventory while sharing the same noun/agreement lookup.
export const generatedNumberCatalogue:NumberItem[]=[...numberCatalogue,...everydayPeopleCatalogue.map(word=>({...word,id:word.word,pluralForm:word.number==='plural',lesson:1}))]
const byWord=new Map(generatedNumberCatalogue.map(item=>[item.word,item]))
export const numberItem=(word:string)=>byWord.get(word)
export const numberAudio=(word:string,sentence=false)=>`/audio/number-foundation/${sentence?`where-${numberItem(word)?.pluralForm?'are':'is'}-`:''}the-${word.replaceAll(' ','-')}.wav`
