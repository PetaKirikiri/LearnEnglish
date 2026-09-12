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
    <main className="min-h-[100dvh] bg-[#f7f8fa] text-slate-900">
      <div className="mx-auto max-w-lg px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-10 sm:pt-16">
        <header className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">FIFA English</p>
            <h1 className="mt-2 break-words text-3xl font-bold tracking-tight">Hi, {displayName}.</h1>
          </div>
          <button
            type="button"
            onClick={onSignOut}
            aria-label="Sign out"
            title="Sign out"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-slate-400 transition hover:bg-slate-200 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H5v14h4M13 8l4 4-4 4M9 12h11" /></svg>
          </button>
        </header>
        <nav aria-label="Lessons" className="mt-12 space-y-3">
            <button
              type="button"
              onClick={() => { setQuizMode('vocabulary'); setScreen('quiz') }}
              className="group flex min-h-32 w-full items-center gap-5 rounded-[1.75rem] bg-[#fff0dd] px-6 py-6 text-left transition hover:bg-[#ffe7c7] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-600"
            >
              <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white/70 text-[#a85819]" aria-hidden="true"><svg viewBox="0 0 48 48" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="10" width="28" height="30" rx="6" transform="rotate(-8 23 25)" /><path d="m17 31 7-16 7 16M20 25h8" /></svg></span>
              <span className="flex-1 text-2xl font-bold tracking-tight">Words</span>
              {vocabularyReviewCount > 0 ? (
                <span aria-label={`${vocabularyReviewCount} words to review`} className="rounded-full bg-white/80 px-2.5 py-1 text-xs font-bold text-orange-800">{vocabularyReviewCount}</span>
              ) : null}
              <span aria-hidden="true" className="text-2xl text-[#a85819] transition-transform group-hover:translate-x-1">›</span>
            </button>
            <button
              type="button"
              onClick={() => { setQuizMode('sentences'); setScreen('quiz') }}
              className="group flex min-h-32 w-full items-center gap-5 rounded-[1.75rem] bg-[#e6edf9] px-6 py-6 text-left transition hover:bg-[#dbe6f8] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600"
            >
              <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white/70 text-[#4564a3]" aria-hidden="true"><svg viewBox="0 0 48 48" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 10h24a5 5 0 0 1 5 5v15a5 5 0 0 1-5 5H22l-10 7v-7a5 5 0 0 1-5-5V15a5 5 0 0 1 5-5Z" /><path d="M15 20h18M15 27h10" /></svg></span>
              <span className="flex-1 text-2xl font-bold tracking-tight">Sentences</span>
              {sentenceReviewCount > 0 ? (
                <span aria-label={`${sentenceReviewCount} sentences to review`} className="rounded-full bg-white/80 px-2.5 py-1 text-xs font-bold text-blue-800">{sentenceReviewCount}</span>
              ) : null}
              <span aria-hidden="true" className="text-2xl text-[#4564a3] transition-transform group-hover:translate-x-1">›</span>
            </button>
          <button
            type="button"
            onClick={() => setScreen('stories')}
            className="group flex min-h-32 w-full items-center gap-5 rounded-[1.75rem] bg-[#e4f1e9] px-6 py-6 text-left transition hover:bg-[#d7eadd] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700"
          >
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white/70 text-[#3c7b57]" aria-hidden="true"><svg viewBox="0 0 48 48" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M24 14c-5-4-12-4-18-3v26c6-1 13-1 18 3 5-4 12-4 18-3V11c-6-1-13-1-18 3Zm0 0v26" /><path d="M12 20h6m-6 7h6m12-7h6m-6 7h6" /></svg></span>
            <span className="flex-1 text-2xl font-bold tracking-tight">Stories</span>
            <span aria-hidden="true" className="text-2xl text-[#3c7b57] transition-transform group-hover:translate-x-1">›</span>
          </button>
        </nav>
        <p role="status" className={`mt-6 text-center text-xs leading-5 ${syncState === 'saved' ? 'sr-only' : 'text-slate-500'}`}>{syncState === 'saved' ? 'Progress saved' : syncState === 'pending' ? 'Saving…' : 'Progress waiting to sync. Keep this browser data until you reconnect.'}</p>
      </div>
    </main>
  )
}
