import {matchingActionBlueprint,activeActionBlueprints,type ActionBlueprint} from './actionBlueprints'
import {actionVocabulary,type Action} from './actionDialogue'
export type VerbGroup='transitive'|'intransitive'
/** Classifies the reviewed use, not whether the spelling can ever take an object. */
export const verbGroupForAction=(action:Action):VerbGroup=>action.complement==='object'?'transitive':'intransitive'
export function verbGroupFor(word:string):VerbGroup{
 const action=actionVocabulary.find(item=>item.word===word)
 if(!action)throw new Error(`Unreviewed verb frame: ${word}`)
 return verbGroupForAction(action)
}
export function verbsForGroup(group:VerbGroup){return actionVocabulary.filter(action=>verbGroupForAction(action)===group)}

export const actionWordForSurface=(word:string)=>actionVocabulary.find(action=>action.spoken===word)?.word??word

export function verbAvailableForBlueprints(word:string,blueprints:readonly ActionBlueprint[]=activeActionBlueprints){const action=actionVocabulary.find(item=>item.word===word);return !!action&&!!matchingActionBlueprint(action,blueprints)}
