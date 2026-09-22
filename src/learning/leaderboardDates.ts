const bangkok = 'Asia/Bangkok'

// The API returns calendar dates with an exclusive end. Format independently of
// the viewer's device timezone, using an inclusive end for the visible range.
export function leaderboardDateRange(start?: string, end?: string) {
  if (!start || !end) return null
  const first = new Date(`${start}T00:00:00+07:00`)
  const last = new Date(new Date(`${end}T00:00:00+07:00`).getTime() - 1)
  if (!Number.isFinite(first.getTime()) || !Number.isFinite(last.getTime()) || last < first) return null
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: bangkok }).formatRange(first, last)
}

export function leaderboardAnswerDate(timestamp: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: bangkok,
  }).format(new Date(timestamp))
}
