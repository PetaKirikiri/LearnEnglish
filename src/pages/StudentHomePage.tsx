import { useState } from 'react'
import ReadingPage from './ReadingPage'
import SentenceGlideGame from '../game/SentenceGlideGame'

export default function StudentHomePage({
  displayName,
  onSignOut,
}: {
  displayName: string
  onSignOut: () => void
}) {
  const [screen, setScreen] = useState<'home' | 'stories' | 'game'>('home')

  if (screen === 'game') return <SentenceGlideGame onExit={() => setScreen('home')} />

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
    <main className="min-h-screen overflow-hidden bg-gradient-to-b from-blue-700 via-blue-600 to-sky-100 text-white">
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

        <section className="mt-9 rounded-[2rem] bg-white p-6 text-slate-900 shadow-2xl sm:p-8">
          <div className="flex items-start justify-between gap-5">
            <div>
              <p className="text-sm font-black uppercase tracking-wider text-orange-500">Weekly challenge</p>
              <h2 className="mt-2 text-3xl font-black">Ready to play?</h2>
              <p className="mt-2 max-w-md leading-6 text-slate-600">
                Learn words, answer questions, and build your score for the week.
              </p>
            </div>
            <div className="grid h-20 w-20 shrink-0 place-items-center rounded-3xl bg-orange-100 text-4xl" aria-hidden="true">
              🏆
            </div>
          </div>
          <button
            type="button"
            onClick={() => setScreen('game')}
            className="mt-7 w-full rounded-2xl bg-orange-500 px-6 py-4 text-lg font-black text-white shadow-lg shadow-orange-200 transition hover:bg-orange-600"
          >
            Play Sentence Glide
          </button>
        </section>

        <section className="mt-5 grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setScreen('stories')}
            className="rounded-3xl bg-white/95 p-6 text-left text-slate-900 shadow-lg transition hover:-translate-y-0.5"
          >
            <span className="text-3xl" aria-hidden="true">📖</span>
            <span className="mt-3 block text-xl font-black">Read stories</span>
            <span className="mt-1 block text-sm leading-6 text-slate-500">Practice with all 10 English stories.</span>
          </button>
          <div className="rounded-3xl bg-white/95 p-6 text-slate-900 shadow-lg">
            <span className="text-3xl" aria-hidden="true">⭐</span>
            <span className="mt-3 block text-xl font-black">Your score</span>
            <span className="mt-1 block text-sm leading-6 text-slate-500">Your points and leaderboard will appear here.</span>
          </div>
        </section>
      </div>
    </main>
  )
}
