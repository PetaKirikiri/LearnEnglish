import type { IncomingMessage, ServerResponse } from 'node:http'
import { performance } from 'node:perf_hooks'
import { advanceRace, answer, command, createRoom, joinRoom, prepareRace, RaceError, selectQuestions, viewRoom, type Room, type RaceStage } from './classroomRace'
import { racePools } from '../src/race/pools'
import { publicRaceOrigin, publicRaceJoinUrl } from '../src/race/publicLinks'

type RecordState = { id: string; revision: number; state: Room }
export type RaceStore = {
  insert(room: Room): Promise<void>
  read(id: string): Promise<RecordState | null>
  save(id: string, revision: number, room: Room): Promise<boolean>
}
export function cloudStore(): RaceStore {
  const origin = process.env.RACE_SUPABASE_URL
  const key = process.env.RACE_SUPABASE_SERVICE_KEY
  if (!origin || !key) throw new Error('Race storage is not configured')
  const base = `${origin}/rest/v1/english_classroom_rooms`
  async function request(path: string, method = 'GET', body?: unknown): Promise<RecordState[]> {
    const result = await fetch(base + path, { method, headers: { apikey: key!, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=representation' }, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(7000), cache: 'no-store' })
    if (!result.ok) throw new Error(`Race storage request failed (${result.status})`)
    return result.json()
  }
  return {
    async insert(room) { await request('', 'POST', { id: room.id, state: room }) },
    async read(id) { return (await request(`?id=eq.${id}&select=id,revision,state`))[0] ?? null },
    async save(id, revision, state) { return (await request(`?id=eq.${id}&revision=eq.${revision}`, 'PATCH', { state, revision: revision + 1 })).length === 1 },
  }
}
function selectedStage(body: Record<string, unknown>): RaceStage {
  const source = racePools.find(pool => pool.id === body.stage)
  if (!source) throw new RaceError('Choose a lesson section.')
  return selectQuestions({ ...source, questions: source.questions.map(q => ({ id: q.id, english: q.english, audioUrl: q.audioUrl ?? '', correct: q.correct, meaningDistractor: q.meaningDistractor, choices: q.answers.map(a => a.map(s => s.text).join('')) })) }, body.questionIds)
}
function fail(message: string, status = 400): never { const error = new RaceError(message); error.status = status; throw error }
export async function cloudAction(store: RaceStore, action: string, method: string, id: string, secret: string, body: Record<string, unknown>, origin: string, receivedAt: number, now = () => performance.timeOrigin + performance.now()) {
  if (method === 'GET' && action === 'config') return { canHost: true, joinOrigin: origin }
  if (method === 'POST' && action === 'create') {
    const room = createRoom(selectedStage(body), receivedAt)
    await store.insert(room)
    return { room: room.id, token: room.host }
  }
  if (!['state', 'join', 'answer', 'control', 'prepare'].includes(action)) fail('Unknown race action.', 404)
  if ((action === 'state' && method !== 'GET') || (action !== 'state' && method !== 'POST')) fail('Use the correct request method.', 405)
  if (!/^[A-F0-9]{10}$/.test(id)) fail('This race link is not valid.')
  for (let attempt = 0; attempt < 16; attempt++) {
    const stored = await store.read(id)
    if (!stored) fail('This race was not found. Scan the current QR code.', 404)
    const room = stored.state
    if (receivedAt - room.createdAt > 24 * 3600_000) fail('This race has ended. Ask your teacher for a new code.', 410)
    if (room.version !== 2) fail('Ask your teacher for a new race.', 410)
    if (['answer', 'control', 'prepare'].includes(action)) {
      if (typeof body.run !== 'number' || !Number.isSafeInteger(body.run) || body.run < 1 || body.run !== (room.run ?? 1)) fail('This race has changed. Refresh and try again.')
      if (action !== 'answer' && secret !== room.host) fail('Only the host can control the race.', 403)
    }
    const previousRound = room.round, previousPhase = room.phase
    advanceRace(room, receivedAt)
    if (action === 'join') joinRoom(room, String(body.name ?? ''), secret)
    if (action === 'answer') answer(room, secret, Number(body.round), Number(body.choice), receivedAt, body.run as number)
    if (action === 'control') command(room, secret, String(body.action), Number(body.round), receivedAt, body.run as number)
    if (action === 'prepare') prepareRace(room, secret, selectedStage(body), body.run as number, receivedAt)
    // During a round, reads project motion without writing. Only boundary draws
    // need a shared commit, so every phone receives the same random question.
    const changed = method === 'POST' || room.round !== previousRound || room.phase !== previousPhase
    if (changed && !await store.save(id, stored.revision, room)) continue
    const view = viewRoom(room, secret, now())
    if (secret === room.host) view.joinUrl = publicRaceJoinUrl(room.id)
    return view
  }
  fail('The classroom is busy. Try again.', 409)
}
export default async function handler(req: IncomingMessage & { body?: unknown }, res: ServerResponse) {
  const receivedAt = performance.timeOrigin + performance.now()
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('Content-Type', 'application/json')
  try {
    const host = req.headers.host
    if (!host || !/^[a-zA-Z0-9.:-]+$/.test(host)) fail('Invalid classroom address.')
    const origin = `https://${host}`
    if (req.headers.origin && new URL(req.headers.origin).origin !== origin) fail('Use the classroom link to connect.', 403)
    const url = new URL(req.url ?? '/', origin)
    const action = url.pathname.split('/').pop() ?? ''
    const method = req.method ?? 'GET'
    if (!['GET', 'POST'].includes(method)) fail('Use GET or POST.', 405)
    let body: Record<string, unknown> = {}
    if (method === 'POST') {
      if (!req.headers['content-type']?.startsWith('application/json')) fail('Send a JSON request.', 415)
      let raw = req.body === undefined ? '' : typeof req.body === 'string' ? req.body : JSON.stringify(req.body)
      if (req.body === undefined) for await (const chunk of req) { raw += chunk; if (raw.length > 4096) fail('Request too large.', 413) }
      if (raw.length > 4096) fail('Request too large.', 413)
      try { body = JSON.parse(raw || '{}') } catch { fail('Send a valid race request.') }
      if (!body || typeof body !== 'object' || Array.isArray(body)) fail('Send a valid race request.')
    }
    const secret = req.headers.authorization?.replace(/^Bearer /, '') ?? ''
    const result = await cloudAction(cloudStore(), action, method, url.searchParams.get('room') ?? '', secret, body, publicRaceOrigin, receivedAt)
    res.statusCode = 200
    res.end(JSON.stringify(result))
  } catch (error) {
    if (!(error instanceof RaceError)) console.error('Classroom race request failed', error instanceof Error ? error.message : 'Unknown error')
    res.statusCode = error instanceof RaceError ? error.status : 503
    res.end(JSON.stringify({ error: error instanceof RaceError ? error.message : 'Could not connect to the race. Please try again.' }))
  }
}
