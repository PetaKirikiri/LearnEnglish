import { useCallback, useEffect, useRef, useState } from 'react'
import type { ComponentType } from 'react'
import type { User } from '@supabase/supabase-js'
import { speakEnglish, stopEnglishSpeech } from '../learning/speech'
import { isSkillComplete, loadProgress, nextQuestion, recordAnswer, requiresAudioCheck, skills, skillNames, hotelQuestions, progressKey, grammarWordMemoryKey, legacyWordMemoryKey, type HotelQuestion } from './course'
import './hotel.css'
import { ENGLISH_ORIGIN, hotelAccountUrl, hotelLineEntryUrl, isHotelLineEntry } from './lineEntry'
import { finishHotelReturn } from './accountHandoff'
import { bounded } from './lineAccount'
import { appDestination } from '../auth/appAccess'
import HotelContentPage from './HotelContentPage'
import HotelScoreboard from './HotelScoreboard'
import { joinHotel, queueHotelAnswer, syncHotelAnswers } from './scoring'
import Icon from '../ui/Icon'
import HotelWordHelp from './HotelWordHelp'
import { loadWordFamiliarity, recordWordExposure, wordOpacity, listeningWordOpacity, type WordFamiliarity } from './wordFamiliarity'
import CurriculumGate from '../curriculum/CurriculumGate'
import CurriculumPage from '../curriculum/CurriculumPage'
import { courseNames, type LearningCourse } from '../curriculum/courseScope'
import { englishLineEntryUrl } from '../english/lineEntry'
import { englishScoring } from '../english/scoring'

// One listening interaction, with explicit course boundaries for content,
// storage and scoring. Padel must never submit attempts to Hotel's scoreboard.
export type ListeningCourse = {
  skills: string[]
  loadProgress: typeof loadProgress
  nextQuestion: typeof nextQuestion
  isSkillComplete: typeof isSkillComplete
  progressKey: (userId: string) => string
  wordMemoryKey: (userId: string) => string
  legacyWordMemoryKey?: (userId: string) => string
  WordHelp: ComponentType<Parameters<typeof HotelWordHelp>[0]>
  sync?: (userId: string) => Promise<unknown>
  queue?: typeof queueHotelAnswer
}
const hotelCourse: ListeningCourse = {
  skills, loadProgress, nextQuestion, isSkillComplete,
  progressKey, wordMemoryKey: grammarWordMemoryKey, legacyWordMemoryKey, WordHelp: HotelWordHelp,
  sync: id => joinHotel().then(() => syncHotelAnswers(id)), queue: queueHotelAnswer,
}
const englishCourse: ListeningCourse = {
  ...hotelCourse,
  // A learner may have offline general answers in the old combined queue.
  // The server classifies those by question ID; drain it without enrolling
  // this learner in Hotel or copying/re-awarding the original events.
  sync: id => englishScoring.join().then(() => Promise.all([syncHotelAnswers(id), englishScoring.sync(id)])), queue: englishScoring.queue,
}
const englishContent = { questions: hotelQuestions, skills, skillNames, name: 'English Success', curriculum: true, WordHelp: HotelWordHelp }

