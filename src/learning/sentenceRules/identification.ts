import {possessiveFor} from './possessives'
import {referencePhrase,type NominalReference} from './nominalReferences'
import {nounPhraseUnits} from '../sentenceMatrix/nounPhrase'
import {ownerThai,type ClassroomWord,type Determiner} from '../sentenceMatrix/model'
import type {LanguageDocument} from '../sentenceMatrix/LanguageQuadrant'

export const references=[
 {id:'this',word:'this',thai:'นี่',sentenceThai:'นี่คืออะไร',distance:0,plural:false,scene:'this'},
 {id:'that',word:'that',thai:'นั่น',sentenceThai:'นั่นคืออะไร',distance:1,plural:false,scene:'that'},
 {id:'over-there',word:'that over there',thai:'โน่น',sentenceThai:'โน่นคืออะไร',distance:2,plural:false,scene:'over-there'},
 {id:'these',word:'these',thai:'พวกนี้',sentenceThai:'พวกนี้คืออะไร',distance:0,plural:true,scene:'this'},
 {id:'those',word:'those',thai:'พวกนั้น',sentenceThai:'พวกนั้นคืออะไร',distance:1,plural:true,scene:'that'},
] as const
export type ReferenceId=typeof references[number]['id']
export function referenceFor(id:ReferenceId){return references.find(item=>item.id===id)!}
export function identificationQuestion(id:ReferenceId):LanguageDocument{
 const reference=referenceFor(id),verb=reference.plural?'are':'is'
 return {english:`What ${verb} ${reference.word}?`,thai:reference.sentenceThai,construction:'identification-question',units:[
  {english:'What',thai:'อะไร',role:'question'},
  {english:verb,thai:'คือ',role:'be'},
  {english:`${reference.word}?`,thai:reference.thai,role:'reference'},
 ]}
}
export const identificationAudio=(id:ReferenceId)=>`/audio/lesson-six/${id}.wav`

/** Teaching answers use already-taught determiners; listening questions stay unchanged. */
export function identificationAnswer(id:ReferenceId,object:ClassroomWord,owner:Determiner='the',objectReference?:NominalReference):LanguageDocument{
 const reference=referenceFor(id),subject=reference.word.charAt(0).toUpperCase()+reference.word.slice(1),verb=reference.plural?'are':'is'
 const noun=reference.plural?object.plural:object.singular??object.word
 if(!noun)throw new Error('Identification answers require an authored plural noun')
 const phrase=objectReference?referencePhrase({...object,word:noun,number:reference.plural?'plural':'singular'},{noun,nounThai:object.thai,determiner:possessiveFor(owner)??{english:owner,thai:ownerThai(owner)}},objectReference):{noun,nounThai:object.thai,determiner:possessiveFor(owner)??{english:owner,thai:ownerThai(owner)}}
 const units=[{english:subject,thai:reference.thai,role:'reference' as const},{english:verb,thai:'คือ',role:'be' as const},...nounPhraseUnits(phrase).map(unit=>({...unit,role:unit.role==='noun'?'object' as const:unit.role}))]
 units[units.length-1]={...units[units.length-1],english:units[units.length-1].english+'.'}
 return {english:units.map(unit=>unit.english).join(' '),thai:`${reference.thai}คือ${phrase.nounThai}${objectReference||owner==='the'?'':ownerThai(owner)}`,construction:'identification-answer',units}

}
