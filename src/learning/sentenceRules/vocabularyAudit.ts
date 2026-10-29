import type {ClassroomWord} from '../sentenceMatrix/model'
import {meaningForWord,type RuleIssue} from './blueprints'
/** Check authored records against each other, never infer number from a final s. */
export function vocabularyIntegrity(words:readonly ClassroomWord[]):RuleIssue[]{
 const issues:RuleIssue[]=[],seen=new Set<string>()
 for(const word of words){
  const add=(code:string,message:string)=>issues.push({code,slot:'vocabulary',word:word.word,message})
  const key=word.word.toLowerCase().trim()
  if(seen.has(key))add('duplicate-word','Duplicate word in this lesson catalogue.')
  seen.add(key)
  if(!key||!word.thai.trim())add('missing-word-meaning','A word and Thai meaning are required.')
  if(!meaningForWord(word))add('unclassified-meaning','No reviewed semantic classification.')
  if(word.singular&&word.plural&&word.singular!==word.plural){
   if(word.word===word.plural&&word.number!=='plural')add('form-number-mismatch','Authored plural form is not tagged plural.')
   if(word.word===word.singular&&word.number==='plural')add('form-number-mismatch','Authored singular form is tagged plural.')
   if(word.word!==word.singular&&word.word!==word.plural)add('unknown-word-form','Word matches neither of its authored forms.')
  }
  if(word.pairOnly&&word.number==='singular')add('pair-only-singular','Pair-only nouns cannot use singular agreement in this construction.')
 }
 return issues
}
