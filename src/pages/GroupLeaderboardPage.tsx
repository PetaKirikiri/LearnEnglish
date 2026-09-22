import { useState } from 'react'
import { useMemberLeaderboard, type LeaderboardPeriod } from '../learning/useMemberLeaderboard'
import MemberAvatar from '../ui/MemberAvatar'
import { leaderboardAnswerDate, leaderboardDateRange } from '../learning/leaderboardDates'

export default function GroupLeaderboardPage({ userId, onExit, embedded = false }: { userId: string; onExit: () => void; onPlay: () => void; embedded?: boolean }) {
  const [period, setPeriod] = useState<LeaderboardPeriod>('week')
  const current = useMemberLeaderboard(userId, period)
  const leader = current?.rows?.find(row => row.rank === 1 && row.points > 0)
  const dateRange = leaderboardDateRange(current?.periodStart, current?.periodEnd)

  const Container = embedded ? 'section' : 'main'
  return <Container aria-label="Leaderboard" className={`leaderboard-screen ${embedded ? '' : 'game-surface min-h-[100dvh] px-5 py-6'}`}>
    <div className={embedded ? 'w-full' : 'mx-auto max-w-lg'}>
      <div className="profile-navigation"><button aria-label="Back to lesson" onClick={onExit} className="collection-back">← Back to practice</button><h1>Leaderboard</h1></div>
      <div className="leaderboard-panel">
      <div role="group" aria-label="Score period" className="score-period flex gap-1 rounded-xl p-1">
        {([['today', 'Today'], ['week', 'This week'], ['month', 'This month']] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={period === value} onClick={() => setPeriod(value)} className={`min-h-11 flex-1 rounded-lg px-2 text-sm font-semibold ${period === value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>{label}</button>)}
      </div>
      <p className="leaderboard-dates" aria-live="polite">{dateRange && <><span>{dateRange}</span><span>Bangkok time</span></>}</p>
      {leader && <div role="img" aria-label={`First place: ${leader.name}`} className="leader-podium mx-auto mb-6 flex max-w-sm items-center justify-center gap-3">
        <img src="/brand/ranks/champion-cup-v1.png" alt="" className="leader-trophy" width={168} height={168} />
        <span aria-hidden="true" title={leader.name} className="flex min-w-0 items-center gap-2 break-words text-2xl font-bold leading-tight text-[#a66e19] sm:text-3xl"><MemberAvatar name={leader.name} url={leader.avatarUrl} />{leader.name}</span>
      </div>}
      {!current && <div role="status" aria-label="Loading scores" className="space-y-5 py-6">{[1,2,3].map(n => <div key={n} aria-hidden="true" className="flex items-center gap-4"><span className="h-8 w-8 rounded-full bg-slate-200" /><span className="h-3 w-28 rounded bg-slate-200" /><span className="ml-auto h-3 w-10 rounded bg-slate-200" /></div>)}</div>}
      {current?.rows && <ol aria-label="Rankings">{current.rows.map(row => <li key={row.id} data-self={row.id === userId} className="ranking-row flex min-h-20 items-center gap-4 px-3">
        <span aria-label={row.points ? `Rank ${row.rank}` : 'Unranked'} className={`w-7 text-center text-lg font-semibold tabular-nums ${row.rank === 1 && row.points > 0 ? 'text-amber-700' : 'text-slate-400'}`}>{row.points ? row.rank : '—'}</span>
        <MemberAvatar name={row.name} url={row.avatarUrl} />
        <span className="min-w-0 flex-1 break-words font-semibold">{row.name}
          {row.answers !== undefined && <span className="leaderboard-activity">{row.answers} {row.answers === 1 ? 'answer' : 'answers'}</span>}
          {row.lastAnsweredAt ? <span className="leaderboard-last-answer">Last answer <time dateTime={row.lastAnsweredAt}>{leaderboardAnswerDate(row.lastAnsweredAt)}</time></span>
            : row.answers !== undefined && <span className="leaderboard-last-answer">No answers yet</span>}
        </span>
        <span aria-label={`${row.points} points`} className="text-xl font-semibold tabular-nums">{row.points}</span>
      </li>)}</ol>}
      {current?.rows?.length === 0 && !current.error && <p className="py-8 text-center text-sm text-slate-500">No scores yet.</p>}
      {current?.error && <p role="status" className="py-5 text-sm text-slate-500">{current.error}</p>}
      </div>
    </div>
  </Container>
}
