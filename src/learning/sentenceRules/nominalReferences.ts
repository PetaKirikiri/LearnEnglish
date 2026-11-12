import type {ClassroomWord} from '../sentenceMatrix/model'
import {subjectPronouns,type SubjectModeConfig,type SubjectWord} from '../sentenceMatrix/subjectEngine'
import {meaningForWord} from './blueprints'
import type {NounPhrase} from '../sentenceMatrix/nounPhrase'
export const defaultPersonNames:readonly SubjectWord[]=[{word:'Bia',thai:'Bia',kind:'person',person:3},{word:'May',thai:'เมย์',kind:'person',person:3}]
export const defaultPlaceNames:readonly SubjectWord[]=[{word:'Central',thai:'เซ็นทรัล',kind:'place'},{word:'Success',thai:'Success',kind:'place'}]
export const defaultSubjectModes:SubjectModeConfig={pronouns:subjectPronouns,names:defaultPersonNames,initialPronoun:'I',initialName:'Bia'}
export type NominalReference={mode:'pronoun';word:string}|{mode:'name';name:SubjectWord}
export type ReferenceChoice=ClassroomWord&{reference:NominalReference}
const plural=(noun:ClassroomWord)=>noun.number==='plural'||!!noun.pairOnly
export function personNames(config?:SubjectModeConfig){const names=config?.names.filter(name=>name.kind==='person')??[];return [...new Map([...names,...defaultPersonNames].map(name=>[name.word,name])).values()]}
export function placeNames(config?:SubjectModeConfig){return [...new Map([...(config?.names.filter(name=>name.kind==='place')??[]),...defaultPlaceNames].map(name=>[name.word,name])).values()]}
export function nounSubjectModes(noun:ClassroomWord,config?:SubjectModeConfig):SubjectModeConfig{
 const human=meaningForWord(noun)?.kind==='person'
 const pronouns=human?(config?.pronouns??subjectPronouns).filter(p=>p.word!=='it'):subjectPronouns.filter(p=>p.word===(plural(noun)?'they':'it'))
 const names=[...personNames(config),...placeNames(config)]
 return {pronouns,names,initialPronoun:human?config?.initialPronoun:pronouns[0]?.word,initialName:names[0]?.word}
}
export function objectPronouns(noun:ClassroomWord,location=false):ReferenceChoice[]{
 const words=location?['here','there']:plural(noun)?['them']:meaningForWord(noun)?.kind!=='person'?['it']:/^(woman|girl|mother|daughter)$/.test(noun.singular??noun.word)?['her']:/^(man|boy|father|son)$/.test(noun.singular??noun.word)?['him']:['him','her']
 const meanings:Record<string,string>={it:'มัน',them:'พวกเขา / สิ่งเหล่านั้น',him:'เขา',her:'เธอ',here:'ที่นี่',there:'ที่นั่น'}
 return words.map(word=>({...noun,word,thai:meanings[word],reference:{mode:'pronoun',word}}))
}
export function namedNouns(noun:ClassroomWord,config?:SubjectModeConfig):ReferenceChoice[]{
 const kind=meaningForWord(noun)?.kind
 const names=kind==='person'?personNames(config):kind==='place'?placeNames(config):[]
 return names.map(name=>({...noun,word:name.word,thai:name.thai,reference:{mode:'name',name}}))
}
/** Resolve a reference only after the blueprint has approved its underlying noun. */
export function referencePhrase(noun:ClassroomWord,phrase:NounPhrase,reference:NominalReference,location=false):NounPhrase{
 if(reference.mode==='name'){
  const kind=meaningForWord(noun)?.kind
  if(!['person','place'].includes(kind??'')||reference.name.kind!==kind||!reference.name.word.trim()||reference.name.phrase||/['’]s\b/.test(reference.name.word))throw new Error('A proper noun must name a compatible person or place directly.')
  return {noun:reference.name.word,nounThai:reference.name.thai,...(phrase.preposition?{preposition:phrase.preposition}:{})}
 }
 const chosen=objectPronouns(noun,location).find(p=>p.word===reference.word)
 if(!chosen)throw new Error('This pronoun does not fit the noun or its grammatical role.')
 return {noun:chosen.word,nounThai:chosen.thai,...(!location&&phrase.preposition?{preposition:phrase.preposition}:{})}
}
