import { useEffect, useState } from 'react'
import { speakEnglish, stopEnglishSpeech } from '../learning/speech'
import { hotelQuestions, skillNames, skills, type HotelQuestion } from './course'
import './hotel-content.css'
import HotelWordHelp from './HotelWordHelp'
import type { ComponentType } from 'react'
import { getCurriculum } from '../curriculum/database'

type ContentCourse = { questions: readonly HotelQuestion[]; skills: string[]; skillNames: string[]; name: string; curriculum?: boolean; contentStage?: (question:HotelQuestion)=>string; WordHelp: ComponentType<Parameters<typeof HotelWordHelp>[0]> }
const hotelContent: ContentCourse = { questions: hotelQuestions, skills, skillNames, name: 'Hotel', WordHelp: HotelWordHelp }

export default function HotelContentPage({ course = hotelContent }: { course?: ContentCourse }) {
  const { questions: allQuestions, skills: courseSkills, skillNames: courseSkillNames, WordHelp: CourseWordHelp } = course
  const hasCurriculum = course.name === 'Hotel' || course.curriculum
  const data = hasCurriculum ? getCurriculum() : undefined
  const focus = new URLSearchParams(window.location.search).get('focus')
  const mapped = data?.courseSkills.filter(m=>m.nodeId===focus).map(m=>m.skill)
  const [situation,setSituation] = useState('All situations')
  const [search,setSearch] = useState('')
  const [page,setPage] = useState(0)
  const scoped = mapped?.length ? allQuestions.filter(q=>mapped.includes(q.skill)) : allQuestions
  const domains=[...new Set(scoped.flatMap(q=>q.grammar?.domain?[q.grammar.domain]:[]))].sort()
  const query=search.trim().toLowerCase()
  const questions=scoped.filter(q=>
    (situation==='All situations'||(situation==='Everyday English'?!!q.grammar?.domain:situation==='Original content'?!q.grammar?.domain:q.grammar?.domain===situation))&&
    (!query||`${q.english} ${q.answers.flat().map(s=>s.text).join(' ')}`.toLowerCase().includes(query)))
  const pageSize=hasCurriculum?100:Math.max(1,allQuestions.length)
  const currentPage=Math.min(page,Math.max(0,Math.ceil(questions.length/pageSize)-1))
  const visible=questions.slice(currentPage*pageSize,(currentPage+1)*pageSize)
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
    {hasCurriculum?<div className="content-filters">
      <input aria-label="Search questions" placeholder="Search" value={search} onChange={e=>{setSearch(e.target.value);setPage(0)}}/>
      {domains.length>0?<select aria-label="Situation" value={situation} onChange={e=>{setSituation(e.target.value);setPage(0)}}>
        <option>All situations</option>{domains.map(d=><option key={d}>{d}</option>)}
      </select>:null}
    </div>:null}
    {error ? <p role="alert">{error}</p> : null}
    <div className="hotel-content-scroll" role="region" aria-label={`${course.name} question table`} tabIndex={0}>
      <table>
        <caption className="sr-only">{course.name} questions in curriculum order. Practice mixes the current two topics with earlier review.</caption>
        <thead><tr><th scope="col">#</th><th scope="col">Focus</th><th scope="col">English</th><th scope="col">Answer</th><th scope="col">Other option</th></tr></thead>
        <tbody>{visible.map((question, index) => <tr key={question.id}>
          <td>{currentPage*pageSize+index + 1}</td>
          <td>{course.contentStage?.(question) ?? courseSkillNames[courseSkills.indexOf(question.skill)]}{question.grammar ? <small> · {question.grammar.phase === 'transfer' ? 'Transfer' : 'Practice'} · {question.grammar.kind === 'form' ? 'Form' : 'Meaning'}{question.grammar.domain?` · ${question.grammar.domain}`:''}</small> : null}{data ? <small> · {data.skills.find(s=>s.id===data.courseSkills.find(m=>m.skill===question.skill)?.nodeId)?.level}</small> : null}</td>
          <td><div className="hotel-content-english"><button type="button" onClick={() => play(question)} aria-label={`${playing === question.id ? 'Stop' : 'Play'} ${question.english}`} aria-pressed={playing === question.id}>
            <svg viewBox="0 0 24 24" aria-hidden="true">{playing === question.id ? <path d="M7 5h3v14H7zM14 5h3v14h-3z" /> : <path d="m8 5 11 7-11 7z" />}</svg>
          </button><CourseWordHelp question={question.grammar?.prompt ? {...question,english:question.grammar.prompt} : question} /></div>{question.grammar?.thai ? <small lang="th">{question.grammar.thai}</small> : null}</td>
          <td lang={question.grammar?.kind==='form'?'en':'th'} className="hotel-content-correct">{question.answers[question.correct].map(segment => segment.text).join('')}</td>
          <td lang={question.grammar?.kind==='form'?'en':'th'}>{question.answers[question.correct === 0 ? 1 : 0].map(segment => segment.text).join('')}</td>
        </tr>)}</tbody>
      </table>
    </div>
    {!questions.length?<p>No matching questions.</p>:null}
    {questions.length>pageSize?<nav className="content-pages" aria-label="Question pages">
      <button aria-label="Previous page" disabled={currentPage===0} onClick={()=>setPage(currentPage-1)}>←</button>
      <span>{currentPage*pageSize+1}–{Math.min((currentPage+1)*pageSize,questions.length)} / {questions.length}</span>
      <button aria-label="Next page" disabled={(currentPage+1)*pageSize>=questions.length} onClick={()=>setPage(currentPage+1)}>→</button>
    </nav>:null}
  </section>
}
