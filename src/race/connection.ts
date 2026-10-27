import { useCallback, useEffect, useRef, useState } from 'react'
import type { RaceCredential, RaceView } from './types'

// Do not reuse a laptop-only room when the local UI connects to public races.
export const HOST_KEY = import.meta.env.DEV ? 'english-race:public-host' : 'english-race:host'
export function savedRace(key: string): RaceCredential | null {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? 'null')
    return value && typeof value.room === 'string' && typeof value.token === 'string' ? value : null
  } catch { return null }
}
export async function raceRequest<T>(path: string, credentials?: RaceCredential | null, body?: unknown): Promise<T> {
  const response = await fetch(`/api/classroom-race/${path}${credentials ? `?room=${credentials.room}` : ''}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { ...(credentials ? { Authorization: `Bearer ${credentials.token}` } : {}), ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(6000), cache: 'no-store',
  })
  if (!(response.headers.get('content-type') ?? '').includes('application/json')) throw new Error('The public race server is unavailable. Please retry.')
  const data = await response.json()
  if (!response.ok) throw new Error(data.error ?? 'Could not connect. Please try again.')
  return data as T
}

// The admin and display share only their host credential. Race state remains
// authoritative on the classroom server, including when a tab is reopened.
export function useRaceConnection(key: string, onRoundChange?: () => void) {
  const [credentials, setCredentials] = useState<RaceCredential | null>(() => savedRace(key))
  const [view, setView] = useState<RaceView | null>(null)
  const [connection, setConnection] = useState('')
  const [now, setNow] = useState(() => Date.now())
  const clock = useRef({ server: 0, local: 0 })
  const currentRound = useRef('')
  const sync = useCallback((next: RaceView) => {
    if (next.serverNow < clock.current.server) return
    const round = `${next.id}:${next.run}:${next.round}`
    if (currentRound.current !== round) { currentRound.current = round; onRoundChange?.() }
    clock.current = { server: next.serverNow, local: performance.now() }
    setNow(next.serverNow); setView(next); setConnection('')
  }, [onRoundChange])
  const remember = useCallback((value: RaceCredential) => {
    localStorage.setItem(key, JSON.stringify(value))
    clock.current = { server: 0, local: 0 }; currentRound.current = ''
    setCredentials(value); setView(null); setConnection('')
  }, [key])
  const forget = useCallback(() => {
    localStorage.removeItem(key); setCredentials(null); setView(null); setConnection('')
    clock.current = { server: 0, local: 0 }; currentRound.current = ''
  }, [key])
  useEffect(() => {
    const changed = (event: StorageEvent) => {
      if (event.key !== key) return
      clock.current = { server: 0, local: 0 }; currentRound.current = ''
      setCredentials(savedRace(key)); setView(null); setConnection('')
    }
    window.addEventListener('storage', changed)
    return () => window.removeEventListener('storage', changed)
  }, [key])
  useEffect(() => {
    if (!credentials) return
    let active = true, timer: ReturnType<typeof setTimeout>
    const poll = async () => {
      try { const next = await raceRequest<RaceView>('state', credentials); if (active) sync(next) }
      catch (cause) { if (active) setConnection(cause instanceof Error ? cause.message : 'Connection lost. Reconnecting…') }
      if (active) timer = setTimeout(poll, 350)
    }
    void poll()
    return () => { active = false; clearTimeout(timer) }
  }, [credentials, sync])
  useEffect(() => {
    const timer = setInterval(() => setNow(clock.current.server + performance.now() - clock.current.local), 60)
    return () => clearInterval(timer)
  }, [])
  return { credentials, view, now, connection, sync, remember, forget, currentRound }
}
