import type { SubjectModeConfig } from './subjectEngine'
import type { VocabularyCategory } from './vocabularyCategories'
export type ClassroomWord = { word:string; thai:string; singular?:string; plural?:string; number?:'singular'|'plural'; pairOnly?:boolean; categories?:readonly VocabularyCategory[]; meaning?:import('../sentenceRules/blueprints').WordMeaning }
export type Determiner = 'the' | 'my' | 'your' | 'his' | 'her'
export type BeVerb = 'is' | 'are' | 'was' | 'were'
export type Tense = 'present' | 'past'
export const isPluralVerb = (verb:BeVerb) => verb==='are'||verb==='were'
export const tenseForVerb = (verb:BeVerb):Tense => verb==='was'||verb==='were'?'past':'present'
export type MatrixSettings = import('../wordProgress/model').FadeSettings & {
  /** Persist assessed answers independently from visual support. */
  trackWords?: boolean
  /** Open a word's educational window by pressing its card. */
  explanations?: boolean
  /** Show the inline dropdown/carousel controls. */
  wordPicker?: boolean
  /** Allow changing words inside the educational window. */
  explanationSelection?: boolean
  /** Shared geometry for all sentence constructions and word modes. */
  layout?: { density?: 'comfortable' | 'compact' | 'content'; maxWidth?: number }
  audio?: boolean
}
export type MatrixLesson = {
  id: string
  pattern?: 'people-location'
  subjectModes?: SubjectModeConfig
  vocabulary: readonly ClassroomWord[]
  plural: boolean
  past?: boolean
  owners?: readonly Determiner[]
  initialTense?: Tense
  settings?: MatrixSettings
  initialOwner?: Determiner
  initialWord: string
  audio?: (word: string, owner: Determiner, verb: BeVerb) => string | undefined
}
export const determiners = [
  {word:'the',thai:'ที่กำลังพูดถึง'}, {word:'my',thai:'ของฉัน'}, {word:'your',thai:'ของคุณ'},
] as const
export const allDeterminers = [...determiners,{word:'his',thai:'ของเขา (ผู้ชาย)'},{word:'her',thai:'ของเธอ (ผู้หญิง)'}] as const
export const lessonDeterminers = (lesson:MatrixLesson) => allDeterminers.filter(item=>(lesson.owners ?? ['the','my','your']).includes(item.word))
export const lessonVerbs = (lesson:MatrixLesson):{word:BeVerb;thai:string}[] => [
 {word:'is' as const,thai:'หนึ่งสิ่ง · ตอนนี้'},
 ...(lesson.plural?[{word:'are' as const,thai:'หลายสิ่ง · ตอนนี้'}]:[]),
 ...(lesson.past?[{word:'was' as const,thai:'หนึ่งสิ่ง · ก่อนหน้านี้'},...(lesson.plural?[{word:'were' as const,thai:'หลายสิ่ง · ก่อนหน้านี้'}]:[])]:[]),
]
export const ownerThai = (owner: Determiner) => allDeterminers.find(item=>item.word===owner)!.thai
export const verbForWord = (word:ClassroomWord): 'is'|'are' => word.number === 'plural' || word.pairOnly ? 'are' : 'is'
export function formForVerb(word:ClassroomWord,verb:BeVerb) {return (isPluralVerb(verb)?word.plural:word.singular) ?? word.word}
export function locationSentence(item: ClassroomWord, owner: Determiner = 'the', count = '', tense:Tense='present') {
  const present = verbForWord(item)
  const verb:BeVerb = tense==='past'?(present==='are'?'were':'was'):present
  return { english: `Where ${verb} ${owner} ${item.word}?`, thai: `${tense==='past'?'ก่อนหน้านี้ ':''}${item.thai}${count}${owner==='the'?'':ownerThai(owner)}อยู่ที่ไหน`,
    units: [{english:'Where',thai:'ที่ไหน'}, {english:verb,thai:tense==='past'?'อยู่ · ก่อนหน้านี้':'อยู่'}, {english:owner,thai:ownerThai(owner)}, {english:`${item.word}?`,thai:item.thai}], noun:item.word, verb }
}

export function compactLocationTranslation(parts: readonly (readonly [string,string])[]) {
  const owner = parts[2][0] as Determiner
  return locationSentence({word:parts[3][0],thai:parts[3][1],number:isPluralVerb(parts[1][0] as BeVerb)?'plural':'singular'},owner,'',tenseForVerb(parts[1][0] as BeVerb)).thai
}
