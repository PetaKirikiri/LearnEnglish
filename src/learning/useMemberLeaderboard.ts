import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type Row = { id: string; name: string; rank: number; points: number }
type Result = { userId: string; rows?: Row[]; champion?: Row | null; error?: string }

export function useMemberLeaderboard(userId: string) {
  const [result, setResult] = useState<Result | null>(null)
  const [refresh, setRefresh] = useState(0)
  useEffect(() => {
    if (!supabase) return
    let active = true
    void (async () => {
      try {
        const board = await supabase.rpc('fifa_english_leaderboard')
        if (board.error) throw board.error
        if (active) {
          const data = board.data as { rows: Row[]; champion?: Row | null }
          setResult({ userId, rows: data.rows, champion: data.champion ?? data.rows.find(row => row.rank === 1 && row.points > 0) })
        }
      } catch {
        if (active) setResult(old => ({ ...(old?.userId === userId ? old : {}), userId, error: 'Scores unavailable. Retrying…' }))
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
  return result?.userId === userId ? result : null
}
