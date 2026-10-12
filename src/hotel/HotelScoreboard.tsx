import { useEffect, useState } from 'react'
import { loadHotelScoreboard, type HotelPeriod, type HotelScore } from './scoring'
import './hotel-content.css'

const periods: [HotelPeriod, string][] = [['today', 'Today'], ['week', 'This week'], ['month', 'This month'], ['all', 'All time']]
const date = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Bangkok', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
export default function HotelScoreboard() {
  const [period, setPeriod] = useState<HotelPeriod>('week')
  const [rows, setRows] = useState<HotelScore[]>([])
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState(false)
  const [refresh, setRefresh] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    void loadHotelScoreboard(period, AbortSignal.any([controller.signal, AbortSignal.timeout(12000)]))
      .then(result => { if (!controller.signal.aborted) setRows(result) })
      .catch(() => { if (!controller.signal.aborted) setError(true) })
      .finally(() => { if (!controller.signal.aborted) setBusy(false) })
    return () => controller.abort()
  }, [period, refresh])
  function reload(next = period) { setBusy(true); setError(false); setRows([]); setPeriod(next); setRefresh(value => value + 1) }
  return <section className="hotel-content hotel-scoreboard">
    <div className="hotel-score-title"><h1>Scoreboard</h1><button type="button" onClick={() => reload()} disabled={busy} aria-label="Refresh scores">↻</button></div>
    <div className="hotel-score-periods" aria-label="Score period">{periods.map(([value, label]) => <button type="button" key={value} aria-pressed={period === value} onClick={() => reload(value)}>{label}</button>)}</div>
    {busy ? <p role="status">Loading…</p> : error ? <p role="alert">Could not load scores. <button onClick={() => reload()}>Retry</button></p> : <div className="hotel-content-scroll">
      <table><thead><tr><th scope="col">#</th><th scope="col">Name</th><th scope="col">Points</th><th scope="col">Answers</th><th scope="col">Correct</th><th scope="col">Last active</th></tr></thead>
        <tbody>{rows.map(row => <tr key={row.id}><td>{row.rank}</td><td><span className="hotel-score-name">{row.avatarUrl ? <img src={row.avatarUrl} alt="" loading="lazy" referrerPolicy="no-referrer" onError={event => { event.currentTarget.style.display = 'none' }} /> : null}{row.name}</span></td><td>{row.points}</td><td>{row.answers}</td><td>{row.answers ? `${Math.round(row.correct / row.answers * 100)}%` : '—'}</td><td>{date.format(new Date(row.lastActiveAt))}</td></tr>)}</tbody>
      </table>{!rows.length ? <p>No Hotel learners yet.</p> : null}
    </div>}
  </section>
}
