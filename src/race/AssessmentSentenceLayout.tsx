import {createContext, type ReactNode} from 'react'

/** Assessment sentences fit as a whole; the whiteboard keeps its wrapping layout. */
export const AssessmentSentenceContext=createContext(false)
export function AssessmentSentence({children}:{children:ReactNode}){
 return <div className="assessment-sentence-viewport"><div className="assessment-sentence-line">{children}</div></div>
}
