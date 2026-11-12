import {numberItem} from './numberCatalogue'
import {categoriesForWord} from '../learning/sentenceMatrix/vocabularyCategories'
import type {ClassroomWord} from '../learning/sentenceMatrix/model'
const animals=new Set(['cat','cats','dog','dogs','bird','birds','horse','horses','cow','cows','pig','pigs','chicken','chickens','fish','elephant','elephants','monkey','monkeys'])
export type NounGroup='subjects'|'objects'
/** Curriculum grouping by agency, independent of a word's grammatical sentence position. */
export function nounGroupFor(word:string|ClassroomWord):NounGroup{
 const item=typeof word==='string'?numberItem(word)??{word,thai:''}:word
 const categories=categoriesForWord(item)
 return item.meaning?.kind==='person'||categories.includes('people')||animals.has((item.singular??item.word).toLowerCase())?'subjects':'objects'
}
