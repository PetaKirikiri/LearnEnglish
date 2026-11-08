import {useEffect,useId,useRef,type ReactNode} from 'react'
import {createPortal} from 'react-dom'
import EducationSectionHeading from '../learning/sentenceMatrix/EducationSectionHeading'
import './practicePatternExplanation.css'

export default function PracticeHelpDialog({title,children,onClose}:{title:string;children:ReactNode;onClose:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null)
 const titleId=useId()
 useEffect(()=>{
  const element=dialog.current
  const previous=document.activeElement instanceof HTMLElement?document.activeElement:null
  element?.showModal()
  const overflow=document.body.style.overflow
  document.body.style.overflow='hidden'
  return()=>{element?.close();document.body.style.overflow=overflow;previous?.focus({preventScroll:true})}
 },[])
 return createPortal(<dialog ref={dialog} className="practice-pattern-dialog classroom" aria-labelledby={titleId} onCancel={event=>{event.preventDefault();onClose()}} onClick={event=>{if(event.target===event.currentTarget)onClose()}}>
  <div className="practice-pattern-panel">
   <EducationSectionHeading id={titleId} icon="usage" actions={<button type="button" className="practice-pattern-close" onClick={onClose} aria-label="ปิดคำอธิบาย"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button>}>{title}</EducationSectionHeading>
   {children}
  </div>
 </dialog>,document.body)
}
