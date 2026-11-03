import LessonRequest from '../learning/LessonRequest'
import {lessonId} from '../learning/lessonRequests'
import Lesson from './lesson'
import {createRoot} from 'react-dom/client'
import UniversityClassroom from './UniversityClassroom'
createRoot(document.getElementById('university')!).render(<LessonRequest>{number=>new URLSearchParams(location.search).has('lesson')?<main className="classroom"><Lesson lessonId={lessonId(number)} page="idea"/></main>:<UniversityClassroom/>}</LessonRequest> )
