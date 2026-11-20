import {quadrantLayout,type LanguageDocument} from './quadrantLayout'
export {quadrantLayout,type LanguageDocument} from './quadrantLayout'
import {sentenceRoleSlots as slots} from './sentenceRoles'
export type {LanguageRole} from './sentenceRoles'
import DistanceScene from './DistanceScene'
import {references} from '../sentenceRules/identification'
import DescriptionPicture from '../DescriptionPicture'
import {subjectPronouns} from './subjectEngine'
import ExampleLanguage from './ExampleView'
import type {MatrixSettings} from './model'
import {wordOpacity,wordTokens,type WordScores} from '../wordProgress/model'
import ProperNounIcon from './ProperNounIcon'
import PronounIcon from './PronounIcon'
import VocabularyPicture from '../VocabularyPicture'
import WordSlotIcon from './WordSlotIcon'
import {ActionIcon} from './ActionVocabularyIcon'

/** A transportable presentation request. User scores are injected by the authenticated consumer. */
export type QuadrantRequest = {
  document:LanguageDocument
  referenceObject?:string
  presentation?:MatrixSettings & {size?:'classroom'|'phone'|'compact'; emphasis?:readonly string[]}
}
export function languageRoleIcon(unit:LanguageDocument['units'][number],construction:LanguageDocument['construction'],referenceObject?:string){
 const word=unit.english.replace(/[?.!]$/,'')
 if(unit.role==='question' && unit.artwork && 'src' in unit.artwork && ['what','who','where','when','why'].includes(word.toLowerCase())){
  return <span className="cw-game-icon interrogative-picture" aria-hidden="true">
   <span className="thought-clue"><img src={unit.artwork.src} alt="" draggable={false}/>
   </span>
   <img className="learner-question-mark" src="/classroom/icons/constructions/what.png" alt="" draggable={false}/>
   <img className="thinking-learner" src="/classroom/icons/question-deck/asking.webp" alt="" draggable={false}/>
  </span>
 }
 if(unit.artwork)return 'src' in unit.artwork?<img className="cw-game-icon" src={unit.artwork.src} alt="" draggable={false}/>:<strong className="answer-numeral">{unit.artwork.numeral}</strong>
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
