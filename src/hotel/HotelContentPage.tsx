import { useEffect, useState } from 'react'
import { speakEnglish, stopEnglishSpeech } from '../learning/speech'
import { hotelQuestions, skillNames, skills, type HotelQuestion } from './course'
import './hotel-content.css'
import HotelWordHelp from './HotelWordHelp'
import type { ComponentType } from 'react'

type ContentCourse = { questions: readonly HotelQuestion[]; skills: string[]; skillNames: string[]; name: string; WordHelp: ComponentType<Parameters<typeof HotelWordHelp>[0]> }
const hotelContent: ContentCourse = { questions: hotelQuestions, skills, skillNames, name: 'Hotel', WordHelp: HotelWordHelp }

export default function HotelContentPage({ course = hotelContent }: { course?: ContentCourse }) {
  const { questions, skills: courseSkills, skillNames: courseSkillNames, WordHelp: CourseWordHelp } = course
  const [playing, setPlaying] = useState<string | null>(null)
  const [error, setError] = useState('')
  useEffect(() => () => stopEnglishSpeech(), [])

  function play(question: HotelQuestion) {
    setError('')
    if (playing === question.id) {
      stopEnglishSpeech()
      setPlaying(null)
      return
    }
    setPlaying(question.id)
    speakEnglish(question.english, question.audioUrl, state => {
      if (state !== 'playing') setPlaying(null)
      if (state === 'blocked') setError(`Could not play: ${question.english}`)
    })
  }

  return <section className="hotel-content">
    <h1>Content <span>{questions.length}</span></h1>
    {error ? <p role="alert">{error}</p> : null}
    <div className="hotel-content-scroll" role="region" aria-label={`${course.name} question table`} tabIndex={0}>
      <table>
        <caption className="sr-only">{course.name} questions in curriculum order. Practice mixes the current two topics with earlier review.</caption>
        <thead><tr><th scope="col">#</th><th scope="col">Focus</th><th scope="col">English</th><th scope="col">Answer</th><th scope="col">Other option</th></tr></thead>
        <tbody>{questions.map((question, index) => <tr key={question.id}>
          <td>{index + 1}</td>
          <td>{courseSkillNames[courseSkills.indexOf(question.skill)]}{question.grammar ? <small> · {question.grammar.phase === 'transfer' ? 'Transfer' : 'Practice'} · {question.grammar.kind === 'form' ? 'Form' : 'Meaning'}</small> : null}</td>
          <td><div className="hotel-content-english"><button type="button" onClick={() => play(question)} aria-label={`${playing === question.id ? 'Stop' : 'Play'} ${question.english}`} aria-pressed={playing === question.id}>
            <svg viewBox="0 0 24 24" aria-hidden="true">{playing === question.id ? <path d="M7 5h3v14H7zM14 5h3v14h-3z" /> : <path d="m8 5 11 7-11 7z" />}</svg>
          </button><CourseWordHelp question={question.grammar?.prompt ? {...question,english:question.grammar.prompt} : question} /></div>{question.grammar?.thai ? <small lang="th">{question.grammar.thai}</small> : null}</td>
          <td lang={question.grammar?.kind==='form'?'en':'th'} className="hotel-content-correct">{question.answers[question.correct].map(segment => segment.text).join('')}</td>
          <td lang={question.grammar?.kind==='form'?'en':'th'}>{question.answers[question.correct === 0 ? 1 : 0].map(segment => segment.text).join('')}</td>
        </tr>)}</tbody>
      </table>
    </div>
  </section>
}
