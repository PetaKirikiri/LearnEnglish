import { useCallback, useEffect, useRef, useState } from 'react'
import { CityPrediction } from './prediction'
import type { CityState } from './world'

export function useCityPrediction(state: CityState | null, playerId: string | undefined, enabled: boolean, send: (message: Record<string, unknown>) => void) {
 const [prediction] = useState(() => new CityPrediction())
 const latest = useRef({ state, playerId, enabled, send })
 const receivedAt = useRef(0)
 const [stale, setStale] = useState(false)
 useEffect(() => { latest.current = { state, playerId, enabled, send } }, [state, playerId, enabled, send])
 useEffect(() => { receivedAt.current = performance.now() }, [state])
 useEffect(() => {
  let frame = 0, previous = performance.now(), lastSend = 0, lastState: CityState | null = null, wasActive = false, isStale = false
  const flush = () => { const commands = prediction.unsent(); if (commands.length) latest.current.send({ type: 'move', commands }) }
  const stop = () => { prediction.setInput(0, 0); flush() }
  function tick(now: number) {
   const current = latest.current, player = current.state?.players.find(p => p.id === current.playerId)
   const staleNow = now - receivedAt.current > 1200
   if (staleNow !== isStale) { isStale = staleNow; setStale(staleNow) }
   const active = current.enabled && !document.hidden && !staleNow && !!player?.online
   if (player && (current.state !== lastState || wasActive !== active)) {
    if (!active && wasActive) stop()
    prediction.reconcile(player, current.state!.now, active)
    lastState = current.state
   }
   prediction.step((now - previous) / 1000, active)
   if (active && now - lastSend >= 100) { flush(); lastSend = now }
   previous = now; wasActive = active
   frame = requestAnimationFrame(tick)
  }
  window.addEventListener('blur', stop); document.addEventListener('visibilitychange', stop)
  frame = requestAnimationFrame(tick)
  return () => { cancelAnimationFrame(frame); stop(); window.removeEventListener('blur', stop); document.removeEventListener('visibilitychange', stop) }
 }, [prediction])
 const move = useCallback((x: number, y: number) => {
  if (!latest.current.enabled || document.hidden || performance.now() - receivedAt.current > 1200) return
  prediction.setInput(x, y)
  if (x === 0 && y === 0) { const commands = prediction.unsent(); if (commands.length) latest.current.send({ type: 'move', commands }) }
 }, [prediction])
 return { prediction, move, stale }
}
