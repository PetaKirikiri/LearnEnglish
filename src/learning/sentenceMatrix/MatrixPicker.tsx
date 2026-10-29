import type { Ref } from 'react'
/** Every changeable slot uses the same anchored, accessible selector. */
export default function MatrixPicker({label,expanded,controls,onClick,buttonRef,slot,role}:{
  label:string;expanded:boolean;controls:string;onClick:()=>void;buttonRef?:Ref<HTMLButtonElement>;slot?:number;role?:string
}) {
  return <button ref={buttonRef} type="button" className="cw-slot-picker" data-picker-slot={slot} data-word-role={role} aria-label={label} aria-expanded={expanded} aria-controls={controls} onClick={onClick}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
  </button>
}
