import type {HotelQuestion} from '../../hotel/course'
import type {ClassroomWord} from '../sentenceMatrix/model'
import {validateSentence,type RuleIssue} from './blueprints'
const normalise=(text:string)=>text.normalize('NFKC').replace(/\s+/g,' ').trim().toLowerCase()
/** Structural and answer integrity checks; no model or dictionary service. */
export function questionIntegrity(question:HotelQuestion):RuleIssue[]{
 const issues:RuleIssue[]=[]
 const add=(code:string,message:string)=>issues.push({code,slot:'question',word:question.id,message})
 if(!question.english.trim())add('empty-prompt','The question needs a prompt.')
 if(!Number.isInteger(question.correct)||question.correct<0||question.correct>=question.answers.length)add('invalid-answer-index','Correct answer is outside the available options.')
 const choices=question.answers.map(answer=>normalise(answer.map(part=>part.text).join(' ')))
 if(choices.some(text=>!text))add('empty-answer','An option is empty.')
 if(new Set(choices).size!==choices.length)add('duplicate-answer','Options have identical displayed text; the answer is ambiguous.')
 return issues
}
export function auditWhereNoun(question:HotelQuestion,catalogue:readonly ClassroomWord[]):RuleIssue[]{
 const match=question.english.match(/^Where\s+(?:(is|are|was|were)\s+)?(?:(the|my|your|his|her)\s+)?(.+)\?$/)
 if(!match)return [{code:'unrecognised-construction',slot:'sentence',word:question.english,message:'No registered where-noun parse matches this prompt.'}]
 const noun=catalogue.find(item=>normalise(item.word)===normalise(match[3]))
 return validateSentence({blueprint:'where-noun',verb:match[1]??'',determiner:match[2],noun})
}
