import DistanceScene from './DistanceScene'
import {references} from '../sentenceRules/identification'
import DescriptionPicture from '../DescriptionPicture'
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

export type LanguageRole = 'question'|'be'|'person'|'action'|'object'|'determiner'|'preposition'|'person-determiner'|'description'|'reference'
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
const slots:Record<LanguageRole,number>={question:0,preposition:0,be:1,action:1,determiner:2,'person-determiner':2,person:3,object:3,description:3,reference:3}
export function quadrantLayout(document:LanguageDocument):MatrixLayoutRequest {
 const {construction,units}=document
 if(!units.length||units.map(u=>u.english).join(' ')!==document.english)throw new Error('Quadrant source and aligned units must match')
 if(units.some(u=>!(u.role in slots)||!u.english.trim()))throw new Error('Unsupported quadrant role')
 // A determiner is never folded into a noun card.
 if(units.some(u=>['person','object'].includes(u.role)&&/^(a|an|the|my|your|his|her|our|their)\s/i.test(u.english)))throw new Error('Determiners require their own unit')
 const roles=units.map(u=>u.role)
 if(construction==='identification-question'){
  if(roles.join(',')!=='question,be,reference'||units[0].english!=='What'||!references.some(r=>units[2].english===r.word+'?'&&units[1].english===(r.plural?'are':'is')))throw new Error('Unsupported identification question')
  return {construction,noun:'single'}
 }
 if(construction==='identification-answer'){
  if(roles.join(',')!=='reference,be,determiner,object'||!references.some(r=>units[0].english.toLowerCase()===r.word&&units[1].english===(r.plural?'are':'is')))throw new Error('Unsupported identification answer')
  return {construction,noun:'phrase'}
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
  if(roles.join(',')!=='person,be,preposition,determiner,object')throw new Error('Unsupported location answer')
  return {construction,noun:'phrase'}
 }
 if(!['action-question','action-answer'].includes(construction))throw new Error('Unsupported construction')
 const subject='(?:person|person-determiner,person)'
 const expected=construction==='action-question'?new RegExp(`^question,be,${subject},action$`):new RegExp(`^${subject},be,action(?:,preposition)?(?:,determiner)?(?:,description)?,object$|^${subject},be,action$`)
 if(!expected.test(roles.join(',')))throw new Error('Unsupported action structure')
 const hasObject=roles.includes('object'),hasDeterminer=roles.includes('determiner')
 return {construction,noun:hasDeterminer?'phrase':'single',nounSize:roles.includes('description')?3:undefined,actionComplement:hasObject,
 leadingCount:hasObject?roles.indexOf('object')-(hasDeterminer?1:0)-(roles.includes('description')?1:0)-roles.filter(r=>r==='person-determiner').length:undefined,
 nounGroups:roles.flatMap((role,index)=>role==='person-determiner'?[{start:index,end:index+2}]:[])}
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
 return <ExampleLanguage matrix english={english} thai={document.thai} units={document.units}
  layout={quadrantLayout(document)} semanticSlots={document.units.map(u=>slots[u.role])} settings={settings} scores={scores}
  slotDetails={document.units.map(unit=>({label:'',count:0,icon:languageRoleIcon(unit,document.construction,request.referenceObject)}))}/>
}
