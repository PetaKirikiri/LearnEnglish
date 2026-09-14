import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { buildLeaderboard } from '../learning/leaderboard'
import type { ProgressEvent } from '../learning/progressData'

export default function LeaderboardPage() {
  const [rows, setRows] = useState<ReturnType<typeof buildLeaderboard>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updated, setUpdated] = useState<Date | null>(null)
  const [refresh, setRefresh] = useState(0)
  useEffect(() => {
    let active = true
    async function load() {
      try {
        const admin = await supabase.rpc('fifa_english_is_admin')
        if (admin.error || !admin.data) throw new Error('Admin access required.')
        const learners = await supabase.rpc('fifa_english_learners')
        if (learners.error) throw learners.error
        const events: ProgressEvent[] = []
        for (let offset = 0; ; offset += 1000) {
          const result = await supabase.from('fifa_english_events').select('*').in('kind', ['answer', 'legacy_import', 'round_completed']).order('occurred_at').order('id').range(offset, offset + 999)
          if (result.error) throw result.error
          events.push(...result.data as ProgressEvent[])
          if (result.data.length < 1000) break
        }
        if (!active) return
        setRows(buildLeaderboard(learners.data as { id: string; display_name: string }[], events))
        setUpdated(new Date())
        setError('')
      } catch {
        if (active) setError('Could not load the leaderboard. Try refreshing. Any figures below are from the last successful update.')
      } finally { if (active) setLoading(false) }
    }
    void load()
    return () => { active = false }
  }, [refresh])
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') setRefresh(value => value + 1)
    }, 30000)
    return () => window.clearInterval(timer)
  }, [])
  return (
    <section className="mx-auto max-w-3xl space-y-5">
      <header className="rounded-3xl bg-blue-900 p-6 text-white sm:p-8">
        <p className="text-xs font-bold uppercase tracking-widest text-blue-200">All-time learning</p>
        <h1 className="mt-2 text-3xl font-black">Leaderboard</h1>
        <details className="mt-3 text-xs leading-6 text-slate-500"><summary className="w-fit cursor-pointer font-semibold">Ranking</summary><p className="mt-3 text-sm leading-6 text-blue-100">Ranked by words and sentence exercises learned, then answer accuracy. Equal results share a rank.</p></details>
      </header>
      <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
        <p role="status">{loading ? 'Loading results…' : updated ? `Updated ${updated.toLocaleTimeString()} · Refreshes every 30 seconds` : 'No results loaded'}</p>
        <button disabled={loading} onClick={() => { setLoading(true); setRefresh(value => value + 1) }} className="rounded-xl bg-white px-4 py-3 font-bold text-blue-700 disabled:opacity-50">Refresh</button>
      </div>
      {error && <p role="alert" className="rounded-2xl bg-red-50 p-5 text-red-900">{error}</p>}
      {!loading && !error && rows.length === 0 && <p className="rounded-3xl bg-white p-8 text-slate-600">No learner answers have synced yet. Rankings will appear when learners start practising.</p>}
      {rows.length > 0 && <ol className="space-y-3" aria-label="Learner rankings">
        {rows.map(row => <li key={row.id} className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blue-50 text-xl font-black text-blue-800" aria-label={`Rank ${row.rank}`}>{row.rank}</span>
            <h2 className="min-w-0 flex-1 break-words text-xl font-black">{row.display_name || 'Learner'}</h2>
            <div className="text-right"><strong className="block text-2xl text-blue-800">{row.learned}</strong><span className="text-xs text-slate-500">learned</span></div>
          </div>
          <dl className="mt-5 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            {[["Words", row.words], ["Sentences", row.sentences], ["Accuracy", `${Math.round(row.accuracy * 100)}%`], ["Answers", row.attempts]].map(([label, value]) => <div key={label}><dt className="text-slate-500">{label}</dt><dd className="mt-1 font-bold">{value}</dd></div>)}
          </dl>
          <p className="mt-3 text-xs text-slate-500">{row.rounds} rounds completed</p>
        </li>)}
      </ol>}
      <details className="mt-3 text-xs leading-6 text-slate-500"><summary className="w-fit cursor-pointer font-semibold">Ranking</summary><p className="text-xs leading-6 text-slate-500">Learned means correct in three separate rounds since the last mistake. Only current course exercises count. Earlier imported answers count towards accuracy but cannot prove learning. Peta and accounts without answers are excluded. Results update after practice syncs.</p></details>
    </section>
  )
}
