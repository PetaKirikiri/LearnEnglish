import type {ReactNode} from 'react'
import {requestedLesson,UnsupportedLessonError,type LessonNumber} from './lessonRequests'
export default function LessonRequest({children}:{children:(number:LessonNumber)=>ReactNode}) {
 let number:LessonNumber
 try { number=requestedLesson(location.search) }
 catch(error) { if(!(error instanceof UnsupportedLessonError))throw error; return <main role="alert"><p>{error.message}</p><a href="/english/notes?lesson=1">Choose a lesson</a></main> }
 return children(number)
}
