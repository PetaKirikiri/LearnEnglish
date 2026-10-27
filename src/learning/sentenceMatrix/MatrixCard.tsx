import type { ReactNode } from 'react'
import SentenceSlot from '../SentenceSlot'
export default function MatrixCard({slot,children,action,control,affordance,className='',disabled=false}: {
  slot:number;children:ReactNode;control?:ReactNode;affordance?:ReactNode;className?:string;disabled?:boolean;
  action?:{label:string;expanded?:boolean;controls?:string;onClick:()=>void}
}) {
  const content=<SentenceSlot slot={slot}>{children}</SentenceSlot>
  const card=action ? <button type="button" className={`tonight-slot slot-${slot}${className ? ` ${className}`:''}`} disabled={disabled} aria-label={action.label} aria-expanded={action.expanded} aria-controls={action.controls} onClick={action.onClick}>{content}{affordance}</button> : <span className={`tonight-slot slot-${slot}`}>{content}</span>
  return control ? <span className={`cw-slot-shell cw-slot-shell-${slot}`}>{card}{control}</span> : card
}
