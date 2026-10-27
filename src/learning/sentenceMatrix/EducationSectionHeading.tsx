import type { ReactNode } from 'react'
import './educationSection.css'

/** One heading treatment for every section of the shared education view. */
export default function EducationSectionHeading({id,icon,children,actions}:{id?:string;icon:'usage'|'sound'|'words';children:ReactNode;actions?:ReactNode}) {
 return <header className="cw-education-heading">
  <span className="cw-education-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
   {icon==='usage'?<><path d="M12 5v15M3 4c4-1 6 0 9 2 3-2 5-3 9-2v14c-4-1-6 0-9 2-3-2-5-3-9-2Z"/></>:icon==='sound'?<path d="M4 10v4m5-8v12m6-15v18m5-11v4"/>:<><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></>}
  </svg></span>
  <h2 id={id}>{children}</h2>
  {actions&&<div className="cw-education-actions">{actions}</div>}
 </header>
}
