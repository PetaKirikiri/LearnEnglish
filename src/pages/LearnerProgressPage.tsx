import { useEffect, useMemo, useState } from 'react'
import { readings } from '../content/readings'
import { thaiTranslations } from '../content/thaiTranslations.generated'
import { getQuizCatalogue, type QuizQuestion } from '../learning/quizContent'
import { questionProgressKey, summarizeProgress, type ProgressEvent } from '../learning/progressData'
import { loadLearnerEvents } from '../learning/progressSync'
import { supabase } from '../lib/supabase'
import { buildWordData } from '../lib/wordData'

const catalogue = getQuizCatalogue()
const words = buildWordData(readings).ranking
const vocabulary = new Map(catalogue.vocabulary.map(question => [question.spokenText, question]))
const wordStatuses = ['All words', 'Learned', 'Practising', 'Needs review', 'Not started', 'Not in vocabulary'] as const
const dateFormat = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
function showDate(value: string | null) { return value ? dateFormat.format(new Date(value)) : 'No activity recorded' }
function dayKey(date: Date) { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(date) }
function meaning(question: QuizQuestion) { return question.prompt === question.spokenText ? question.answer : question.prompt }

export default function LearnerProgressPage() {
  const [learners, setLearners] = useState<{ id: string; display_name: string }[]>([])
  const [learnerId, setLearnerId] = useState('')
  const [events, setEvents] = useState<ProgressEvent[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [refresh, setRefresh] = useState(0)
  const [updated, setUpdated] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('All words')
  const [page, setPage] = useState(0)
  const [openedAt] = useState(() => Date.now())

  useEffect(() => {
    let active = true
    void (async () => {
      const admin = await supabase.rpc('fifa_english_is_admin')
      if (!active) return
      if (admin.error || !admin.data) {
        setError(admin.error ? 'Progress reporting is unavailable. Please refresh to try again.' : 'An administrator account is required to view learner progress.')
        setLoading(false)
        return
      }
      const result = await supabase.rpc('fifa_english_learners')
      if (!active) return
      if (result.error) { setError('Could not load learner accounts. Please refresh to try again.'); setLoading(false); return }
      const list = result.data as { id: string; display_name: string }[]
      setLearners(list)
      setLearnerId(list.find(learner => learner.display_name?.toLowerCase() === 'fifa')?.id ?? list[0]?.id ?? '')
      if (!list.length) setLoading(false)
    })()
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!learnerId) return
    let active = true
    void loadLearnerEvents(learnerId).then(data => {
      if (!active) return
      setEvents(data)
      setUpdated(new Date().toISOString())
      setError('')
      setLoading(false)
    }).catch(() => {
      if (!active) return
      setError('Could not refresh progress. Check your connection and try again; the last loaded figures may be out of date.')
      setLoading(false)
    })
    return () => { active = false }
  }, [learnerId, refresh])

  useEffect(() => {
    const interval = window.setInterval(() => { if (document.visibilityState === 'visible') setRefresh(value => value + 1) }, 30_000)
    return () => window.clearInterval(interval)
  }, [])

  const summary = useMemo(() => summarizeProgress(events), [events])
  const rows = words.map(({ word, count }) => {
    const question = vocabulary.get(word)
    const progress = question ? summary.items.get(questionProgressKey(question)) : undefined
    return { word, count, question, progress, status: question ? progress?.status ?? 'Not started' : 'Not in vocabulary' }
  })
  const learned = rows.filter(row => row.status === 'Learned').length
  const practised = rows.filter(row => row.progress).length
  const review = rows.filter(row => row.status === 'Needs review').length
  const filtered = rows.filter(row => (statusFilter === 'All words' || row.status === statusFilter) && `${row.word} ${thaiTranslations[row.word] ?? ''}`.toLowerCase().includes(search.trim().toLowerCase()))
  const totalAttempts = summary.correct + summary.wrong
  const sentencePractised = catalogue.sentences.filter(question => summary.items.has(questionProgressKey(question))).length
  const sentenceLearned = catalogue.sentences.filter(question => summary.items.get(questionProgressKey(question))?.status === 'Learned').length
  const name = learners.find(learner => learner.id === learnerId)?.display_name ?? 'Learner'
  const recentDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date((updated ? Date.parse(updated) : openedAt) - (6 - index) * 86_400_000)
    const dayEvents = events.filter(event => event.kind === 'answer' && dayKey(new Date(event.occurred_at)) === dayKey(date))
    return { date, attempts: dayEvents.length, correct: dayEvents.filter(event => event.payload.correct).length }
  })
  const maxDaily = Math.max(1, ...recentDays.map(day => day.attempts))

  return (
    <section className="mx-auto max-w-5xl space-y-6">
      <header className="rounded-3xl bg-white p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div><p className="text-xs font-bold uppercase tracking-widest text-blue-700">Learning progress</p><h1 className="mt-2 text-3xl font-black">{name}’s progress</h1><p className="mt-2 text-sm text-slate-500">Last active: {showDate(summary.lastActive)}</p></div>
          <label className="w-full text-sm font-bold sm:w-56">Learner<select aria-label="Learner" value={learnerId} onChange={event => { setLearnerId(event.target.value); setEvents([]); setUpdated(null); setLoading(true); setPage(0) }} className="mt-2 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 font-normal">{learners.map(learner => <option key={learner.id} value={learner.id}>{learner.display_name || 'Unnamed learner'}</option>)}</select></label>
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500"><p role="status">{loading ? 'Loading saved progress…' : updated ? `Updated ${showDate(updated)} · Refreshes every 30 seconds` : 'No progress loaded'}</p><button type="button" disabled={!learnerId || loading} onClick={() => { setLoading(true); setRefresh(value => value + 1) }} className="rounded-lg border border-slate-200 px-3 py-2 font-bold text-blue-700 disabled:opacity-40">Refresh</button></div>
      </header>

      {error && <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-900">{error}</p>}
      {learnerId && !loading && !error && events.length === 0 && <p className="rounded-2xl border border-blue-200 bg-blue-50 p-5 leading-7 text-blue-950">No learning activity has synced for {name} yet. Have him refresh the app on his phone and begin a lesson. These figures will update as he practises. Earlier logins and practice time were not recorded.</p>}

      {learnerId && (!loading || updated) && <>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { title: 'Words learned', value: `${learned} / ${catalogue.vocabulary.length}`, note: 'Vocabulary words in lessons' },
            { title: 'Words practised', value: practised, note: `${catalogue.vocabulary.length - practised} not started` },
            { title: 'Words to review', value: review, note: 'Last answer was incorrect' },
            { title: 'Answer accuracy', value: totalAttempts ? `${Math.round(summary.correct / totalAttempts * 100)}%` : '—', note: `${totalAttempts} recorded answers` },
          ].map(card => <div key={card.title} className="rounded-2xl bg-white p-5"><p className="text-sm font-bold text-slate-500">{card.title}</p><strong className="mt-3 block text-3xl text-blue-900">{card.value}</strong><p className="mt-2 text-xs text-slate-500">{card.note}</p></div>)}
        </div>

        <section className="rounded-3xl bg-white p-6">
          <h2 className="text-xl font-black">Course progress</h2>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label="Vocabulary learned" aria-valuemin={0} aria-valuemax={catalogue.vocabulary.length} aria-valuenow={learned}><div className="h-full rounded-full bg-emerald-500" style={{ width: `${learned / catalogue.vocabulary.length * 100}%` }} /></div>
          <p className="mt-3 text-sm text-slate-600">{learned} words learned · {sentenceLearned} of {catalogue.sentences.length} sentence questions learned ({sentencePractised} attempted)</p>
          <p className="mt-3 text-sm leading-6 text-slate-500">“Learned” means correct in three separate rounds since the last mistake. It measures performance on the current exercises. The stories contain {words.length} different words; {catalogue.vocabulary.length} are currently in vocabulary lessons.</p>
          {learned === catalogue.vocabulary.length && sentenceLearned === catalogue.sentences.length && <p className="mt-4 font-bold text-emerald-700">All current exercises learned.</p>}
        </section>

        <div className="grid gap-6 sm:grid-cols-2">
          <section className="rounded-3xl bg-white p-6"><h2 className="text-xl font-black">App use</h2><dl className="mt-5 grid grid-cols-2 gap-5">{[['App visits', summary.visits], ['Sign-ins', summary.logins], ['Active minutes', Math.floor(summary.seconds / 60)], ['Rounds completed', summary.rounds]].map(([label, value]) => <div key={label}><dt className="text-sm text-slate-500">{label}</dt><dd className="mt-1 text-2xl font-bold">{value}</dd></div>)}</dl><p className="mt-5 text-xs leading-5 text-slate-500">Visits count opening the student app; sign-ins count successful logins. Active time is approximate and pauses when the page is hidden or idle for a minute. Tracking began: {showDate(summary.firstTracked)}.</p></section>
          <section className="rounded-3xl bg-white p-6"><h2 className="text-xl font-black">Answers in the last 7 days</h2><div className="mt-5 flex h-36 items-end gap-2">{recentDays.map(day => <div key={dayKey(day.date)} className="flex flex-1 flex-col items-center gap-2 text-xs"><span>{day.attempts}</span><div className="w-full rounded-t-md bg-blue-500" style={{ height: `${Math.max(2, day.attempts / maxDaily * 80)}px` }} title={`${day.correct} correct out of ${day.attempts}`} /><span>{day.date.toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'Asia/Bangkok' })}</span></div>)}</div><p className="mt-4 text-xs text-slate-500">Bangkok dates. Earlier imported totals are not assigned to individual days.</p></section>
        </div>

        <section className="overflow-hidden rounded-3xl bg-white">
          <div className="p-6"><h2 className="text-xl font-black">Word by word</h2><div className="mt-4 grid gap-3 sm:grid-cols-2"><input aria-label="Search words" placeholder="Search English or Thai…" value={search} onChange={event => { setSearch(event.target.value); setPage(0) }} className="min-w-0 rounded-xl border border-slate-300 px-4 py-3" /><select aria-label="Word progress" value={statusFilter} onChange={event => { setStatusFilter(event.target.value); setPage(0) }} className="rounded-xl border border-slate-300 bg-white px-4 py-3">{wordStatuses.map(status => <option key={status}>{status}</option>)}</select></div><p className="mt-3 text-sm text-slate-500">{filtered.length} words · Showing {filtered.length ? Math.min(page * 30 + 1, filtered.length) : 0}–{Math.min((page + 1) * 30, filtered.length)}</p></div>
          <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50"><tr>{['Word / Thai', 'Progress', 'Correct', 'Wrong', 'Successful rounds', 'Last answer'].map(label => <th key={label} className="whitespace-nowrap px-5 py-3">{label}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{filtered.slice(page * 30, (page + 1) * 30).map(row => <tr key={row.word}><td className="px-5 py-4"><strong className="text-base">{row.word}</strong><span lang="th" className="mt-1 block text-slate-500">{row.question ? meaning(row.question) : thaiTranslations[row.word] || '—'}</span></td><td className="px-5 py-4"><span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold ${row.status === 'Learned' ? 'bg-emerald-100 text-emerald-800' : row.status === 'Needs review' ? 'bg-orange-100 text-orange-800' : 'bg-slate-100 text-slate-600'}`}>{row.status}</span></td><td className="px-5 py-4">{row.progress?.correct ?? 0}</td><td className="px-5 py-4">{row.progress?.wrong ?? 0}</td><td className="px-5 py-4">{row.question ? `${Math.min(3, row.progress?.correctRounds.size ?? 0)} / 3` : '—'}</td><td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">{row.progress?.lastAnswered ? showDate(row.progress.lastAnswered) : '—'}</td></tr>)}</tbody></table></div>
          {filtered.length === 0 && <p className="p-6 text-slate-500">No words match this filter.</p>}
          <div className="flex justify-between p-5"><button disabled={page === 0} onClick={() => setPage(value => value - 1)} className="rounded-xl border px-4 py-2 font-bold disabled:opacity-30">Previous</button><button disabled={(page + 1) * 30 >= filtered.length} onClick={() => setPage(value => value + 1)} className="rounded-xl border px-4 py-2 font-bold disabled:opacity-30">Next</button></div>
        </section>
        <p className="text-xs leading-5 text-slate-500">Earlier answer totals are imported once when that learner opens the updated app in the browser where they practised. Their original round history is unknown, so it cannot establish mastery. Activity on another phone appears after it syncs.</p>
      </>}
    </section>
  )
}
