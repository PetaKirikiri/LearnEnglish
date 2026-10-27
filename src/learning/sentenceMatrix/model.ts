export type ClassroomWord = { word:string; thai:string; singular?:string; plural?:string; number?:'singular'|'plural'; pairOnly?:boolean }
export type Determiner = 'the' | 'my' | 'your'
export type MatrixSettings = {
  /** Open a word's educational window by pressing its card. */
  explanations?: boolean
  /** Show the inline dropdown/carousel controls. */
  wordPicker?: boolean
  /** Allow changing words inside the educational window. */
  explanationSelection?: boolean
  audio?: boolean
}
export type MatrixLesson = {
  id: string
  vocabulary: readonly ClassroomWord[]
  plural: boolean
  settings?: MatrixSettings
  initialOwner?: Determiner
  initialWord: string
  audio?: (word: string, owner: Determiner, verb: 'is'|'are') => string
}
export const determiners = [
  {word:'the',thai:'ที่กำลังพูดถึง'}, {word:'my',thai:'ของฉัน'}, {word:'your',thai:'ของคุณ'},
] as const
export const ownerThai = (owner: Determiner) => determiners.find(item=>item.word===owner)!.thai
export const verbForWord = (word:ClassroomWord): 'is'|'are' => word.number === 'plural' ? 'are' : 'is'
export function formForVerb(word:ClassroomWord,verb:'is'|'are') {return (verb==='are'?word.plural:word.singular) ?? word.word}
export function locationSentence(item: ClassroomWord, owner: Determiner = 'the', count = '') {
  const verb = verbForWord(item)
  return { english: `Where ${verb} ${owner} ${item.word}?`, thai: `${item.thai}${count}${owner==='the'?'':ownerThai(owner)}อยู่ที่ไหน`,
    units: [{english:'Where',thai:'ที่ไหน'}, {english:verb,thai:'อยู่'}, {english:owner,thai:ownerThai(owner)}, {english:`${item.word}?`,thai:item.thai}], noun:item.word, verb }
}

export function compactLocationTranslation(parts: readonly (readonly [string,string])[]) {
  const owner = parts[2][0] as Determiner
  return locationSentence({word:parts[3][0],thai:parts[3][1],number:parts[1][0]==='are'?'plural':'singular'},owner).thai
}
