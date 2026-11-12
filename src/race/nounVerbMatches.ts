import {subjectCanPerform} from '../learning/sentenceRules/actionSemantics'
import {actionVocabulary,actionConstruction,objectsForAction} from '../learning/sentenceRules/actionDialogue'
import {meaningForWord} from '../learning/sentenceRules/blueprints'
import {verbGroupForAction,type VerbGroup} from '../learning/sentenceRules/verbGroups'
import {numberItem} from './numberCatalogue'
import {nounGroupFor} from './nounGroups'
export type NounVerbMatch={word:string;label:string;group:VerbGroup}
const cache=new Map<string,NounVerbMatch[]>()
/** Read the same reviewed subject/object frames used to compose practice. */
export function nounVerbMatches(word:string):readonly NounVerbMatch[]{
 const saved=cache.get(word);if(saved)return saved
 const item=numberItem(word);if(!item)return []
 const subject=nounGroupFor(item)==='subjects',catalogue=[item],matches:NounVerbMatch[]=[]
 for(const action of actionVocabulary){
  if(subject){
   if(actionConstruction.subjectKind!==meaningForWord(item)?.kind||!subjectCanPerform({word:item.word},action.word))continue
   matches.push({word:action.word,label:action.word,group:verbGroupForAction(action)})
  }else{
   if(objectsForAction(action.word,catalogue).length)matches.push({word:action.word,label:action.complement==='destination'?`${action.word} to`:action.preposition?`${action.spoken??action.word} ${action.preposition.english}`:action.word,group:verbGroupForAction(action)})
   if(action.destination&&action.complement!=='destination'&&objectsForAction(action.word,catalogue,'destination').length)matches.push({word:action.word,label:`${action.word} to`,group:'intransitive'})
  }
 }
 cache.set(word,matches);return matches
}
