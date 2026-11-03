import LessonRequest from '../learning/LessonRequest'
import {lessonNumbers,requestedLesson,lessonNumber} from '../learning/lessonRequests'
import { useEffect, useState } from 'react'
import SentenceMatrix from '../learning/sentenceMatrix/SentenceMatrix'
import { classroomMatrices, cumulativeLessonTwoAudio } from './matrixLessons'
import { useLanguage } from './language'
import './mobileNotes.css'

/** Student Notes: the shared teaching engine without the teacher's classroom shell. */
export default function MobileNotes() { return <LessonRequest>{()=> <Notes/>}</LessonRequest> }
function Notes() {
  const [number, setNumber] = useState(()=>requestedLesson(location.search))
  const language = useLanguage()
  useEffect(() => {
    const onBack = () => setNumber(requestedLesson(location.search))
    window.addEventListener('popstate', onBack)
    return () => window.removeEventListener('popstate', onBack)
  }, [])
  useEffect(() => { document.title = `Lesson ${number} · English Success` }, [number])
  const lesson = classroomMatrices[`lesson-${number}` as keyof typeof classroomMatrices]
  function selectLesson(next: string) {
    const url = new URL(window.location.href)
    url.searchParams.set('lesson', next)
    window.history.replaceState(null, '', url)
    setNumber(lessonNumber(next))
    window.scrollTo({ top: 0, behavior: 'instant' })
  }
  return <main className="classroom mobile-notes" aria-label="Lesson notes">
    <div className="mobile-notes-page">
      <nav className="mobile-notes-lessons" aria-label="Choose lesson">
        <span>{language === 'th' ? 'บทเรียน' : 'Lesson'}</span>
        {lessonNumbers.map(value => <button key={value} type="button" aria-label={`Lesson ${value}`} aria-pressed={number === value} onClick={() => selectLesson(value)}>{value}</button>)}
      </nav>
      <div className="cw-sentence-panel mobile-notes-matrix">
        <SentenceMatrix lesson={number === '1' ? {...lesson, audio:cumulativeLessonTwoAudio} : lesson}/>
      </div>
    </div>
  </main>
}
