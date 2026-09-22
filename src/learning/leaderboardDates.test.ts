import { expect, it } from 'vitest'
import { leaderboardAnswerDate, leaderboardDateRange } from './leaderboardDates'

it('shows inclusive Bangkok day, Monday week and month ranges', () => {
  expect(leaderboardDateRange('2026-09-22', '2026-09-23')).toBe('22 Sept 2026')
  expect(leaderboardDateRange('2026-09-21', '2026-09-28')).toBe('21–27 Sept 2026')
  expect(leaderboardDateRange('2026-09-01', '2026-10-01')).toBe('1–30 Sept 2026')
  expect(leaderboardDateRange('2026-12-28', '2027-01-04')).toBe('28 Dec 2026 – 3 Jan 2027')
})

it('uses Bangkok time across midnight, regardless of device timezone', () => {
  expect(leaderboardAnswerDate('2026-09-20T17:05:00Z')).toBe('21 Sept 2026, 00:05')
  expect(leaderboardAnswerDate('2026-09-20T16:59:00Z')).toBe('20 Sept 2026, 23:59')
})

it('does not fabricate a date range for missing or invalid API dates', () => {
  expect(leaderboardDateRange()).toBeNull()
  expect(leaderboardDateRange('broken', '2026-10-01')).toBeNull()
  expect(leaderboardDateRange('2026-10-02', '2026-10-01')).toBeNull()
})
