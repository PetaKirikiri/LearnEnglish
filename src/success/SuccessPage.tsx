import { useEffect, useState } from 'react'
import Icon from '../ui/Icon'
import { successCourse, successLessons } from './course'
import { HotelLesson } from '../hotel/HotelPage'
import { lessonPractice } from './practice'
import SuccessWordHelp from './SuccessWordHelp'
import { speakEnglish, stopEnglishSpeech } from '../learning/speech'
import '../padel/padel.css'
import './success.css'

export default function SuccessPage() {
  const preview = import.meta.env.DEV && /^\/success\/preview(?:\/content)?\/?$/.test(window.location.pathname)
  const content = preview && /\/content\/?$/.test(window.location.pathname)
  const path = preview ? '/success/preview' : '/success'
  const selectedLesson=successLessons.find(l=>String(l.number)===new URLSearchParams(window.location.search).get('lesson'))
  const [playing,setPlaying]=useState<string|null>(null)
  const [audioError,setAudioError]=useState(false)
  useEffect(()=>{document.title='Success · English';return stopEnglishSpeech},[])

  // Authoring/practice preview only; this does not invent an anonymous
  // production account or reuse another course's progress.
  return <main className="success-course padel-practice-clay">
    <header>
      <a className="success-course-brand" href={path}>{successCourse.name}</a>
      {preview ? <nav aria-label="Success tools">
        <a href={path} aria-label="Practice" aria-current={!content?'page':undefined}><Icon name="play" /></a>
        <a href="/success/preview/content" aria-current={content?'page':undefined}>Content</a>
      </nav> : null}
    </header>
    <section>
      {content ? <>
        {successLessons.map(lesson=><div key={lesson.id} className="success-lesson-content">
          <h1>Lesson {lesson.number} · {lesson.title} <span>{lesson.questions.length}</span></h1>
          <ol className="success-content-grid" aria-label={`Lesson ${lesson.number} content`}>
            {lesson.questions.map((q,i)=><li key={q.id} className="success-content-card" aria-label={q.english}>
              <div className="success-card-controls"><span className="success-card-number">{i+1}</span>
              <button className="success-audio" aria-label={`Play ${q.english}`} aria-pressed={playing===q.id} onClick={()=>{
                if(playing===q.id){stopEnglishSpeech();setPlaying(null);return}
                setAudioError(false);setPlaying(q.id);speakEnglish(q.english,q.audioUrl,state=>{
                  if(state!=='playing')setPlaying(null)
                  if(state==='blocked')setAudioError(true)
                })
              }}><Icon name="sound"/></button></div>
              <SuccessWordHelp question={q}/>
              <p className="success-card-translation" lang="th">{q.answers[q.correct][0].text}</p>
              <details className="success-card-alternative"><summary>Other option</summary><span lang="th">{q.answers[1-q.correct][0].text}</span></details>
            </li>)}
          </ol>
          <a className="success-lesson-link" href={`${path}?lesson=${lesson.number}`}>Practice lesson {lesson.number} <Icon name="arrow"/></a>
        </div>)}
        {audioError?<p role="alert">Could not play audio. Tap to retry.</p>:null}
      </> : preview && selectedLesson ? <HotelLesson key={selectedLesson.id} userId="local-success-preview" course={practiceCourses[selectedLesson.id]}/> : <>
        <h1>Lessons</h1>
        {successLessons.map(lesson=>preview?<a className="success-lesson-link" key={lesson.id} href={`${path}?lesson=${lesson.number}`}>
          <span>Lesson {lesson.number} · {lesson.title}</span><Icon name="arrow"/>
        </a>:<p key={lesson.id}>Lesson {lesson.number} · {lesson.title}</p>)}
      </>}
    </section>
  </main>
}

const practiceCourses=Object.fromEntries(successLessons.map(lesson=>[lesson.id,{
  ...lessonPractice(lesson),WordHelp:SuccessWordHelp,presentation:'clay' as const,
}]))
