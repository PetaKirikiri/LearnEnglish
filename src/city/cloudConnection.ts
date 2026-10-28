import { createClient, type RealtimeChannel } from '@supabase/supabase-js'
import { CityRoom } from './CitySimulation'
import { cityCipher, cityIdentity, type CityIdentity, type SealedMessage } from './cloudProtocol'
import type { CityCredentials, CityState } from './world'

type Request = Record<string, unknown>
export type CloudCredentials = CityCredentials & { identity?: CityIdentity }
type Member = { id: string; name: string; avatar: number; publicKey: JsonWebKey }
type Joined = { credentials: CityCredentials; topic: string; secret: string; publicKey: JsonWebKey; lease?: string; members?: Member[]; snapshot?: CityState | null }
export type CityConfig = { transport?: string; url?: string; anon?: string }
export type CityTransport = { send(message: Request): void; close(): void }
type Event = { type: 'joined'; credentials: CloudCredentials } | { type: 'state'; state: CityState } | { type: 'error'; message: string; fatal?: boolean }
export function cloudConnection(config: CityConfig, request: Request, saved: CloudCredentials | null, emit: (event: Event) => void, status: (value: string) => void): CityTransport {
 let closed = false, cleanup = () => {}
 let dispatch: (message: Request) => void = () => {}
 const controller = new AbortController()
 const transport = { send: (message: Request) => dispatch(message), close: () => { closed = true; controller.abort(); cleanup() } }
 async function api(action: string, body: Request, token = ''): Promise<Joined> {
  const response = await fetch(`/api/city/${action}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(body), signal: AbortSignal.any([controller.signal, AbortSignal.timeout(10000)]) })
  const result = await response.json()
  if (!response.ok) throw Object.assign(new Error(result.error ?? 'Could not connect to the city.'), { fatal: response.status === 403 || response.status === 404 })
  return result
 }
 async function start() {
  const identity = saved?.identity ?? await cityIdentity()
  const joined = await api(saved ? 'resume' : String(request.type), saved ? { code: saved.code } : { ...request, publicKey: identity.publicKey }, saved?.token)
  if (closed) return
  const credentials = { ...joined.credentials, identity }, host = credentials.role === 'host', ownId = credentials.playerId ?? 'host'
  emit({ type: 'joined', credentials })
  const cipher = await cityCipher(joined.secret, identity)
  await cipher.trust('host', joined.publicKey)
  const client = createClient(config.url!, config.anon!, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }, realtime: { params: { eventsPerSecond: 30 } } })
  const channels = new Map<string, RealtimeChannel>(), ready = new Set<string>(), timers: ReturnType<typeof setInterval>[] = []
  cleanup = () => { timers.forEach(clearInterval); void client.removeAllChannels() }
  if (closed) { cleanup(); return }
  let outbound = Promise.resolve(), inbound = Promise.resolve(), pending = 0
  const report = (error: unknown) => { if (!closed) emit({ type: 'error', message: error instanceof Error ? error.message : 'City connection interrupted.' }) }
  function channel(name: string, onMessage: (sender: string, body: Request) => void) {
   const c = client.channel(`${joined.topic}:${name}`, { config: { broadcast: { self: false, ack: false } } })
   channels.set(name, c)
   c.on('broadcast', { event: 'city' }, ({ payload }) => {
    if (closed || pending > 80) return
    pending++
    inbound = inbound.then(async () => { const message = await cipher.open(payload as SealedMessage); if (!closed && message) onMessage(message.sender, message.body) }).catch(report).finally(() => { pending-- })
   }).subscribe(value => {
    if (closed) return
    if (value === 'SUBSCRIBED') ready.add(name)
    else { ready.delete(name); if (name === 'state') status('disconnected') }
   })
   return c
  }
  function broadcast(name: string, body: Request) {
   if (closed || !ready.has(name)) return
   outbound = outbound.then(async () => {
    if (closed || !ready.has(name)) return
    const payload = await cipher.seal(ownId, body)
    if (!closed) await channels.get(name)?.send({ type: 'broadcast', event: 'city', payload })
   }).catch(report)
  }
  if (host) {
   const room = new CityRoom(); room.code = credentials.code
   if (joined.snapshot) { room.target = joined.snapshot.target; room.paused = joined.snapshot.paused; for (const p of joined.snapshot.players) room.players.set(p.id, { ...p, dx: 0, dy: 0, online: false }) }
   channel('state', () => {})
   const heard = new Map<string, number>(), known = new Set<string>()
   let leaseAt = Date.now(), syncing = false, previous = Date.now(), lastBroadcast = 0
   const removals = new Set<string>()
   async function roster(members: Member[]) {
    if (closed) return
    const ids = new Set(members.map(m => m.id))
    for (const id of known) if (!ids.has(id)) {
     known.delete(id); room.players.delete(id); cipher.forget(id); ready.delete(id)
     const old = channels.get(id); if (old) { await client.removeChannel(old); channels.delete(id) }
    }
    for (const member of members) {
     if (known.has(member.id)) continue
     await cipher.trust(member.id, member.publicKey)
     if (closed) return
     known.add(member.id)
     if (!room.players.has(member.id)) {
      const temporary = room.join(member.name, member.avatar, Date.now()), player = room.players.get(temporary.playerId)!
      room.players.delete(temporary.playerId); room.tokens.delete(temporary.token); room.lastInput.delete(temporary.playerId)
      room.players.set(member.id, { ...player, id: member.id, online: false })
     }
     channel(member.id, (sender, body) => {
      if (sender !== member.id || !known.has(sender) || Date.now() - leaseAt > 7000) return
      const now = Date.now(), player = room.players.get(sender)!
      heard.set(sender, now); player.online = true
      try {
       if (body.type === 'move') room.commands(sender, body.commands, now)
       else if (body.type === 'input') room.input(sender, body.x, body.y, now)
       else if (body.type === 'action' && !room.paused) room.action(sender, body.action, now)
      } catch { /* Invalid input cannot change another player or the teacher's settings. */ }
     })
    }
    // Never revive removed players from an older recovery checkpoint.
    for (const id of room.players.keys()) if (!ids.has(id)) room.players.delete(id)
   }
   await roster(joined.members ?? [])
   if (closed) { cleanup(); return }
   async function sync(requestedRemoval?: string) {
    if (requestedRemoval) removals.add(requestedRemoval)
    if (syncing || closed) return
    const remove = removals.values().next().value
    syncing = true
    try {
     const result = await api(remove ? 'remove' : 'sync', { code: credentials.code, lease: joined.lease, ...(remove ? { playerId: remove } : { snapshot: room.state(Date.now()) }) }, credentials.token)
     if (!closed) { await roster(result.members ?? []); leaseAt = Date.now(); if (remove) removals.delete(remove) }
    } catch (error) {
     if ((error as { fatal?: boolean }).fatal) { transport.close(); emit({ type: 'error', message: (error as Error).message, fatal: true }) }
     else report(error)
    } finally { syncing = false }
   }
   dispatch = message => {
    if (message.type !== 'control' || Date.now() - leaseAt > 7000) return
    if (message.action === 'remove') { void sync(String(message.value)); return }
    try { room.control(room.hostToken, message.action, message.value) } catch (error) { report(error) }
   }
   timers.push(setInterval(() => { void sync() }, 2000))
   timers.push(setInterval(() => {
    if (closed) return
    const now = Date.now(), active = ready.has('state') && now - leaseAt < 7000
    if (!active) { previous = now; status('disconnected'); return }
    room.tick((now - previous) / 1000, now); previous = now
    for (const p of room.players.values()) if (now - (heard.get(p.id) ?? 0) > 2500) room.disconnect(p.id)
    if (now - lastBroadcast >= 100) { const state = room.state(now); emit({ type: 'state', state }); status('connected'); broadcast('state', { type: 'state', state }); lastBroadcast = now }
   }, 1000 / 30))
  } else {
   let hasAppeared = false, lastState = 0
   channel('state', (sender, body) => {
    if (sender !== 'host' || body.type !== 'state') return
    const state = body.state as CityState
    if (state.code !== credentials.code || !Array.isArray(state.players) || state.now <= lastState) return
    lastState = state.now
    const present = state.players.some(p => p.id === ownId)
    if (!present && hasAppeared) { transport.close(); emit({ type: 'error', message: 'Your teacher removed you from this city. You can join again.', fatal: true }); return }
    hasAppeared ||= present
    emit({ type: 'state', state }); status('connected')
   })
   channel(ownId, () => {})
   dispatch = message => { if (['move', 'input', 'action'].includes(String(message.type))) broadcast(ownId, message) }
   timers.push(setInterval(() => broadcast(ownId, { type: 'ping' }), 600))
  }
 }
 void start().catch(error => { if (!closed) { cleanup(); emit({ type: 'error', message: error instanceof Error ? error.message : 'Could not connect to the city.', fatal: true }) } })
 return transport
}
