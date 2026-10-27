import type { ClassroomWord } from './model'

export const vocabularyCategories = [
 {id:'clothing',en:'Clothing',th:'เสื้อผ้า'},
 {id:'food',en:'Food',th:'อาหาร'},
 {id:'places',en:'Places',th:'สถานที่'},
 {id:'buildings',en:'Buildings',th:'อาคาร'},
 {id:'everyday',en:'Everyday objects',th:'ของใช้'},
 {id:'furniture',en:'Furniture',th:'เฟอร์นิเจอร์'},
 {id:'sports',en:'Sports',th:'กีฬา'},
 {id:'transport',en:'Transport',th:'ยานพาหนะ'},
 {id:'people',en:'People',th:'ผู้คน'},
] as const
export type VocabularyCategory = typeof vocabularyCategories[number]['id']
const groups:Record<VocabularyCategory,readonly string[]>={
 clothing:['shoe','sock','sandal','boot','shirt','hat','trousers','glasses','bag','watch'],
 food:[],
 places:['hotel','toilet','gym','padel court','clinic','school','bank','bookstore','bedroom'],
 buildings:['hotel','clinic','school','bank','bookstore'],
 everyday:['key','bag','ticket','book','pen','pencil','phone','charger','towel','bottle','cup','plate','watch','clock','remote','fan','air conditioner','glasses'],
 furniture:['table','chair'],sports:['gym','padel court','racket'],transport:['motorbike'],people:['doctor'],
}
/** Explicit authored tags win; known noun forms share their base-word categories. */
export function categoriesForWord(item:ClassroomWord):readonly VocabularyCategory[]{
 if(item.categories)return item.categories
 const base=(item.singular??item.word).toLowerCase()
 return vocabularyCategories.filter(category=>groups[category.id].includes(base)).map(category=>category.id)
}
export const grammaticalNumber=(word:ClassroomWord)=>word.number==='plural'||word.pairOnly?'plural':'singular'
