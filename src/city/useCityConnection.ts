import { useCallback, useEffect, useRef, useState } from 'react'
import type { CityState } from './world'
import { cloudConnection, type CloudCredentials, type CityConfig, type CityTransport } from './cloudConnection'
type Request = Record<string, unknown>
export function useCityConnection(key: string) {
 const [state, setState] = useState<CityState | null>(null), [credentials, setCredentials] = useState<CloudCredentials | null>(null), [status, setStatus] = useState('idle'), [error, setError] = useState('')
 const transport = useRef<CityTransport | null>(null), intent = useRef<Request | null>(null), saved = useRef<CloudCredentials | null>(null), retry = useRef<ReturnType<typeof setTimeout> | undefined>(undefined), generation = useRef(0)
 const open = useCallback(function openConnection() {
  const version = ++generation.current
  transport.current?.close(); transport.current = null; setStatus('connecting')
  const active = () => generation.current === version
  const reset = (message: string) => { if (!active()) return; setError(message); saved.current = null; sessionStorage.removeItem(key); setCredentials(null); setState(null); setStatus('idle'); transport.current?.close() }
  const joined = (value: CloudCredentials) => { saved.current = value; sessionStorage.setItem(key, JSON.stringify(value)); setCredentials(value); setError('') }
  void fetch('/api/city/config').then(async response => {
   const config = await response.json() as CityConfig & { error?: string }
   if (!response.ok) throw new Error(config.error ?? 'Could not reach the city.')
   if (!active()) return
   if (config.transport === 'realtime') {
    transport.current = cloudConnection(config, intent.current ?? {}, saved.current, event => {
     if (!active()) return
     if (event.type === 'joined') joined(event.credentials)
     if (event.type === 'state') setState(event.state)
     if (event.type === 'error') { if (event.fatal) reset(event.message); else setError(event.message) }
    }, value => { if (active()) setStatus(value) })
    return
   }
   let isJoined = false
   const ws = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/api/city/socket`)
   transport.current = { send: message => { if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(message)) }, close: () => ws.close() }
   ws.onopen = () => { if (active()) ws.send(JSON.stringify(saved.current ? { type: 'resume', ...saved.current } : intent.current)) }
   ws.onmessage = event => {
    if (!active()) return
    const message = JSON.parse(event.data)
    if (message.type === 'joined') { isJoined = true; joined(message.credentials); setStatus('connected') }
    if (message.type === 'state') setState(message.state)
    if (message.type === 'error') { if (!isJoined) reset(message.message); else setError(message.message) }
   }
   ws.onclose = event => {
    if (!active()) return
    if ([4001, 4002].includes(event.code)) { reset(event.reason); return }
    setStatus('disconnected'); if (saved.current) retry.current = setTimeout(openConnection, 1500)
   }
   ws.onerror = () => { if (active()) setError('Could not reach the city. Check your connection.') }
  }).catch(cause => {
   if (!active()) return
   setError(cause instanceof Error ? cause.message : 'Could not reach the city.'); setStatus(saved.current ? 'disconnected' : 'idle')
   if (saved.current) retry.current = setTimeout(openConnection, 2000)
  })
 }, [key])
 const openRef = useRef(open); useEffect(() => { openRef.current = open }, [open])
 const invalidate = useCallback(() => { generation.current++ }, [])
 useEffect(() => {
  try { saved.current = JSON.parse(sessionStorage.getItem(key) ?? 'null') } catch { saved.current = null }
  if (saved.current) openRef.current()
  return () => { invalidate(); clearTimeout(retry.current); transport.current?.close(); transport.current = null }
 }, [key, invalidate])
 const connect = useCallback((request: Request) => { clearTimeout(retry.current); saved.current = null; setCredentials(null); intent.current = request; openRef.current() }, [])
 const send = useCallback((request: Request) => transport.current?.send(request), [])
 return { state, credentials, status, error, connect, send }
}
