import {descriptions,everydayPeople} from '../everydayVocabulary'
import type {ClassroomWord} from '../sentenceMatrix/model'
export function adjectiveFitsNoun(adjective:string,noun:string|ClassroomWord){
 const description=descriptions.find(item=>item.word===adjective.toLowerCase())
 if(!description)return false
 const word=(typeof noun==='string'?noun:noun.singular??noun.word).toLowerCase().replace(/[?.!]$/,'')
 const person=everydayPeople.find(person=>person.singular===word||person.plural===word)
 const forms=[word,person?.singular,word.endsWith('s')?word.slice(0,-1):'',word.endsWith('es')?word.slice(0,-2):'',word.endsWith('ies')?word.slice(0,-3)+'y':'']
 return forms.some(form=>!!form&&(description.nouns as readonly string[]).includes(form))
}
export function adjectivesForNoun(noun:string|ClassroomWord){return descriptions.filter(description=>adjectiveFitsNoun(description.word,noun))}
export function adjectiveThaiForNoun(adjective:string,noun:string|ClassroomWord){
 const description=descriptions.find(item=>item.word===adjective)
 if(!description)return ''
 const word=typeof noun==='string'?noun:noun.singular??noun.word
 return description.group==='height'?(word.startsWith('bottle')?'ทรง':'ตัว')+description.thai:description.thai
}
