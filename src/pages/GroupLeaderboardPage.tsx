import { useState } from 'react'
import { useMemberLeaderboard, type LeaderboardPeriod } from '../learning/useMemberLeaderboard'
import MemberAvatar from '../ui/MemberAvatar'

export default function GroupLeaderboardPage({ userId, onExit }: { userId: string; onExit: () => void; onPlay: () => void }) {
  const [period, setPeriod] = useState<LeaderboardPeriod>('week')
  const current = useMemberLeaderboard(userId, period)
  const leader = current?.rows?.find(row => row.rank === 1 && row.points > 0)

  return <main aria-label="Leaderboard" className="min-h-[100dvh] bg-[#f7f7f3] px-5 py-6 text-slate-900">
    <div className="mx-auto max-w-lg">
      <button aria-label="Back to lesson" onClick={onExit} className="icon-button mb-6 text-2xl">‹</button>
      <div role="group" aria-label="Score period" className="mb-6 flex gap-1 rounded-xl bg-[#e8eadf] p-1">
        {([['today', 'Today'], ['week', 'This week'], ['month', 'This month']] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={period === value} onClick={() => setPeriod(value)} className={`min-h-11 flex-1 rounded-lg px-2 text-sm font-semibold ${period === value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>{label}</button>)}
      </div>
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
        <span aria-hidden="true" title={leader.name} className="flex min-w-0 items-center gap-2 break-words text-2xl font-bold leading-tight text-[#a66e19] sm:text-3xl"><MemberAvatar name={leader.name} url={leader.avatarUrl} />{leader.name}</span>
      </div>}
      {!current && <div role="status" aria-label="Loading scores" className="space-y-5 py-6">{[1,2,3].map(n => <div key={n} aria-hidden="true" className="flex items-center gap-4"><span className="h-8 w-8 rounded-full bg-slate-200" /><span className="h-3 w-28 rounded bg-slate-200" /><span className="ml-auto h-3 w-10 rounded bg-slate-200" /></div>)}</div>}
      {current?.rows && <ol aria-label="Rankings">{current.rows.map(row => <li key={row.id} className={`flex min-h-20 items-center gap-4 border-b border-slate-200 px-3 ${row.id === userId ? 'rounded-xl bg-white' : ''}`}>
        <span aria-label={row.points ? `Rank ${row.rank}` : 'Unranked'} className={`w-7 text-center text-lg font-semibold tabular-nums ${row.rank === 1 && row.points > 0 ? 'text-amber-700' : 'text-slate-400'}`}>{row.points ? row.rank : '—'}</span>
        <MemberAvatar name={row.name} url={row.avatarUrl} />
        <span className="min-w-0 flex-1 break-words font-semibold">{row.name}</span>
        <span aria-label={`${row.points} points`} className="text-xl font-semibold tabular-nums">{row.points}</span>
      </li>)}</ol>}
      {current?.rows?.length === 0 && !current.error && <p className="py-8 text-center text-sm text-slate-500">No scores yet.</p>}
      {current?.error && <p role="status" className="py-5 text-sm text-slate-500">{current.error}</p>}
    </div>
  </main>
}
