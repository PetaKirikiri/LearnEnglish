import LessonRequest from '../learning/LessonRequest'
import {lessonId} from '../learning/lessonRequests'
import {createRoot} from 'react-dom/client'
import UniversityClassroom from './UniversityClassroom'
createRoot(document.getElementById('university')!).render(<LessonRequest>{number=>new URLSearchParams(location.search).has('lesson')?<UniversityClassroom requestedLesson={lessonId(number)}/>:<UniversityClassroom/>}</LessonRequest> )
