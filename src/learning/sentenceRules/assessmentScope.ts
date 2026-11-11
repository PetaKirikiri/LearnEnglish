import {subjectPronouns} from '../sentenceMatrix/subjectEngine'
import type {LanguageDocument} from '../sentenceMatrix/LanguageQuadrant'

// The explorer can show more language than students have been taught to use.
const knownPronouns = new Set<string>(subjectPronouns.map(person=>person.word.toLowerCase()))
const recordedDeterminers = new Set(['the','a','an','my','your','his','her','our','their'])
const taughtPronouns = new Set(['i','you','he','she','we','they'])
export const assessedSubjectPronouns = subjectPronouns.filter(person=>taughtPronouns.has(person.word.toLowerCase()))

// Whole words only: keep “tickets”, “visits”, etc. available. This also catches
// contractions such as “it's”. Teaching/explorer catalogues remain unrestricted.
export const hasUntaughtIt = (english:string):boolean => /\b(?:it|its)\b/i.test(english)

// These are the taught present-action frames. Movement to a destination needs
// its own lesson before that verb, preposition and complement can be assessed.
const actionFrames = {
 bare: ['talking','listening','driving','sleeping','walking','running','playing'],
 object: ['eating','drinking','reading','holding'],
 ownership: ['eating','drinking','reading','holding','opening','washing'],
}
type Units = LanguageDocument['units']
/** Historical recording validation only; assessment callers use taughtActionLine. */
export function recordedActionLine(level:4|5|6, units:Units):boolean {
 if(units.some(unit=>hasUntaughtIt(unit.english)))return false
 const word=(index:number)=>units[index]?.english.toLowerCase().replace(/[?.!]$/,'')
 const roles=units.map(unit=>unit.role)
 // Check every slot: a pronoun can also occur as an object.
 for(const [index,unit] of units.entries()){
  const tokens=word(index).match(/[a-z]+/g)??[]
  if(tokens.some(token=>knownPronouns.has(token)&&!taughtPronouns.has(token)))return false
  if(unit.role==='be'&&!['am','is','are'].includes(word(index)))return false
  if((unit.role==='determiner'||unit.role==='person-determiner')&&!recordedDeterminers.has(word(index)))return false
 }

 // A person can be a pronoun, a name, or a determiner + human noun.
 const shape=roles.join(' ').replace('person-determiner person','person')
 const action=word(roles.indexOf('action'))
 if(level===4)return shape==='question be person action' && word(0)==='what' && action==='doing'
 if(level===6)return shape==='person be action determiner object' && actionFrames.ownership.includes(action)
 if(shape==='person be action')return actionFrames.bare.includes(action)
 return (shape==='person be action object'||shape==='person be action determiner object') && actionFrames.object.includes(action)
}

/** Articles have not been introduced in the current beginner curriculum. */
export const hasUntaughtArticle=(english:string):boolean=>/\b(?:a|an)\b/i.test(english)
export function taughtActionLine(level:4|5|6,units:Units):boolean {
 const earlierActionReview=level===6&&!units.some(unit=>unit.role==='object')&&recordedActionLine(5,units)
 return !units.some(unit=>hasUntaughtArticle(unit.english))&&(recordedActionLine(level,units)||earlierActionReview)
}
