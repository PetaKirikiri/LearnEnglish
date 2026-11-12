import {sentenceRoleSlots as slots,type LanguageRole} from './sentenceRoles'
export type {LanguageRole} from './sentenceRoles'
import {adjectiveFitsNoun} from '../sentenceRules/adjectiveSemantics'
import DistanceScene from './DistanceScene'
import {references} from '../sentenceRules/identification'
import DescriptionPicture from '../DescriptionPicture'
import {subjectPronouns} from './subjectEngine'
import ExampleLanguage from './ExampleView'
import type {MatrixSettings} from './model'
import {wordOpacity,wordTokens,type WordScores} from '../wordProgress/model'
import type {MatrixLayoutRequest} from './MatrixLayout'
import ProperNounIcon from './ProperNounIcon'
import PronounIcon from './PronounIcon'
import VocabularyPicture from '../VocabularyPicture'
import WordSlotIcon from './WordSlotIcon'
import {ActionIcon} from './ActionVocabularyIcon'

export type LanguageDocument = {
  english:string
  thai:string
  construction:'identification-answer'|'identification-question'|'question'|'noun-phrase'|'location-answer'|'action-question'|'action-answer'
  units:readonly {english:string;thai:string;role:LanguageRole}[]
}
/** A transportable presentation request. User scores are injected by the authenticated consumer. */
export type QuadrantRequest = {
  document:LanguageDocument
  referenceObject?:string
  presentation?:MatrixSettings & {size?:'classroom'|'phone'|'compact'; emphasis?:readonly string[]}
}
export function quadrantLayout(document:LanguageDocument):MatrixLayoutRequest {
 const {construction,units}=document
 if(!units.length||units.map(u=>u.english).join(' ')!==document.english)throw new Error('Quadrant source and aligned units must match')
 if(units.some(u=>!(u.role in slots)||!u.english.trim()))throw new Error('Unsupported quadrant role')
 // A determiner is never folded into a noun card.
 if(units.some(u=>['person','object'].includes(u.role)&&/^(a|an|the|my|your|his|her|our|their)\s/i.test(u.english)))throw new Error('Determiners require their own unit')
 const roles=units.map(u=>u.role)
 for(const [index,unit] of units.entries())if(unit.role==='description'){const noun=units[index+1];if(!noun||!['person','object'].includes(noun.role)||!adjectiveFitsNoun(unit.english,noun.english))throw new Error('This adjective does not fit the noun.')}
 const objectIndex=roles.indexOf('object'),objectDescription=objectIndex>=1&&roles[objectIndex-1]==='description'
 const nounGroups=roles.flatMap((role,index)=>role==='person-determiner'?[{start:index,end:index+(roles[index+1]==='description'?3:2)}]:[])
 const collapsedSubjectCards=nounGroups.reduce((total,group)=>total+group.end-group.start-1,0)
 if(construction==='identification-question'){
  if(roles.join(',')!=='question,be,reference'||units[0].english!=='What'||!references.some(r=>units[2].english===r.word+'?'&&units[1].english===(r.plural?'are':'is')))throw new Error('Unsupported identification question')
  return {construction,noun:'single'}
 }
 if(construction==='identification-answer'){
  if(!/^reference,be,(?:determiner,)?object$/.test(roles.join(','))||!references.some(r=>units[0].english.toLowerCase()===r.word&&units[1].english===(r.plural?'are':'is')))throw new Error('Unsupported identification answer')
  return {construction,noun:roles.includes('determiner')?'phrase':'single'}
 }
 if(construction==='noun-phrase'){
  if(!/^determiner,(?:description,)?object$/.test(roles.join(',')))throw new Error('Unsupported noun phrase')
  return {construction,noun:'phrase',nounSize:roles.includes('description')?3:2}
 }
 if(construction==='question'){
  if(!/^question,be,(?:determiner,(?:description,)?object|person)$/.test(roles.join(',')))throw new Error('Unsupported location question')
  return {construction,noun:roles.includes('determiner')?'phrase':'single',nounSize:roles.includes('description')?3:undefined}
 }
 if(construction==='location-answer'){
  if(!/^(?:person|person-determiner,(?:description,)?person),be,(?:preposition,)?(?:determiner,)?(?:description,)?object$/.test(roles.join(',')))throw new Error('Unsupported location answer')
  const hasDeterminer=roles.includes('determiner')
  return {construction,noun:hasDeterminer?'phrase':'single',nounSize:objectDescription?3:undefined,leadingCount:objectIndex-(hasDeterminer?1:0)-(objectDescription?1:0)-collapsedSubjectCards,nounGroups}
 }
 if(!['action-question','action-answer'].includes(construction))throw new Error('Unsupported construction')
 const subject='(?:person|person-determiner,(?:description,)?person)'
 const expected=construction==='action-question'?new RegExp(`^question,be,${subject},action$`):new RegExp(`^${subject},be,action(?:,preposition)?(?:,determiner)?(?:,description)?,object$|^${subject},be,action$`)
 if(!expected.test(roles.join(',')))throw new Error('Unsupported action structure')
 const hasObject=roles.includes('object'),hasDeterminer=roles.includes('determiner')
 return {construction,noun:hasDeterminer?'phrase':'single',nounSize:objectDescription?3:undefined,actionComplement:hasObject,
 leadingCount:hasObject?roles.indexOf('object')-(hasDeterminer?1:0)-(objectDescription?1:0)-collapsedSubjectCards:undefined,
 nounGroups}
}
export function languageRoleIcon(unit:LanguageDocument['units'][number],construction:LanguageDocument['construction'],referenceObject?:string){
 const word=unit.english.replace(/[?.!]$/,'')
 if(unit.role==='reference'){const reference=references.find(r=>r.word===word.toLowerCase());return reference?<DistanceScene compact reference={reference.id} word={referenceObject}/>:null}
 if(unit.role==='description')return <DescriptionPicture word={word}/>
 if(unit.role==='person')return subjectPronouns.some(subject=>subject.word.toLowerCase()===word.toLowerCase())?<PronounIcon word={word}/>:word==='Bia'?<ProperNounIcon word={word}/>:<VocabularyPicture word={word}/>
 if(unit.role==='object')return <VocabularyPicture word={word}/>
 if(unit.role==='action')return construction==='action-question'&&word.toLowerCase()==='doing'?<img className="cw-game-icon" src="/classroom/icons/constructions/doing.png" alt=""/>:<ActionIcon word={word}/>
 if(unit.role==='question'&&word.toLowerCase()==='what')return <img className="cw-game-icon" src="/classroom/icons/constructions/what.png" alt=""/>
 return <WordSlotIcon word={word} slot={slots[unit.role]} plural={word==='are'||word==='were'} past={word==='was'||word==='were'}/>
}
export default function LanguageQuadrant({request,scores={}}:{request:QuadrantRequest;scores?:WordScores}){
 const {document,presentation={}}=request
 const geometry=presentation.size==='phone'?{density:'content' as const,maxWidth:600}:presentation.size==='compact'?{density:'compact' as const,maxWidth:800}:{density:'comfortable' as const,maxWidth:1100}
 const settings={...presentation,layout:{...geometry,...presentation.layout}}
 // Teaching requests can stress a changed word while retaining the original aligned document.
 const english=presentation.emphasis?.length?document.units.map(unit=>{
  const plain=unit.english.replace(/[?.!]$/,'')
  return presentation.emphasis?.some(word=>word.toLowerCase()===plain.toLowerCase())?unit.english.replace(plain,`**${plain}**`):unit.english
 }).join(' '):document.english
 const referenceObject=request.referenceObject??(document.construction==='identification-answer'?document.units.find(unit=>unit.role==='object')?.english.replace(/[?.!]$/,''):undefined)
 const referenceOpacity=settings.fadeMode&&document.construction==='identification-answer'?Math.min(1,...wordTokens(referenceObject??'').map(word=>wordOpacity(word,scores,settings))):1
 return <ExampleLanguage matrix english={english} thai={document.thai} units={document.units}
  layout={quadrantLayout(document)} semanticSlots={document.units.map(u=>slots[u.role])} settings={settings} scores={scores}
  slotDetails={document.units.map(unit=>({label:'',count:0,icon:unit.role==='reference'&&document.construction==='identification-answer'?<span data-reference-artwork style={{opacity:referenceOpacity}}>{languageRoleIcon(unit,document.construction,referenceObject)}</span>:languageRoleIcon(unit,document.construction,referenceObject)}))}/>
}
