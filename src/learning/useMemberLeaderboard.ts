import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type Row = { id: string; name: string; rank: number; points: number; avatarUrl?: string | null; answers?: number; lastAnsweredAt?: string | null }
export type LeaderboardPeriod = 'today' | 'week' | 'month'
type Board = { rows: Row[]; champion?: Row | null; periodStart?: string; periodEnd?: string; timeZone?: string }
type Result = Partial<Board> & { userId: string; period: LeaderboardPeriod; error?: string }

export function useMemberLeaderboard(userId: string, period: LeaderboardPeriod = 'week') {
  const [result, setResult] = useState<Result | null>(null)
  const [refresh, setRefresh] = useState(0)
  useEffect(() => {
    if (!supabase) return
    let active = true
    void (async () => {
      try {
        const board = period === 'week' ? await supabase.rpc('fifa_english_leaderboard')
          : await supabase.rpc('fifa_english_leaderboard_period', { target_period: period })
        if (board.error) throw board.error
        if (active) {
          const data = board.data as Board
          setResult({ ...data, userId, period, rows: data.rows, champion: data.champion ?? data.rows.find(row => row.rank === 1 && row.points > 0) })
        }
      } catch {
        if (active) setResult(old => ({ ...(old?.userId === userId && old.period === period ? old : {}), userId, period, error: 'Scores unavailable. Retrying…' }))
      }
    })()
    return () => { active = false }
  }, [userId, period, refresh])

  useEffect(() => {
    const update = () => { if (document.visibilityState === 'visible') setRefresh(n => n + 1) }
    const timer = window.setInterval(update, 30000)
    document.addEventListener('visibilitychange', update)
    window.addEventListener('fifa-progress-sync', update)
    window.addEventListener('online', update)
    window.addEventListener('focus', update)
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', update); window.removeEventListener('fifa-progress-sync', update); window.removeEventListener('online', update); window.removeEventListener('focus', update) }
  }, [])
  return result?.userId === userId && result.period === period ? result : null
}
