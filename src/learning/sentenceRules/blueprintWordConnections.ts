import type {Frame,Part} from './blueprintCatalogue'
import {actionVocabulary,objectsForAction} from './actionDialogue'
import {actionInBlueprint,activeActionBlueprints} from './actionBlueprints'
import {subjectCanPerform} from './actionSemantics'
import {defaultPersonNames,defaultPlaceNames,namedNouns,objectPronouns} from './nominalReferences'
import {subjectPronouns,subjectVerb,type SubjectWord} from '../sentenceMatrix/subjectEngine'
import {locationWords} from '../sentenceMatrix/peopleLocation'
import {nounGroupFor} from '../../race/nounGroups'
import {generatedNumberCatalogue as nouns} from '../../race/numberCatalogue'
import {nounsForSentence} from './choices'
export type WordConnection={word:string;form:'noun phrase'|'pronoun'|'proper noun'|'word';subject?:SubjectWord}
export type ConnectionContext={subject?:SubjectWord;verb?:string;object?:string}
/** Uses the same reviewed vocabulary, valency and reference rules as the sentence builder.
 * No learner frontier is applied to this catalogue inspection. */
export function blueprintWordConnections(frame:Frame,part:Part,context:ConnectionContext={}):WordConnection[]{
 const binding=part.binding
 const words=(values:readonly string[]):WordConnection[]=>values.map(word=>({word,form:'word'}))
 if(binding.type==='literal')return words([binding.word])
 if(binding.type==='present-av')return words(context.subject?[subjectVerb(context.subject)]:frame.id.startsWith('identify')?['is','are']:['am','is','are'])
 const actionFrame=activeActionBlueprints.find(item=>item.id===(frame.id==='destination-question'?'intransitive-to-object':frame.id))
 const actions=actionVocabulary.filter(action=>actionFrame&&(frame.id!=='destination-question'||action.destination)&&actionInBlueprint(action,actionFrame)&&(!context.subject||subjectCanPerform(context.subject,action.word,context.object))&&(!context.object||objectsForAction(action.word,nouns,undefined,actionFrame).some(object=>object.noun===context.object)))
 if(binding.type==='action')return words(actions.map(action=>action.spoken??action.word))
 if(binding.accepts==='det:deictic')return ['this','that','these','those'].map(word=>({word,form:'pronoun' as const,subject:{word,thai:'',person:3,number:['these','those'].includes(word)?'plural':'singular'}}))
 const actionSubject=!!actionFrame||frame.id==='activity'
 if(binding.role==='subject'){
  const catalogue=actionSubject?nouns.filter(noun=>nounGroupFor(noun)==='subjects'):nounsForSentence({blueprint:'where-noun',determiner:'the'},nouns)
  const subjects:WordConnection[]=[
   ...catalogue.map(noun=>{const subject:SubjectWord={word:`the ${noun.word}`,thai:noun.thai,number:noun.number,phrase:{noun:noun.word,nounThai:noun.thai,determiner:{english:'the',thai:''}}};return {word:subject.word,form:'noun phrase' as const,subject}}),
   ...subjectPronouns.filter(subject=>!actionSubject||subject.word!=='it').map(subject=>({word:subject.word,form:'pronoun' as const,subject})),
   ...[...defaultPersonNames,...(!actionSubject?defaultPlaceNames:[])].map(subject=>({word:subject.word,form:'proper noun' as const,subject})),
  ]
  return subjects.filter(item=>!context.verb||!item.subject||subjectCanPerform(item.subject,context.verb,context.object))
 }
 let catalogue=nouns
 if(binding.role==='complement'&&context.subject)catalogue=catalogue.filter(noun=>(noun.number==='plural'||!!noun.pairOnly)===(context.subject?.number==='plural'))
 if(binding.role==='location')catalogue=locationWords(nouns) as typeof nouns
 else if(actionFrame){
  const verbs=context.verb?actions.filter(action=>action.word===context.verb):actions
  const compatible=new Set(verbs.flatMap(action=>objectsForAction(action.word,nouns,undefined,actionFrame).map(object=>object.noun)))
  catalogue=nouns.filter(noun=>compatible.has(noun.word))
 }
 const connections:WordConnection[]=catalogue.flatMap(noun=>[
  {word:`the ${noun.word}`,form:'noun phrase' as const},
  ...(binding.role==='location'?[]:objectPronouns(noun).map(word=>({word:word.word,form:'pronoun' as const}))),
  ...namedNouns(noun).filter(word=>binding.role!=='complement'||!context.subject||(word.reference.mode==='name'&&word.reference.name.number==='plural')===(context.subject.number==='plural')).map(word=>({word:word.word,form:'proper noun' as const})),
 ])
 // Location pronouns here/there replace the preposition as well; they cannot fill
 // this blueprint's noun block after a fixed "at".
 if(binding.role==='location')connections.push(...defaultPlaceNames.map(name=>({word:name.word,form:'proper noun' as const})))
 return [...new Map(connections.map(word=>[word.form+':'+word.word,word])).values()]
}
