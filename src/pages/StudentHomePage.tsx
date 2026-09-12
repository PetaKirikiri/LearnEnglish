import { useState } from 'react'
import ReadingPage from './ReadingPage'
import QuizPage from '../learning/QuizPage'
import { getReviewCount, loadLearningMemory } from '../learning/learningMemory'
import type { QuizMode } from '../learning/quizContent'

export default function StudentHomePage({
  displayName,
  userId,
  syncState,
  onSignOut,
}: {
  displayName: string
  userId: string
  syncState: string
  onSignOut: () => void
}) {
  const [screen, setScreen] = useState<'home' | 'stories' | 'quiz'>('home')
  const [quizMode, setQuizMode] = useState<QuizMode>('vocabulary')
  const learningMemory = loadLearningMemory(displayName)
  const vocabularyReviewCount = getReviewCount(learningMemory, 'vocabulary')
  const sentenceReviewCount = getReviewCount(learningMemory, 'sentences')

  if (screen === 'quiz') {
    return <QuizPage mode={quizMode} learnerId={displayName} userId={userId} onExit={() => setScreen('home')} />
  }

  if (screen === 'stories') {
    return (
      <main className="min-h-screen bg-sky-50 px-5 py-6 text-slate-900 sm:px-8 sm:py-10">
        <div className="mx-auto mb-5 flex max-w-3xl items-center justify-between">
          <button
            type="button"
            onClick={() => setScreen('home')}
            className="rounded-full bg-white px-4 py-2 text-sm font-black text-blue-700 shadow-sm"
          >
            ← Home
          </button>
          <p className="text-sm font-bold text-slate-500">{displayName}</p>
        </div>
        <ReadingPage />
      </main>
    )
  }

  return (
    <main className="min-h-screen overflow-hidden bg-blue-700 text-white">
      <div className="mx-auto max-w-3xl px-5 pb-12 pt-7 sm:px-8 sm:pt-10">
        <header className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-100">FIFA English</p>
            <h1 className="mt-2 text-3xl font-black sm:text-4xl">Hi, {displayName}!</h1>
          </div>
          <button
            type="button"
            onClick={onSignOut}
            className="rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-bold hover:bg-white/20"
          >
            Sign out
          </button>
        </header>
        <p role="status" className="mt-3 text-xs text-blue-100">{syncState === 'saved' ? 'Progress saved' : syncState === 'pending' ? 'Saving progress…' : 'Progress waiting to sync. Keep this browser data until you reconnect.'}</p>

        <section className="mt-9">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-100">Choose a lesson</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => { setQuizMode('vocabulary'); setScreen('quiz') }}
              className="rounded-[2rem] bg-white p-6 text-left text-slate-900 shadow-xl transition hover:-translate-y-0.5 sm:p-7"
            >
              <span className="grid h-16 w-16 place-items-center rounded-2xl bg-orange-100 text-3xl" aria-hidden="true">ก</span>
              <span className="mt-5 block text-2xl font-black">Vocabulary</span>
              <span className="mt-2 block text-sm leading-6 text-slate-500">Learn the English words from your stories.</span>
              {vocabularyReviewCount > 0 ? (
                <span className="mt-3 inline-block rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-orange-700">{vocabularyReviewCount} to review</span>
              ) : null}
              <span className="mt-5 block font-black text-orange-600">Start lesson →</span>
            </button>
            <button
              type="button"
              onClick={() => { setQuizMode('sentences'); setScreen('quiz') }}
              className="rounded-[2rem] bg-white p-6 text-left text-slate-900 shadow-xl transition hover:-translate-y-0.5 sm:p-7"
            >
              <span className="grid h-16 w-16 place-items-center rounded-2xl bg-emerald-100 text-3xl" aria-hidden="true">Aa</span>
              <span className="mt-5 block text-2xl font-black">Sentence structures</span>
              <span className="mt-2 block text-sm leading-6 text-slate-500">Choose missing words from real story sentences.</span>
              {sentenceReviewCount > 0 ? (
                <span className="mt-3 inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">{sentenceReviewCount} to review</span>
              ) : null}
              <span className="mt-5 block font-black text-emerald-700">Start lesson →</span>
            </button>
          </div>
        </section>

        <section className="mt-5">
          <button
            type="button"
            onClick={() => setScreen('stories')}
            className="w-full rounded-3xl bg-white/95 p-5 text-left text-slate-900 shadow-lg transition hover:-translate-y-0.5"
          >
            <span className="mr-4 text-3xl" aria-hidden="true">📖</span>
            <span className="text-xl font-black">Read the stories</span>
          </button>
        </section>
      </div>
    </main>
  )
}
