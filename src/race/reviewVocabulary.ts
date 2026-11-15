import {universityVocabulary} from '../learning/universityVocabulary'
import {actionVocabulary} from '../learning/sentenceRules/actionDialogue'
import {descriptions} from '../learning/everydayVocabulary'
import {allDeterminers} from '../learning/sentenceMatrix/model'
import {references} from '../learning/sentenceRules/identification'
import {wordHierarchies,type HierarchyType} from './wordHierarchy'

type Inventory=Record<Exclude<HierarchyType,'pronoun'>,readonly string[]>
/** The authored inventory defines membership; curriculum order only ranks it.
 * A new catalogue entry therefore cannot disappear for lack of a review entry. */
export function orderedReviewVocabulary(inventory:Inventory,order:Record<Exclude<HierarchyType,'pronoun'>,readonly string[]>){
 return Object.fromEntries(Object.entries(inventory).map(([key,words])=>{
  const type=key as keyof Inventory,known=new Set(words.map(word=>word.toLowerCase()))
  return [type,[...new Set([...order[type].filter(word=>known.has(word.toLowerCase())),...words])]]
 })) as Record<keyof Inventory,string[]>
}
export const reviewVocabulary=orderedReviewVocabulary({
 noun:universityVocabulary.map(item=>item.singular??item.word),
 verb:actionVocabulary.map(item=>item.word),
 adjective:descriptions.map(item=>item.word),
 determiner:[...allDeterminers.map(item=>item.word),...references.map(item=>item.word)],
},wordHierarchies)
