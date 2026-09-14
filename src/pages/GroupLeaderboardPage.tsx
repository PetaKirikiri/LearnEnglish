import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type Row = { id: string; name: string; rank: number; points: number }
type Result = { userId: string; rows?: Row[]; error?: string }

export default function GroupLeaderboardPage({ userId, onExit }: { userId: string; onExit: () => void; onPlay: () => void }) {
  const [result, setResult] = useState<Result | null>(null)
  const [refresh, setRefresh] = useState(0)
  const current = result?.userId === userId ? result : null
  const leader = current?.rows?.find(row => row.rank === 1 && row.points > 0)

  useEffect(() => {
    let active = true
    void (async () => {
      try {
        // Includes all FIFA English members, even without a group or any points.
        const board = await supabase.rpc('fifa_english_leaderboard')
        if (board.error) throw board.error
        if (active) setResult({ userId, rows: (board.data as { rows: Row[] }).rows })
      } catch {
        if (active) setResult(old => ({ userId, rows: old?.userId === userId ? old.rows : undefined, error: 'Scores unavailable. Retrying…' }))
      }
    })()
    return () => { active = false }
  }, [userId, refresh])

  useEffect(() => {
    const update = () => { if (document.visibilityState === 'visible') setRefresh(n => n + 1) }
    const timer = window.setInterval(update, 30000)
    document.addEventListener('visibilitychange', update)
    window.addEventListener('fifa-progress-sync', update)
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', update); window.removeEventListener('fifa-progress-sync', update) }
  }, [])

  return <main aria-label="Leaderboard" className="min-h-[100dvh] bg-[#f7f7f3] px-5 py-6 text-slate-900">
    <div className="mx-auto max-w-lg">
      <button aria-label="Back to lesson" onClick={onExit} className="icon-button mb-6 text-2xl">‹</button>
      {leader && <div role="img" aria-label={`First place: ${leader.name}`} className="mx-auto mb-6 flex max-w-sm items-center justify-center gap-3">
        <svg aria-hidden="true" viewBox="0 0 240 210" className="h-[126px] w-[144px] shrink-0 sm:h-[147px] sm:w-[168px]">
          <defs>
            <linearGradient id="leader-cup-gold" x1="0" x2="1">
              <stop stopColor="#b77912" /><stop offset=".32" stopColor="#ffe49a" /><stop offset=".65" stopColor="#efbc47" /><stop offset="1" stopColor="#c38a22" />
            </linearGradient>
          </defs>
          <path d="M64 38H32v27c0 32 19 48 48 48M176 38h32v27c0 32-19 48-48 48" fill="none" stroke="#cf9a2e" strokeWidth="12" />
          <path d="M63 22h114v49c0 45-22 69-57 69S63 116 63 71V22Z" fill="url(#leader-cup-gold)" stroke="#c4912c" strokeWidth="2" />
          <path d="M111 140h18v31h-18zM92 171h56l10 14H82z" fill="url(#leader-cup-gold)" />
          <rect x="69" y="185" width="102" height="17" rx="4" fill="#a66e19" />
          <path d="M75 30h90" stroke="#fff0bd" strokeWidth="3" strokeLinecap="round" />
        </svg>
        <span aria-hidden="true" title={leader.name} className="min-w-0 break-words text-2xl font-bold leading-tight text-[#a66e19] sm:text-3xl">{leader.name}</span>
      </div>}
      {!current && <div role="status" aria-label="Loading scores" className="space-y-5 py-6">{[1,2,3].map(n => <div key={n} aria-hidden="true" className="flex items-center gap-4"><span className="h-8 w-8 rounded-full bg-slate-200" /><span className="h-3 w-28 rounded bg-slate-200" /><span className="ml-auto h-3 w-10 rounded bg-slate-200" /></div>)}</div>}
      {current?.rows && <ol aria-label="Rankings">{current.rows.map(row => <li key={row.id} className={`flex min-h-20 items-center gap-4 border-b border-slate-200 px-3 ${row.id === userId ? 'rounded-xl bg-white' : ''}`}>
        <span aria-label={row.points ? `Rank ${row.rank}` : 'Unranked'} className={`w-7 text-center text-lg font-semibold tabular-nums ${row.rank === 1 && row.points > 0 ? 'text-amber-700' : 'text-slate-400'}`}>{row.points ? row.rank : '—'}</span>
        <span className="min-w-0 flex-1 break-words font-semibold">{row.name}</span>
        <span aria-label={`${row.points} points`} className="text-xl font-semibold tabular-nums">{row.points}</span>
      </li>)}</ol>}
      {current?.rows?.length === 0 && !current.error && <p className="py-8 text-center text-sm text-slate-500">No scores yet.</p>}
      {current?.error && <p role="status" className="py-5 text-sm text-slate-500">{current.error}</p>}
    </div>
  </main>
}
