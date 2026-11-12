import GeneratedPractice from './GeneratedPractice'
import {lessonPracticeTemplate} from './lessonPracticeTemplate'
import {requestedLesson} from '../learning/lessonRequests'
import type {MatrixSettings} from '../learning/sentenceMatrix/model'
/** Compatibility entry point; lessons never supply question packs. */
export default function PracticeCourse(props:{userId?:string;tester?:boolean;settings?:MatrixSettings}){
 return <GeneratedPractice {...props} {...lessonPracticeTemplate(requestedLesson(location.search))}/>
}
