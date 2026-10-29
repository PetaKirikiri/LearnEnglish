import {meaningProfiles} from './meaningProfiles'
import type {ClassroomWord} from '../sentenceMatrix/model'
import {categoriesForWord} from '../sentenceMatrix/vocabularyCategories'
import {subjectVerb,type SubjectWord} from '../sentenceMatrix/subjectEngine'
export type MeaningKind='place'|'person'|'physical-object'|'abstract'
export type WordMeaning={kind:MeaningKind;countability?:'count'|'mass'|'plural-only';roles?:readonly 'destination'[];locationPrepositions?:readonly ('at'|'in'|'on')[]}
export type BlueprintId='where-noun'|'where-person'|'person-at-place'
export const sentenceBlueprints={
 'where-noun':{pattern:'Where {be} {determiner} {noun}?',nounKinds:['place','person','physical-object'],agreement:'noun-number'},
 'where-person':{pattern:'Where {be} {subject}?',nounKinds:[],agreement:'subject-person'},
 'person-at-place':{pattern:'{subject} {be} at {determiner} {place}.',nounKinds:['place'],agreement:'subject-person'},
} as const
export type RuleIssue={code:string;slot:string;word:string;message:string}
export type SentenceRequest={blueprint:BlueprintId;noun?:ClassroomWord;subject?:SubjectWord;verb:string;determiner?:string;namedPlace?:boolean}
/** Authored meaning takes precedence; category mappings are explicit, never suffix guesses. */
export function meaningForWord(word:ClassroomWord):WordMeaning|undefined{
 if(word.meaning)return word.meaning
 const reviewed=meaningProfiles[(word.singular??word.word).toLowerCase()]
 if(reviewed)return reviewed
 const categories=categoriesForWord(word)
 if(categories.includes('places')||categories.includes('buildings'))return {kind:'place',locationPrepositions:(word.singular??word.word)==='bedroom'?['in']:['at','in']}
 if(categories.includes('people'))return {kind:'person'}
 if(categories.some(c=>['clothing','food','buildings','everyday','furniture','sports','transport'].includes(c)))return {kind:'physical-object'}
 return undefined
}
export function validateSentence(request:SentenceRequest):RuleIssue[]{
 const issues:RuleIssue[]=[]
 const add=(code:string,slot:string,word:string,message:string)=>issues.push({code,slot,word,message})
 if(request.blueprint==='where-person'||request.blueprint==='person-at-place'){
  if(!request.subject)add('missing-subject','subject','','A subject is required.')
  else if(subjectVerb(request.subject)!==request.verb)add('subject-agreement','verb',request.verb,`${request.subject.word} requires ${subjectVerb(request.subject)}.`)
 }
 if(request.blueprint!=='where-person'){
  const noun=request.noun
  if(!noun)add('missing-noun','noun','','A noun is required.')
  else{
   const meaning=meaningForWord(noun),allowed=sentenceBlueprints[request.blueprint].nounKinds as readonly string[]
   if(!meaning)add('unclassified-meaning','noun',noun.word,'Add a reviewed meaning category before using this word.')
   else if(!allowed.includes(meaning.kind)&&!(request.blueprint==='person-at-place'&&meaning.roles?.includes('destination')))add('incompatible-meaning','noun',noun.word,`${meaning.kind} does not fit ${request.blueprint}.`)
   else if(request.blueprint==='person-at-place'&&!meaning.locationPrepositions?.includes('at'))add('preposition-review','noun',noun.word,'This destination is not approved with at; review its preposition.')
   if(meaning?.countability==='mass'&&(noun.number==='plural'||noun.pairOnly))add('mass-noun-number','noun',noun.word,'This sense is a mass noun; do not create a plural form.')
   if(meaning?.countability==='plural-only'&&noun.number!=='plural'&&!noun.pairOnly)add('plural-only-number','noun',noun.word,'This sense requires plural agreement.')
   if(request.blueprint==='where-noun'){
    const plural=noun.number==='plural'||Boolean(noun.pairOnly)
    if(!['is','are','was','were'].includes(request.verb)||plural!==['are','were'].includes(request.verb))add('noun-agreement','verb',request.verb,`${noun.word} requires a ${plural?'plural':'singular'} verb.`)
   }
  }
  if(request.namedPlace){if(request.determiner)add('proper-name-article','determiner',request.determiner,'This named place does not take a determiner in this blueprint.')}
  else if(!['the','my','your','his','her'].includes(request.determiner??''))add('missing-determiner','determiner',request.determiner??'','Select an approved determiner.')
 }
 return issues
}
export function assertSentence(request:SentenceRequest){
 const issues=validateSentence(request)
 if(issues.length)throw new Error(`${request.blueprint}: ${issues.map(i=>`${i.code} (${i.word}): ${i.message}`).join('; ')}`)
}
