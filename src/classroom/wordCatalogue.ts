import { tonightWords } from '../race/tonightVocabulary'
import { lessonTwoWords, lessonTwoPairs } from './lessonTwoContent'
import type { ClassroomWord } from '../learning/sentenceMatrix/model'
export type { ClassroomWord } from '../learning/sentenceMatrix/model'
export { verbForWord, formForVerb } from '../learning/sentenceMatrix/model'
export const lessonOneCatalogue: readonly ClassroomWord[] = tonightWords.map(([word, thai]) => ({ word, thai }))
export const lessonTwoCatalogue: readonly ClassroomWord[] = [
  ...lessonTwoWords.flatMap(item=>[
    {word:item.singular,thai:item.thai,singular:item.singular,plural:item.plural,number:'singular' as const},
    {word:item.plural,thai:item.thai,singular:item.singular,plural:item.plural,number:'plural' as const},
  ]),
  ...lessonTwoPairs.map(item=>({word:item.plural,thai:item.thai,plural:item.plural,number:'plural' as const,pairOnly:true})),
]
