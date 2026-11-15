import type {ClassroomWord} from './sentenceMatrix/model'
import type {WordMeaning} from './sentenceRules/blueprints'
import type {VocabularyCategory} from './sentenceMatrix/vocabularyCategories'

type Entry={singular:string;plural?:string;thai:string;classifierThai?:string;categories:readonly VocabularyCategory[];meaning:WordMeaning}
/** Explicit senses and affordances, shared by teacher exploration and adaptive practice. */
export const expandedEverydayObjects:readonly Entry[]=[
 {singular:'home',plural:'homes',thai:'บ้าน',classifierThai:'หลัง',categories:['places','buildings'],meaning:{kind:'place',countability:'count',locationPrepositions:['at','in'],actionContexts:['destination','cleanable','sleep-inside','paintable','depictable','visitable']}},
 {singular:'room',plural:'rooms',thai:'ห้อง',classifierThai:'ห้อง',categories:['places'],meaning:{kind:'place',countability:'count',locationPrepositions:['in'],actionContexts:['destination','cleanable','sleep-inside','paintable']}},
 {singular:'food',thai:'อาหาร',categories:['food'],meaning:{kind:'physical-object',countability:'mass',actionContexts:['food','purchasable','carryable','cookable']}},
 {singular:'rice',thai:'ข้าว',categories:['food'],meaning:{kind:'physical-object',countability:'mass',actionContexts:['food','purchasable','carryable','cookable']}},
 {singular:'bread',thai:'ขนมปัง',categories:['food'],meaning:{kind:'physical-object',countability:'mass',actionContexts:['food','purchasable','holdable','carryable','cuttable']}},
 {singular:'milk',thai:'นม',categories:['food'],meaning:{kind:'physical-object',countability:'mass',actionContexts:['drink','purchasable','carryable']}},
 {singular:'money',thai:'เงิน',categories:['everyday'],meaning:{kind:'physical-object',countability:'mass',actionContexts:['holdable','carryable','findable','usable']}},
 {singular:'car',plural:'cars',thai:'รถยนต์',classifierThai:'คัน',categories:['transport'],meaning:{kind:'physical-object',countability:'count',actionContexts:['drivable','washable','cleanable','usable','findable','purchasable','watchable','spatial-target','repairable','depictable']}},
]
export const expandedEverydayCatalogue:readonly ClassroomWord[]=expandedEverydayObjects.flatMap(item=>[
 {...item,word:item.singular,number:'singular' as const},
 ...(item.plural?[{...item,word:item.plural,number:'plural' as const}]:[]),
])
export const expandedPeopleWords=['brother','sister','friend','child','person','family'] as const
export const expandedVocabularyOrder=[...expandedPeopleWords,...expandedEverydayObjects.map(item=>item.singular)]
export function expandedVocabularyIcon(word:string){
 const object=expandedEverydayObjects.find(item=>item.singular===word||item.plural===word)
 const name=object?.singular??word
 return expandedVocabularyOrder.includes(name)?`/classroom/icons/everyday/expanded/${name}.png`:undefined
}
