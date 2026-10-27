// Lesson catalogues accumulate authored vocabulary, never future content.
import { lessonThreeWords } from './lessonThreeVocabulary'
import { tonightWords } from '../race/tonightVocabulary'
import { lessonTwoWords, lessonTwoPairs } from './lessonTwoContent'
import type { ClassroomWord } from '../learning/sentenceMatrix/model'
export type { ClassroomWord } from '../learning/sentenceMatrix/model'
export { verbForWord, formForVerb } from '../learning/sentenceMatrix/model'
export const lessonOneCatalogue: readonly ClassroomWord[] = tonightWords.map(([word, thai]) => ({ word, thai }))
export const lessonTwoIntroducedCatalogue: readonly ClassroomWord[] = [
  ...lessonTwoWords.flatMap(item=>[
    {word:item.singular,thai:item.thai,singular:item.singular,plural:item.plural,number:'singular' as const},
    {word:item.plural,thai:item.thai,singular:item.singular,plural:item.plural,number:'plural' as const},
  ]),
  ...lessonTwoPairs.map(item=>({word:item.plural,thai:item.thai,plural:item.plural,number:'plural' as const,pairOnly:true})),
]

/** Merge only stages reached so far. Later records enrich an existing word without duplicating it. */
export function cumulativeCatalogue(...stages:readonly (readonly ClassroomWord[])[]):readonly ClassroomWord[] {
  const words=new Map<string,ClassroomWord>()
  for(const stage of stages)for(const entry of stage) {
    const key=entry.word.toLowerCase().trim()
    words.set(key,{...words.get(key),...entry})
  }
  return [...words.values()]
}
export const lessonTwoCatalogue=cumulativeCatalogue(lessonOneCatalogue,lessonTwoIntroducedCatalogue)

export const lessonThreeIntroducedCatalogue:readonly ClassroomWord[]=lessonThreeWords.flatMap(item=>[
 {...item,word:item.singular,number:'singular' as const},
 {...item,word:item.plural,number:'plural' as const},
])
export const lessonThreeCatalogue=cumulativeCatalogue(lessonOneCatalogue,lessonTwoIntroducedCatalogue,lessonThreeIntroducedCatalogue)
