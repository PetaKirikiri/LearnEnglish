import Icon from '../ui/Icon'
import GroupLeaderboardPage from '../pages/GroupLeaderboardPage'
import LeaderboardButton from './LeaderboardButton'
import { appDestination } from '../auth/appAccess'
import WordHelp from './WordHelp'
import QuestionFlag from './QuestionFlag'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  loadLearningMemory,
  recordAnswer,
  saveLearningMemory,
} from './learningMemory'
import { createPracticeRound } from './quizContent'
import { canSpeakEnglish, speakEnglish, stopEnglishSpeech, type SpeechState } from './speech'
import { trackProgress } from './progressSync'
import { questionProgressKey } from './progressData'
import { availableQuestionPoints } from './helpPoints'

export default function QuizPage({
  learnerId,
  userId,
  onSignOut,
  syncState,
}: {
  learnerId: string
  userId: string
  onSignOut: () => void
  syncState?: string
}) {
  const [round, setRound] = useState(0)
  const [roundId, setRoundId] = useState(() => crypto.randomUUID())
  const [learningMemory, setLearningMemory] = useState(() => loadLearningMemory(learnerId))
  const [roundMemory, setRoundMemory] = useState(learningMemory)
  const questions = useMemo(
    () => createPracticeRound(round, roundMemory),
    [roundMemory, round],
  )
  const [questionIndex, setQuestionIndex] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [paused, setPaused] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [helpWords, setHelpWords] = useState<string[]>([])
  const helpWordsRef = useRef<string[]>([])
  const [leaderboardOpen, setLeaderboardOpen] = useState(false)
  const [autoAdvance, setAutoAdvance] = useState(() => localStorage.getItem(`fifa:auto:${userId}`) !== 'false')
  const [speechState, setSpeechState] = useState<SpeechState>('ended')
  const answerLocked = useRef(false)
  const advanced = useRef(false)
  const question = questions[questionIndex]
  const isCorrect = selected === question?.answer
  const availablePoints = availableQuestionPoints(helpWords)
  function openWordHelp(word: string) {
    if (answerLocked.current || helpWordsRef.current.includes(word)) return
    helpWordsRef.current = [...helpWordsRef.current, word]
    setHelpWords(helpWordsRef.current)
  }
  const audioText = question?.mode === 'sentences' && !selected ? question?.prompt : question?.contextSentence ?? question?.spokenText
  const audioUrl = question?.mode === 'sentences' && !selected ? question?.gapAudioUrl : question?.contextAudioUrl ?? question?.audioUrl
  const audioAllowed = question?.mode === 'sentences' || Boolean(selected) || (question?.mode === 'vocabulary' && question?.prompt === question?.spokenText)

  useEffect(() => {
    if (leaderboardOpen || !audioAllowed || !audioText || !audioUrl) return
    speakEnglish(audioText, audioUrl, setSpeechState)
    return stopEnglishSpeech
  }, [audioText, audioUrl, question?.id, roundId, audioAllowed, leaderboardOpen])

  function choose(choice: string) {
    if (answerLocked.current || selected || !question || helpOpen) return
    answerLocked.current = true
    advanced.current = false
    setPaused(false)
    const correct = choice === question.answer
    const nextMemory = recordAnswer(learningMemory, question, correct, Date.now(), roundId)
    setSelected(choice)
    setLearningMemory(nextMemory)
    saveLearningMemory(learnerId, nextMemory)
    trackProgress(userId, 'answer', { questionId: questionProgressKey(question), mode: question.mode, word: question.mode === 'vocabulary' ? question.spokenText : undefined, correct, choice, roundId, helpWords: helpWordsRef.current }, `${roundId.slice(0, 24)}${questionIndex.toString(16).padStart(12, '0')}`)
  }

  const next = useCallback(() => {
    if (!selected || reportOpen || helpOpen || advanced.current) return
    advanced.current = true
    helpWordsRef.current = []
    setHelpWords([])
    stopEnglishSpeech()
    if (questionIndex === questions.length - 1) {
      trackProgress(userId, 'round_completed', { roundId }, roundId)
      setRoundId(crypto.randomUUID())
      setRoundMemory(learningMemory)
      setRound(value => value + 1)
      setQuestionIndex(0)
      setSelected(null)
      answerLocked.current = false
      advanced.current = false
      setPaused(false)
      return
    }

    setQuestionIndex((value) => value + 1)
    setSelected(null)
    answerLocked.current = false
    setPaused(false)
  }, [selected, reportOpen, helpOpen, questionIndex, questions.length, userId, roundId, learningMemory])

  useEffect(() => {
    if (leaderboardOpen || !selected || paused || reportOpen || helpOpen || !autoAdvance || speechState === 'playing') return
    const timer = window.setTimeout(next, isCorrect ? 1200 : 5000)
    return () => window.clearTimeout(timer)
  }, [selected, paused, reportOpen, helpOpen, autoAdvance, isCorrect, next, speechState, leaderboardOpen])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (leaderboardOpen || !question || event.repeat || reportOpen || helpOpen) return
      const target = event.target as HTMLElement
      if (target.closest('button, input, textarea, select, summary, [role="button"]')) return
      const choiceIndex = Number(event.key) - 1
      if (!selected && choiceIndex >= 0 && choiceIndex < question.choices.length) {
        choose(question.choices[choiceIndex])
      } else if (selected && event.key === 'Enter') {
        next()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  })

  useEffect(() => () => {
    stopEnglishSpeech()
  }, [])

  if (leaderboardOpen) return <GroupLeaderboardPage userId={userId} onExit={() => setLeaderboardOpen(false)} onPlay={() => setLeaderboardOpen(false)} />
  if (!question) return null

  return (
    <main className="session-shell game-surface min-h-[100dvh] px-5 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto flex min-h-[calc(100dvh-2.5rem)] max-w-2xl flex-col sm:min-h-[calc(100dvh-4rem)]">
        <header className="lesson-header">
          <div className="lesson-brand">
            <span>EnglishSuccess</span>
          </div>
          <LeaderboardButton userId={userId} onClick={() => setLeaderboardOpen(true)} />
          <details className="account-menu">
            <summary aria-label={`Account: ${learnerId}`}><span className="account-avatar" aria-hidden="true">{learnerId.slice(0, 1).toUpperCase()}</span></summary>
            <div><span className="block px-3 py-2 text-sm font-semibold">{learnerId}</span>{syncState && <span role="status" className="block px-3 pb-2 text-xs text-slate-500">{syncState === 'saved' ? 'All saved' : syncState === 'pending' ? 'Saving…' : 'Waiting to sync'}</span>}{appDestination(userId, '/admin') === 'admin' && <a href="/admin" className="flex min-h-11 items-center rounded-[7px] px-3 py-2 text-[13px] hover:bg-[#f7f7f3]">Admin</a>}<button type="button" onClick={onSignOut}>Sign out</button></div>
          </details>
          <img className="englishsuccess-corner-logo" src="/brand/englishsuccess-logo.png" alt="EnglishSuccess wolf with graduation cap and monocle" width={44} height={44} />
        </header>

        <section key={`${roundId}:${questionIndex}`} className="question-enter question-panel flex flex-1 flex-col justify-center py-8 sm:py-12">
          {!selected && <p className="text-xs text-slate-500" aria-live="polite" data-testid="available-points">Up to {availablePoints} pts · word help −2</p>}
          <h1 className={`mt-6 font-semibold tracking-tight leading-[1.45] ${question?.mode === 'vocabulary' ? 'text-5xl sm:text-6xl' : 'text-[28px] sm:text-4xl'}`}>
            <WordHelp key={question.id} text={question.prompt} onHelp={openWordHelp} onOpenChange={setHelpOpen} pointsRemaining={!selected ? availablePoints : undefined} />
          </h1>
          {question.contextSentence ? (
            <div className="mt-4 rounded-2xl bg-white p-4">
              <p className="mt-2 text-xl leading-relaxed" lang="en"><WordHelp text={question.contextSentence.split(/(\b[\p{L}]+\b)/u).map(part => part.toLowerCase() === question.spokenText.toLowerCase() && question.prompt !== question.spokenText && !selected ? '_____' : part).join('')} onHelp={openWordHelp} onOpenChange={setHelpOpen} pointsRemaining={!selected ? availablePoints : undefined} /></p>
            </div>
          ) : null}

          <div className={`mt-8 grid gap-3 ${question.choices.length === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
            {question.choices.map((choice) => {
              const isAnswer = choice === question.answer
              const isSelected = choice === selected
              const stateClass = selected
                ? isAnswer
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                  : isSelected
                    ? 'border-red-500 bg-red-50 text-red-900'
                    : 'border-slate-200 bg-white text-slate-400'
                : 'border-slate-300 bg-white text-slate-800 hover:border-blue-500 hover:bg-blue-50'

              return (
                <button
                  key={choice}
                  type="button"
                  disabled={selected !== null}
                  onClick={() => choose(choice)}
                  className={`answer-option min-h-16 rounded-xl border px-4 py-4 text-center text-lg font-semibold transition active:scale-[.98] ${stateClass}`}
                >
                  {choice}
                </button>
              )
            })}
          </div>
          <div className="mt-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {canSpeakEnglish() && audioAllowed && <button type="button" onClick={() => { if (speechState === 'playing') { stopEnglishSpeech(); setSpeechState('ended') } else { if (selected) setPaused(true); speakEnglish(audioText!, audioUrl!, setSpeechState) } }} aria-label={speechState === 'playing' ? 'Stop audio' : 'Play audio'} className="icon-button"><Icon name={speechState === 'playing' ? 'pause' : 'sound'} /></button>}
              {speechState === 'playing' && audioAllowed && <span className="text-xs font-semibold text-teal-700" role="status">Playing</span>}
              {speechState === 'blocked' && audioAllowed && <span className="text-xs text-slate-500" role="status">Tap to listen</span>}
            </div>
            <QuestionFlag question={question} userId={userId} onOpenChange={setReportOpen} />
          </div>
        </section>

        {selected ? (
          <footer className={`-mx-4 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 sm:-mx-8 sm:px-8 ${isCorrect ? 'bg-emerald-100' : 'bg-red-100'}`}>
            <div className="mx-auto flex max-w-2xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <p className={`text-xl font-black ${isCorrect ? 'text-emerald-800' : 'text-red-800'}`}>
                  {isCorrect ? 'Correct!' : `Correct answer: ${question.answer}`}
                </p>
                <details key={question.id} className="mt-2 text-sm text-slate-700" onToggle={event => { if (event.currentTarget.open) setPaused(true) }}>
                  <summary className="w-fit cursor-pointer font-semibold">Why?</summary>
                  <div className="mt-3 space-y-2 leading-relaxed">
                    <p>{question.example}</p>
                    {question.explanation && <p>{question.explanation}</p>}
                    {question.explanationThai && <p lang="th">{question.explanationThai}</p>}
                  </div>
                </details>
              </div>
              <div className="shrink-0 space-y-2">
                <button type="button" aria-pressed={autoAdvance} onClick={() => setAutoAdvance(value => { localStorage.setItem(`fifa:auto:${userId}`, String(!value)); return !value })} className="flex min-h-11 items-center gap-2 text-xs font-semibold"><span className={`h-2 w-2 rounded-full ${autoAdvance ? 'bg-teal-600' : 'bg-slate-400'}`} />Auto {autoAdvance ? 'on' : 'off'}</button>
                <p role="status" className="sr-only">{paused ? 'Paused for reading' : speechState === 'playing' ? 'Listening…' : 'Moving on automatically…'}</p>
                {autoAdvance ? <button type="button" onClick={() => setPaused(value => !value)} className="rounded-xl border border-slate-400 px-5 py-3 font-bold text-slate-800">
                  {paused ? 'Resume' : 'Pause'}
                </button> : <button type="button" onClick={next} className="primary-action">Next<Icon name="arrow" /></button>}
              </div>
            </div>
          </footer>
        ) : null}
      </div>
    </main>
  )
}
