import { useEffect, useState } from 'react'
import { flushProgress, getSyncState, importLocalProgress, trackProgress } from './progressSync'

const visits = new Map<string, string>()

export function useLearningActivity(userId: string | undefined, displayName: string | null, enabled: boolean) {
  const [syncState, setSyncState] = useState(() => userId ? getSyncState(userId) : 'saved')
  useEffect(() => {
    if (!userId || !enabled) return
    if (!visits.has(userId)) {
      visits.set(userId, crypto.randomUUID())
      trackProgress(userId, 'visit', {}, visits.get(userId))
    }
    void importLocalProgress(userId, displayName ?? 'Player')
    let lastInteraction = Date.now()
    let lastTick = Date.now()
    const onInteraction = () => { lastInteraction = Date.now() }
    const tick = () => {
      const now = Date.now()
      const seconds = Math.min(15, (now - lastTick) / 1000)
      lastTick = now
      if (document.visibilityState === 'visible' && now - lastInteraction <= 60_000 && seconds >= 1) {
        trackProgress(userId, 'active_time', { seconds: Math.round(seconds) })
      }
      void flushProgress(userId)
    }
    const onVisible = () => { lastTick = Date.now(); if (document.visibilityState === 'visible') lastInteraction = Date.now() }
    const updateSync = () => setSyncState(getSyncState(userId))
    const interval = window.setInterval(tick, 15_000)
    window.addEventListener('pointerdown', onInteraction)
    window.addEventListener('keydown', onInteraction)
    window.addEventListener('online', tick)
    window.addEventListener('fifa-progress-sync', updateSync)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener('pointerdown', onInteraction)
      window.removeEventListener('keydown', onInteraction)
      window.removeEventListener('online', tick)
      window.removeEventListener('fifa-progress-sync', updateSync)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [userId, displayName, enabled])
  return syncState
}
