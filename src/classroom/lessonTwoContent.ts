import { locationSentence } from '../learning/sentenceMatrix/model'
import { pluralVocabulary, pairVocabulary } from '../race/pluralVocabulary'

export const lessonTwoCore = ['shoe', 'key', 'sock', 'bag', 'book', 'pen'] as const
export const lessonTwoWords = [...pluralVocabulary].sort((a,b) => {
  const rank = (word:string) => { const index = (lessonTwoCore as readonly string[]).indexOf(word); return index < 0 ? 100 : index }
  return rank(a.singular) - rank(b.singular)
})
export type LessonTwoWord = { singular?: string; plural: string; thai: string; classifier?: string }
export type Owner = 'the' | 'my' | 'your'
export const owners: Owner[] = ['the', 'my', 'your']
export { ownerThai } from '../learning/sentenceMatrix/model'
export const lessonTwoPairs: readonly LessonTwoWord[] = pairVocabulary
export const lessonTwoStages = ['lesson-two-number', 'lesson-two-owner', 'lesson-two-review']
export function numberSentence(item: LessonTwoWord, plural: boolean, owner: Owner) {
  const noun = plural || !item.singular ? item.plural : item.singular
  const verb = plural || !item.singular ? 'are' : 'is'
  const count = item.classifier ? `${plural ? 'หลาย' : 'หนึ่ง'}${item.classifier}` : ''
  return locationSentence({word:noun,thai:item.thai,number:verb==='are'?'plural':'singular'},owner,count)
}
