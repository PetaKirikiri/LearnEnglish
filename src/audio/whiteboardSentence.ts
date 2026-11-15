import {quadrantLayout,type LanguageDocument} from '../learning/sentenceMatrix/quadrantLayout'
import {generatedNumberCatalogue} from '../race/numberCatalogue'
import {actionVocabulary} from '../learning/sentenceRules/actionDialogue'
import {allDeterminers} from '../learning/sentenceMatrix/model'
import {subjectPronouns} from '../learning/sentenceMatrix/subjectEngine'
import {defaultPersonNames,defaultPlaceNames} from '../learning/sentenceRules/nominalReferences'
import {descriptions} from '../learning/everydayVocabulary'
import {wordTokens} from '../learning/wordProgress/model'
const vocabulary=new Set([
 ...generatedNumberCatalogue,...actionVocabulary,...allDeterminers,...subjectPronouns,...defaultPersonNames,...defaultPlaceNames,...descriptions,
].flatMap(item=>wordTokens(item.word)))
for(const word of wordTokens('What Where Who am is are was were doing to at from with in on over there this that these those me him her us them it'))vocabulary.add(word)
/** The existing matrix grammar and reviewed vocabulary bound paid whiteboard audio. */
export function canonicalWhiteboardSentence(input:unknown):LanguageDocument|undefined{
 try{
  if(!input||typeof input!=='object'||JSON.stringify(input).length>6000)return
  const doc=input as LanguageDocument
  if(typeof doc.english!=='string'||doc.english.length>240||!Array.isArray(doc.units)||!doc.units.length||doc.units.length>14)return
  quadrantLayout(doc)
  const words=wordTokens(doc.english)
  if(!words.length||!words.every(word=>vocabulary.has(word)))return
  return doc
 }catch{return undefined}
}
