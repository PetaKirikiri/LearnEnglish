import type { NounForms } from '../src/learning/wordInfo/types'
// Teaching combinations, not observed corpus frequencies. Keep agreement paired.
export function nounUsageFrames(word:string,nouns:readonly NounForms[]) {
 const frames:Array<{word:string;before:string[];after:string[];source:'teaching'}>=[]
 for(const noun of nouns) {
  if(!['countable','both'].includes(noun.countability)||noun.singular==='wood'||(word!==noun.singular&&word!==noun.plural))continue
  frames.push({word:noun.singular,before:['the','my','your','this'],after:['is','was'],source:'teaching'})
  if(noun.plural)frames.push({word:noun.plural,before:['the','my','your','these'],after:['are','were'],source:'teaching'})
 }
 return frames.filter((frame,i,all)=>all.findIndex(other=>JSON.stringify(other)===JSON.stringify(frame))===i)
}
