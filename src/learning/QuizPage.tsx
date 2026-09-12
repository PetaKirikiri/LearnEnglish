import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  getReviewQuestionIds,
  loadLearningMemory,
  recordAnswer,
  saveLearningMemory,
} from './learningMemory'
import { createQuizRound, type QuizMode } from './quizContent'
import { canSpeakEnglish, speakEnglish, stopEnglishSpeech } from './speech'
import { trackProgress } from './progressSync'
import { questionProgressKey } from './progressData'

type SavedProgress = Record<QuizMode, { best: number; rounds: number }>

const progressKey = 'fifa-english:quiz-progress:v1'
const emptyProgress: SavedProgress = {
  vocabulary: { best: 0, rounds: 0 },
  sentences: { best: 0, rounds: 0 },
}

function loadProgress(): SavedProgress {
  try {
    const saved = window.localStorage.getItem(progressKey)
    if (!saved) return emptyProgress
    return { ...emptyProgress, ...JSON.parse(saved) as SavedProgress }
  } catch {
    return emptyProgress
  }
}

export default function QuizPage({
  mode,
  learnerId,
  userId,
  onExit,
}: {
  mode: QuizMode
  learnerId: string
  userId: string
  onExit: () => void
}) {
  const [round, setRound] = useState(0)
  const [roundId, setRoundId] = useState(() => crypto.randomUUID())
  const [learningMemory, setLearningMemory] = useState(() => loadLearningMemory(learnerId))
  const [reviewQuestionIds, setReviewQuestionIds] = useState(() => (
    getReviewQuestionIds(learningMemory, mode)
  ))
  const questions = useMemo(
    () => createQuizRound(mode, round, reviewQuestionIds),
    [mode, reviewQuestionIds, round],
  )
  const [questionIndex, setQuestionIndex] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [paused, setPaused] = useState(false)
  const answerLocked = useRef(false)
  const advanced = useRef(false)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const [progress, setProgress] = useState(loadProgress)
  const question = questions[questionIndex]
  const isCorrect = selected === question?.answer
  const title = mode === 'vocabulary' ? 'Vocabulary' : 'Sentence structures'

  function choose(choice: string) {
    if (answerLocked.current || selected || !question) return
    answerLocked.current = true
    advanced.current = false
    setPaused(false)
    const correct = choice === question.answer
    const nextMemory = recordAnswer(learningMemory, question, correct)
    setSelected(choice)
    setLearningMemory(nextMemory)
    saveLearningMemory(learnerId, nextMemory)
    trackProgress(userId, 'answer', { questionId: questionProgressKey(question), mode, word: question.mode === 'vocabulary' ? question.spokenText : undefined, correct, roundId }, `${roundId.slice(0, 24)}${questionIndex.toString(16).padStart(12, '0')}`)
    if (correct) setScore((value) => value + 1)
  }

  const next = useCallback(() => {
    if (!selected || finished || advanced.current) return
    advanced.current = true
    stopEnglishSpeech()
    if (questionIndex === questions.length - 1) {
      trackProgress(userId, 'round_completed', { mode, roundId }, roundId)
      const nextProgress = {
        ...progress,
        [mode]: {
          best: Math.max(progress[mode].best, score),
          rounds: progress[mode].rounds + 1,
        },
      }
      setProgress(nextProgress)
      window.localStorage.setItem(progressKey, JSON.stringify(nextProgress))
      setFinished(true)
      return
    }

    setQuestionIndex((value) => value + 1)
    setSelected(null)
    answerLocked.current = false
    setPaused(false)
  }, [selected, finished, questionIndex, questions.length, userId, mode, roundId, progress, score])

  useEffect(() => {
    if (!selected || finished || paused) return
    const timer = window.setTimeout(next, isCorrect ? 1200 : 5000)
    return () => window.clearTimeout(timer)
  }, [selected, finished, paused, isCorrect, next])

  function restart() {
    answerLocked.current = false
    advanced.current = false
    setPaused(false)
    setRoundId(crypto.randomUUID())
    setReviewQuestionIds(getReviewQuestionIds(learningMemory, mode))
    setRound((value) => value + 1)
    setQuestionIndex(0)
    setSelected(null)
    setScore(0)
    setFinished(false)
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (finished || !question || event.repeat) return
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

  if (finished) {
    const percentage = Math.round((score / questions.length) * 100)

    return (
      <main className="grid min-h-[100dvh] place-items-center bg-slate-50 px-5 py-10 text-slate-900">
        <section className="w-full max-w-lg rounded-[2rem] bg-white p-8 text-center shadow-xl sm:p-10">
          <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-blue-100 text-5xl" aria-hidden="true">
            {percentage >= 80 ? '⭐' : '💪'}
          </div>
          <p className="mt-6 text-sm font-black uppercase tracking-[0.18em] text-blue-700">{title} complete</p>
          <h1 className="mt-2 text-5xl font-black">{score}/{questions.length}</h1>
          <p className="mt-3 text-lg font-bold text-slate-500">{percentage}% correct</p>
          <p className="mt-2 text-sm text-slate-500">Best score: {progress[mode].best}/{questions.length}</p>
          <button type="button" onClick={restart} className="mt-8 w-full rounded-2xl bg-blue-700 px-6 py-4 text-lg font-black text-white hover:bg-blue-800">
            Practice again
          </button>
          <button type="button" onClick={onExit} className="mt-3 w-full rounded-2xl px-6 py-3 font-bold text-slate-500 hover:bg-slate-100">
            Back to lessons
          </button>
        </section>
      </main>
    )
  }

  if (!question) return null

  return (
    <main className="min-h-[100dvh] bg-slate-50 px-4 py-5 text-slate-900 sm:px-8 sm:py-8">
      <div className="mx-auto flex min-h-[calc(100dvh-2.5rem)] max-w-2xl flex-col sm:min-h-[calc(100dvh-4rem)]">
        <header className="flex items-center gap-4">
          <button type="button" aria-label="Back to lessons" onClick={onExit} className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-2xl font-black text-slate-500 hover:bg-slate-200">
            ×
          </button>
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-blue-600 transition-[width]" style={{ width: `${((questionIndex + 1) / questions.length) * 100}%` }} />
          </div>
          <span className="w-12 text-right text-sm font-black text-slate-500">{questionIndex + 1}/{questions.length}</span>
        </header>

        <section className="flex flex-1 flex-col justify-center py-8 sm:py-12">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-blue-700">{title}</p>
          <p className="mt-2 text-base font-bold text-slate-500">{question.instruction}</p>
          {question.thaiPrompt ? <p lang="th" className="mt-5 rounded-2xl bg-blue-50 p-4 text-lg leading-relaxed text-blue-950">{question.thaiPrompt}</p> : null}
          <h1 className={`mt-6 font-black leading-tight ${mode === 'vocabulary' ? 'text-5xl sm:text-6xl' : 'text-3xl sm:text-4xl'}`}>
            {question.prompt}
          </h1>
          {mode === 'vocabulary' && canSpeakEnglish() ? (
            <button
              type="button"
              onClick={() => speakEnglish(question.spokenText, question.audioUrl)}
              className="mt-5 inline-flex w-fit items-center gap-2 rounded-full border-2 border-blue-200 bg-white px-4 py-2 font-black text-blue-700 hover:bg-blue-50"
            >
              <span aria-hidden="true">🔊</span> Listen
            </button>
          ) : null}

          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            {question.choices.map((choice, index) => {
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
                  className={`min-h-20 rounded-2xl border-2 px-5 py-4 text-left text-lg font-black shadow-sm transition ${stateClass}`}
                >
                  <span className="mr-3 inline-grid h-7 w-7 place-items-center rounded-lg border border-current text-xs opacity-60">{index + 1}</span>
                  {choice}
                </button>
              )
            })}
          </div>
        </section>

        {selected ? (
          <footer className={`-mx-4 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 sm:-mx-8 sm:px-8 ${isCorrect ? 'bg-emerald-100' : 'bg-red-100'}`}>
            <div className="mx-auto flex max-w-2xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <p className={`text-xl font-black ${isCorrect ? 'text-emerald-800' : 'text-red-800'}`}>
                  {isCorrect ? 'Correct!' : `Correct answer: ${question.answer}`}
                </p>
                <p className="mt-1 text-sm leading-5 text-slate-600">From “{question.sourceTitle}”: {question.example}</p>
                {question.explanation ? (
                  <div className="mt-3 space-y-2 text-sm leading-relaxed text-slate-800">
                    <p className="font-bold">{question.grammarFocus}</p>
                    <p lang="th">{question.explanationThai}</p>
                    <p>{question.explanation}</p>
                  </div>
                ) : null}
                {canSpeakEnglish() ? (
                  <button type="button" onClick={() => { setPaused(true); speakEnglish(question.spokenText, question.audioUrl) }} className="mt-2 font-black text-blue-700 hover:text-blue-900">
                    🔊 Listen to the English
                  </button>
                ) : null}
              </div>
              <div className="shrink-0 space-y-2">
                <p role="status" className="text-sm text-slate-700">{paused ? 'Paused for reading' : questionIndex === questions.length - 1 ? 'Showing score shortly…' : 'Moving on automatically…'}</p>
                <button type="button" onClick={() => setPaused(value => !value)} className="rounded-xl border border-slate-400 px-5 py-3 font-bold text-slate-800">
                  {paused ? 'Resume' : 'Pause to read'}
                </button>
              </div>
            </div>
          </footer>
        ) : null}
      </div>
    </main>
  )
}
