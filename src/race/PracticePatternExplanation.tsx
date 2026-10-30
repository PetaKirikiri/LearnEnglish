import {useEffect,useId,useRef} from 'react'
import {createPortal} from 'react-dom'
import WordUsageVisual from '../learning/sentenceMatrix/WordUsageVisual'
import EducationSectionHeading from '../learning/sentenceMatrix/EducationSectionHeading'
import PronunciationComparison from '../classroom/pronunciation/PronunciationComparison'
import {type NumberPrompt} from './numberFoundation'
import {numberItem} from './numberCatalogue'
import './practicePatternExplanation.css'

/** One pattern explanation for every prompt; the same catalogue drives both forms. */
export default function PracticePatternExplanation({question,module,onClose}:{question:NumberPrompt;module:1|2|3;onClose:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null)
 const titleId=useId()
 const noun=numberItem(question.word)
 useEffect(()=>{
  const element=dialog.current
  const previous=document.activeElement instanceof HTMLElement?document.activeElement:null
  element?.showModal()
  const overflow=document.body.style.overflow
  document.body.style.overflow='hidden'
  return()=>{element?.close();document.body.style.overflow=overflow;previous?.focus({preventScroll:true})}
 },[])
 if(!noun)return null
 const ending=noun.singular&&noun.plural?.startsWith(noun.singular)?noun.plural.slice(noun.singular.length):null
 return createPortal(<dialog ref={dialog} className="practice-pattern-dialog classroom" aria-labelledby={titleId} onCancel={event=>{event.preventDefault();onClose()}} onClick={event=>{if(event.target===event.currentTarget)onClose()}}>
  <div className="practice-pattern-panel">
   <EducationSectionHeading id={titleId} icon="usage" actions={<button type="button" className="practice-pattern-close" onClick={onClose} aria-label="ปิดคำอธิบาย"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button>}>{module===1?'หนึ่งสิ่ง · หลายสิ่ง':'จำนวนกับ is / are'}</EducationSectionHeading>
   <WordUsageVisual item={{...noun,word:question.word,number:question.plural?'plural':'singular'}} showAgreement={module!==1} nounPhrase language="th"/>
   <div className="practice-pattern-ending"><span className="cw-game-icon cw-game-icon-apples" aria-hidden="true"/><span>{noun.pairOnly?'คำนี้ใช้รูปพหูพจน์ แม้มีหนึ่งคู่':'ฟังรูปคำที่เปลี่ยนไป'} {ending&&<strong lang="en">+{ending}</strong>}</span></div>
   <PronunciationComparison word={question.word} allowEdit={false} language="th"/>
  </div>
 </dialog>,document.body)
}
