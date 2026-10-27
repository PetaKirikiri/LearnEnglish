import { tonightWords } from '../race/tonightVocabulary'
import { lessonTwoWords, lessonTwoPairs } from './lessonTwoContent'
export type ClassroomWord = { word:string; thai:string; singular?:string; plural?:string; number?:'singular'|'plural'; pairOnly?:boolean }
export const lessonOneCatalogue: readonly ClassroomWord[] = tonightWords.map(([word, thai]) => ({ word, thai }))
export const lessonTwoCatalogue: readonly ClassroomWord[] = [
  ...lessonTwoWords.flatMap(item=>[
    {word:item.singular,thai:item.thai,singular:item.singular,plural:item.plural,number:'singular' as const},
    {word:item.plural,thai:item.thai,singular:item.singular,plural:item.plural,number:'plural' as const},
  ]),
  ...lessonTwoPairs.map(item=>({word:item.plural,thai:item.thai,plural:item.plural,number:'plural' as const,pairOnly:true})),
]
export const verbForWord = (word:ClassroomWord) => word.number === 'plural' ? 'are' : 'is'
export function formForVerb(word:ClassroomWord,verb:'is'|'are') {return (verb==='are'?word.plural:word.singular) ?? word.word}