export default function HotelPage({ courseId = 'hotel' }: { courseId?: LearningCourse }) {
  const [user, setUser] = useState<User | null>(null)
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState(() => new URLSearchParams(window.location.search).get('line_result') === 'new' ? 'No account yet. Tap Sign up to create one.' : '')
  const entry = courseId === 'english' ? englishLineEntryUrl : hotelLineEntryUrl
  const entryUrl = entry()
  const base = `/${courseId}`
  const name = courseNames[courseId]
  const lesson = courseId === 'english' ? englishCourse : hotelCourse
  const isAdmin = user ? appDestination(user.id, '/admin') === 'admin' : false
  const path = window.location.pathname.replace(/\/$/, '')
  const preview = import.meta.env.DEV && [base+'/preview',base+'/preview/content',base+'/preview/curriculum'].includes(path)
  const practicePath = preview ? `${base}/preview` : base
  const showContent = (isAdmin && path === `${base}/content`) || (preview && /\/content\/?$/.test(path))
  const showScores = isAdmin && path === `${base}/scoreboard`
  const showCurriculum = (isAdmin || preview) && /\/curriculum\/?$/.test(window.location.pathname)
  function signIn(create = false) {
    if (busy) return
    if (!entryUrl) return
    window.location.assign(entry(create)!)
  }
  useEffect(() => {
    document.title = courseId === 'english' ? 'English Success' : 'English Success · Hotel'
    let active = true
    const ticket = window.location.origin === ENGLISH_ORIGIN ? new URLSearchParams(window.location.hash.slice(1)).get('ticket') : null
    if (ticket) window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`)
    // LINE approval finishes at the existing registered callback. This page
    // only redeems its one-use ticket into an EnglishSuccess browser session.
    void bounded(() => finishHotelReturn(ticket)).then(value => { if (active) setUser(value) }, cause => { if (active) setError(cause.message) })
      .finally(() => { if (active) setBusy(false) })
    return () => { active = false }
  }, [courseId])
  return <main className="hotel-shell">
    <header className="hotel-header listening-course-header">
      <a href={courseId === 'hotel' && isHotelLineEntry(window.location.search) ? hotelAccountUrl() : practicePath}>ENGLISH<span>SUCCESS</span></a>
      <select className="listening-course-select" aria-label="Course" value={courseId} onChange={event => {
        const nextBase = `/${event.target.value}${preview ? '/preview' : ''}`
        window.location.assign(nextBase + (showContent ? '/content' : showCurriculum ? '/curriculum' : showScores ? '/scoreboard' : ''))
      }}><option value="english">English Success</option><option value="hotel">Hotel</option></select>
      {isAdmin || preview ? <nav className="hotel-admin-nav" aria-label={`${name} tools`}>
        <a className="hotel-nav-icon" aria-label="Practice" title="Practice" aria-current={!showContent && !showScores && !showCurriculum ? 'page' : undefined} href={practicePath}><Icon name="play" /></a>
        <a className="hotel-content-link" aria-current={showContent ? 'page' : undefined} href={`${practicePath}/content`}>Content</a>
        <a className="hotel-nav-icon" aria-label="Learning route" title="Learning route" aria-current={showCurriculum ? 'page' : undefined} href={`${practicePath}/curriculum`}><Icon name="grid" /></a>
        {isAdmin ? <a className="hotel-nav-icon" aria-label="Scoreboard" title="Scoreboard" aria-current={showScores ? 'page' : undefined} href={`${base}/scoreboard`}><Icon name="trophy" /></a> : null}
      </nav> : null}
    </header>
    {showScores ? <HotelScoreboard name={name} load={courseId === 'english' ? englishScoring.load : undefined} /> : showCurriculum ? <CurriculumGate key={courseId} course={courseId}><CurriculumPage /></CurriculumGate> : showContent ? <CurriculumGate key={courseId} course={courseId}><HotelContentPage course={courseId === 'english' ? englishContent : undefined} /></CurriculumGate> : preview || user ? <CurriculumGate key={courseId} course={courseId}><HotelLesson key={`${courseId}:${user?.id ?? 'local-preview'}`} userId={preview ? 'local-preview' : user!.id} course={lesson} /></CurriculumGate> : <section className="hotel-welcome">
      <div className="hotel-monogram" aria-hidden="true">{courseId === 'english' ? 'E' : 'H'}</div>
      <h1>English,<br /><em>by ear.</em></h1>
      <button className="hotel-line" disabled={busy || !entryUrl} onClick={() => void signIn(true)}>{busy ? 'Connecting…' : 'Sign up with LINE'}</button>
      <button className="hotel-reveal" disabled={busy || !entryUrl} onClick={() => void signIn(false)}>Sign in</button>
      {!entryUrl ? <p role="status">English Success LINE sign-in is being configured.</p> : null}
      {error ? <p role="alert">{error}</p> : null}
    </section>}
  </main>
}

export function HotelLesson({ userId, course = hotelCourse }: { userId: string; course?: ListeningCourse }) {
  const [progress, setProgress] = useState(() => course.loadProgress(userId))
  const [wordMemory, setWordMemory] = useState(() => loadWordFamiliarity(userId, course.wordMemoryKey(userId), course.legacyWordMemoryKey?.(userId)))
  const [question, setQuestion] = useState<HotelQuestion>(() => course.nextQuestion(progress))
  const CourseWordHelp = course.WordHelp
  const firstQuestion = useRef(question)
  const [flipped, setFlipped] = useState(() => Math.random() < 0.5)
  const [selected, setSelected] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [helped, setHelped] = useState(false)
  const [audio, setAudio] = useState('')
  const [heard, setHeard] = useState(false)
  const [storageError, setStorageError] = useState(false)
  const [scoreError, setScoreError] = useState(false)
  const sync = useCallback(() => {
    if (userId === 'local-preview' || !course.sync) return Promise.resolve()
    return course.sync(userId)
      .then(() => setScoreError(false), () => setScoreError(true))
  }, [userId, course])
  const round = useRef(0)
  const answered = useRef(false)
  const playback = useRef(0)
  // This is fixed for the attempt; recording an answer must not change which
  // support was available when the learner chose.
  const [assessment, setAssessment] = useState(() => requiresAudioCheck(progress, question))
  const play = useCallback((item: HotelQuestion) => {
    const request = ++playback.current
    const text = item.grammar?.prompt ?? item.english
    const url = item.grammar?.promptAudioUrl ?? item.audioUrl
    speakEnglish(text, import.meta.env.PROD ? `${ENGLISH_ORIGIN}${url}` : url, state => {
      if (request !== playback.current) return
      if (state === 'ended') setHeard(true)
      setAudio(state === 'blocked' ? 'Tap to retry audio' : state === 'playing' ? 'Listening…' : 'Listen again')
    })
  }, [])
  const cancelPlayback = useCallback(() => {
    playback.current++
    stopEnglishSpeech()
  }, [])
  useEffect(() => {
    play(firstQuestion.current)
    return cancelPlayback
  }, [play, cancelPlayback])
  useEffect(() => {
    void sync()
    const retry = () => { if (document.visibilityState === 'visible') void sync() }
    window.addEventListener('online', retry)
    document.addEventListener('visibilitychange', retry)
    return () => { window.removeEventListener('online', retry); document.removeEventListener('visibilitychange', retry) }
  }, [sync])
  function choose(index: number) {
    if (answered.current || !heard) return
    answered.current = true
    setSelected(index)
    const assisted = revealed || helped
    const updated = recordAnswer(progress, question, index === question.correct, assisted, undefined, assessment)
    // Every encountered word earns familiarity, not grammar mastery. Actual
    // listening evidence is recorded separately above.
    saveWords(recordWordExposure(wordMemory, question.english, index === question.correct, assisted))
    setProgress(updated)
    try { localStorage.setItem(course.progressKey(userId), JSON.stringify(updated)) } catch { setStorageError(true) }
    if (userId !== 'local-preview' && course.queue) {
      try { course.queue(userId, question.id, index, assisted); void sync() }
      catch { setStorageError(true) }
    }
    if (question.grammar?.kind === 'form') speakEnglish(question.english, question.audioUrl)
  }
  function saveWords(memory: WordFamiliarity) {
    setWordMemory(memory)
    try { localStorage.setItem(course.wordMemoryKey(userId), JSON.stringify(memory)) } catch { setStorageError(true) }
  }
  function helpWord(word: string) {
    if (selected === null) setHelped(true)
    // A lookup is evidence that this word still needs visible support.
    saveWords({ ...wordMemory, [word]: { seen: wordMemory[word]?.seen ?? 0, strength: 0 } })
  }
  function next() {
    const item = course.nextQuestion(progress, question.id, ++round.current)
    setAssessment(requiresAudioCheck(progress, item))
    setQuestion(item); setSelected(null); setRevealed(false); setHelped(false); setHeard(false); setFlipped(Math.random() < 0.5); answered.current = false; play(item)
  }
  const order = flipped ? [1, 0] : [0, 1]
  // Freeze fading until the next question: feedback must not move the support.
  const support = selected === null && !revealed
  const displayQuestion = selected === null && question.grammar?.prompt ? { ...question, english: question.grammar.prompt, audioUrl: question.grammar.promptAudioUrl! } : question
  return <section className="hotel-lesson">
    <div className="hotel-journey" aria-label="Listening progress">{course.skills.map(skill => <span key={skill} className={course.isSkillComplete(progress, skill) ? 'learned' : ''} />)}</div>
      <button className="hotel-listen" onClick={() => play(question)} aria-label="Play English audio"><svg viewBox="0 0 64 64" aria-hidden="true"><path d="M12 27h10l12-10v30L22 37H12zM43 23q12 9 0 18M49 15q21 17 0 34" /></svg></button>
      <p className="hotel-audio" aria-live="polite">{audio}</p>
      {question.grammar?.thai ? <p className="hotel-sentence" lang="th">{question.grammar.thai}</p> : null}
      {!assessment || revealed || selected !== null ? <p className="hotel-sentence" lang="en"><CourseWordHelp key={`${question.id}-${selected === null}`} question={displayQuestion} onListen={() => play(question)} onHelp={helpWord} tokenOpacity={word => support ? (question.grammar ? listeningWordOpacity : wordOpacity)(wordMemory, word) : 1} /></p> : null}
      <div className="hotel-answers">{order.map(index => <button key={`${question.id}-${index}`} disabled={selected !== null || !heard} className={`hotel-answer ${selected !== null && index === question.correct ? 'right' : selected === index ? 'wrong' : ''}`} onClick={() => choose(index)}>
        <span lang={question.grammar?.kind === 'form' ? 'en' : 'th'}>{question.answers[index].map((segment, i) => <span key={i}>{segment.text}</span>)}</span>
      </button>)}</div>
      {selected === null ? <button className="hotel-reveal" onClick={() => setRevealed(true)} disabled={revealed}>{revealed ? 'Words visible' : 'Show words'}</button> : <div className="hotel-feedback" aria-live="polite">
        {question.grammar ? <details><summary>Why?</summary><p lang="th">{question.grammar.explanation}</p></details> : null}
        <button className="hotel-primary" onClick={next}>Next →</button></div>}
      {storageError ? <p role="alert">Progress could not be saved on this device.</p> : null}
      {scoreError ? <p role="status">Scores not synced. <button className="hotel-reveal" onClick={() => void sync()}>Retry</button></p> : null}
  </section>
}
