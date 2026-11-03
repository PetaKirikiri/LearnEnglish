import {subjectPronouns} from './subjectEngine'
import ExampleLanguage from './ExampleView'
import type {MatrixSettings} from './model'
import type {WordScores} from '../wordProgress/model'
import type {MatrixLayoutRequest} from './MatrixLayout'
import ProperNounIcon from './ProperNounIcon'
import PronounIcon from './PronounIcon'
import VocabularyPicture from '../VocabularyPicture'
import WordSlotIcon from './WordSlotIcon'
import {ActionIcon} from './ActionVocabularyIcon'

export type LanguageRole = 'question'|'be'|'person'|'action'|'object'|'determiner'|'preposition'|'person-determiner'
export type LanguageDocument = {
  english:string
  thai:string
  construction:'question'|'noun-phrase'|'location-answer'|'action-question'|'action-answer'
  units:readonly {english:string;thai:string;role:LanguageRole}[]
}
/** A transportable presentation request. User scores are injected by the authenticated consumer. */
export type QuadrantRequest = {
  document:LanguageDocument
  presentation?:MatrixSettings & {size?:'classroom'|'phone'|'compact'}
}
const slots:Record<LanguageRole,number>={question:0,preposition:0,be:1,action:1,determiner:2,'person-determiner':2,person:3,object:3}
export function quadrantLayout(document:LanguageDocument):MatrixLayoutRequest {
 const {construction,units}=document
 if(!units.length||units.map(u=>u.english).join(' ')!==document.english)throw new Error('Quadrant source and aligned units must match')
 if(units.some(u=>!(u.role in slots)||!u.english.trim()))throw new Error('Unsupported quadrant role')
 // A determiner is never folded into a noun card.
 if(units.some(u=>['person','object'].includes(u.role)&&/^(a|an|the|my|your|his|her|our|their)\s/i.test(u.english)))throw new Error('Determiners require their own unit')
 const roles=units.map(u=>u.role)
 if(construction==='noun-phrase'){
  if(roles.join(',')!=='determiner,object')throw new Error('Unsupported noun phrase')
  return {construction,noun:'phrase'}
 }
 if(construction==='question'){
  if(!['question,be,determiner,object','question,be,person'].includes(roles.join(',')))throw new Error('Unsupported location question')
  return {construction,noun:roles.includes('determiner')?'phrase':'single'}
 }
 if(construction==='location-answer'){
  if(roles.join(',')!=='person,be,preposition,determiner,object')throw new Error('Unsupported location answer')
  return {construction,noun:'phrase'}
 }
 if(!['action-question','action-answer'].includes(construction))throw new Error('Unsupported construction')
 const subject='(?:person|person-determiner,person)'
 const expected=construction==='action-question'?new RegExp(`^question,be,${subject},action$`):new RegExp(`^${subject},be,action(?:,preposition)?(?:,determiner)?,object$|^${subject},be,action$`)
 if(!expected.test(roles.join(',')))throw new Error('Unsupported action structure')
 const hasObject=roles.includes('object'),hasDeterminer=roles.includes('determiner')
 return {construction,noun:hasDeterminer?'phrase':'single',actionComplement:hasObject,
 leadingCount:hasObject?roles.indexOf('object')-(hasDeterminer?1:0)-roles.filter(r=>r==='person-determiner').length:undefined,
 nounGroups:roles.flatMap((role,index)=>role==='person-determiner'?[{start:index,end:index+2}]:[])}
}
function roleIcon(unit:LanguageDocument['units'][number],construction:LanguageDocument['construction']){
 const word=unit.english.replace(/[?.!]$/,'')
 if(unit.role==='person')return subjectPronouns.some(subject=>subject.word.toLowerCase()===word.toLowerCase())?<PronounIcon word={word}/>:word==='Bia'?<ProperNounIcon word={word}/>:<VocabularyPicture word={word}/>
 if(unit.role==='object')return <VocabularyPicture word={word}/>
 if(unit.role==='action')return construction==='action-question'?<img className="cw-game-icon" src="/classroom/icons/constructions/doing.png" alt=""/>:<ActionIcon word={word}/>
 if(unit.role==='question'&&word.toLowerCase()==='what')return <img className="cw-game-icon" src="/classroom/icons/constructions/what.png" alt=""/>
 return <WordSlotIcon word={word} slot={slots[unit.role]} plural={word==='are'||word==='were'} past={word==='was'||word==='were'}/>
}
export default function LanguageQuadrant({request,scores={}}:{request:QuadrantRequest;scores?:WordScores}){
 const {document,presentation={}}=request
 const geometry=presentation.size==='phone'?{density:'content' as const,maxWidth:600}:presentation.size==='compact'?{density:'compact' as const,maxWidth:800}:{density:'comfortable' as const,maxWidth:1100}
 const settings={...presentation,layout:{...geometry,...presentation.layout}}
 return <ExampleLanguage matrix english={document.english} thai={document.thai} units={document.units}
  layout={quadrantLayout(document)} semanticSlots={document.units.map(u=>slots[u.role])} settings={settings} scores={scores}
  slotDetails={document.units.map(unit=>({label:'',count:0,icon:roleIcon(unit,document.construction)}))}/>
}
