import type {BeVerb,ClassroomWord,Determiner} from '../sentenceMatrix/model'
import {validateSentence,type BlueprintId,type SentenceRequest} from './blueprints'
const nounVerb=(noun:ClassroomWord)=>noun.number==='plural'||noun.pairOnly?'are':'is'
/** Forward selection: the sentence request determines which noun senses fit. */
export function nounsForSentence(request:Omit<SentenceRequest,'noun'|'verb'> & {verb?:string},words:readonly ClassroomWord[]){
 return words.filter(noun=>!validateSentence({...request,noun,verb:request.verb??nounVerb(noun)}).length)
}
/** Reverse selection: discover the constructions this word can participate in. */
export function blueprintsForNoun(noun:ClassroomWord):BlueprintId[]{
 return (['where-noun','person-at-place'] as const).filter(blueprint=>!validateSentence({blueprint,noun,verb:blueprint==='where-noun'?nounVerb(noun):'am',determiner:'the',subject:{word:'I',thai:'ฉัน',person:1}}).length)
}
/** A verb change is offered only when its authored noun counterpart also passes the rules. */
export function agreeingNoun(noun:ClassroomWord,verb:BeVerb,words:readonly ClassroomWord[],determiner:Determiner='the'){
 const plural=verb==='are'||verb==='were'
 if(noun.pairOnly&&!plural)return undefined
 const target=(plural?noun.plural:noun.singular)??noun.word
 return words.find(candidate=>candidate.word===target&&!validateSentence({blueprint:'where-noun',noun:candidate,verb,determiner}).length)
}
