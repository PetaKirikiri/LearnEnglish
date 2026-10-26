import type { Plugin } from 'vite'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { networkInterfaces } from 'node:os'
import { join } from 'node:path'
import { performance } from 'node:perf_hooks'
import { advanceRace, answer, command, createRoom, joinRoom, prepareRace, RaceError, selectQuestions, viewRoom } from './classroomRace'
import type { Room, RaceStage } from './classroomRace'

type CatalogueStage = {
  id: string; title: string; kind?: RaceStage['kind'];
  questions: { id: string; english: string; audioUrl?: string; correct: number; meaningDistractor?: string; answers: { text: string }[][] }[];
}

// A single, file-backed classroom server on the teacher's laptop. Deliberately
// not mounted in stateless production Functions. Never save races in the browser.
export function classroomRacePlugin(now = () => performance.timeOrigin + performance.now()): Plugin {
  return { name: 'classroom-race', configureServer(server) {
    const directory = join(server.config.root, '.classroom-races')
    let queue = Promise.resolve()
    const loadStages = async (): Promise<RaceStage[]> => {
      const { racePools } = await server.ssrLoadModule('/src/race/pools.ts') as { racePools: CatalogueStage[] }
      return racePools.map(stage => ({ id: stage.id, title: stage.title, kind: stage.kind, questions: stage.questions.map(q => ({
        id: q.id, english: q.english, audioUrl: q.audioUrl ?? '', correct: q.correct,
        ...(q.meaningDistractor ? { meaningDistractor: q.meaningDistractor } : {}),
        choices: q.answers.map(answer => answer.map(segment => segment.text).join('')),
      })) }))
    }
    const selectedStage = async (body: Record<string, unknown>) => {
      const stage = (await loadStages()).find(candidate => candidate.id === body.stage)
      if (!stage) throw new RaceError('Choose a lesson section.')
      return selectQuestions(stage, body.questionIds)
    }
    server.middlewares.use('/api/classroom-race', (req, res) => {
      // Capture before the queue, body parsing or disk I/O can delay a tap.
      // All events use this same monotonic, fractional-millisecond time base.
      const receivedAt = now()
      res.setHeader('Cache-Control', 'no-store')
      const send = (status: number, data: unknown) => { res.statusCode = status; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(data)) }
      const handle = async () => {
        try {
          const url = new URL(req.url ?? '/', 'http://local')
          const address = req.socket.remoteAddress ?? ''
          const local = ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(address)
          const secret = req.headers.authorization?.replace(/^Bearer /, '') ?? ''
          const origin = req.headers.origin
          if (origin && new URL(origin).host !== req.headers.host) { send(403, { error: 'Use the classroom link to connect.' }); return }
          const lan = Object.values(networkInterfaces()).flat().find(n => n?.family === 'IPv4' && !n.internal && /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(n.address))?.address
          const port = (server.httpServer?.address() as { port?: number } | null)?.port ?? 5185
          if (req.method === 'GET' && url.pathname === '/config') {
            send(200, { canHost: local, joinOrigin: lan ? `http://${lan}:${port}` : null }); return
          }
          let body: Record<string, unknown> = {}
          if (req.method === 'POST') {
            let raw = ''
            for await (const chunk of req) { raw += chunk; if (raw.length > 4096) throw new RaceError('Request too large.') }
            body = JSON.parse(raw || '{}') as Record<string, unknown>
            if (!body || typeof body !== 'object' || Array.isArray(body)) throw new RaceError('Send a valid race request.')
          } else if (req.method !== 'GET') { send(405, { error: 'Method not allowed.' }); return }
          await mkdir(directory, { recursive: true, mode: 0o700 })
          const save = async (room: Room) => { const path = join(directory, `${room.id}.json`); await writeFile(`${path}.tmp`, JSON.stringify(room), { mode: 0o600 }); await rename(`${path}.tmp`, path) }
          if (req.method === 'POST' && url.pathname === '/create') {
            if (!local) { send(403, { error: 'Open the host screen on the teacher’s laptop.' }); return }
            const room = createRoom(await selectedStage(body), receivedAt); await save(room)
            send(200, { room: room.id, token: room.host }); return
          }
          const id = url.searchParams.get('room') ?? ''
          if (!/^[A-F0-9]{10}$/.test(id)) throw new RaceError('This race link is not valid.')
          let room: Room
          try { room = JSON.parse(await readFile(join(directory, `${id}.json`), 'utf8')) as Room } catch { send(404, { error: 'This race was not found. Scan the current QR code.' }); return }
          if (receivedAt - room.createdAt > 24 * 3600_000) { send(410, { error: 'This race has ended. Ask your teacher for a new code.' }); return }
          if (room.version !== 2) { send(410, { error: 'Create a new race to use the continuous-speed format.' }); return }
          room.run ??= 1
          if (!room.stageId) {
            room.stageId = (await loadStages()).find(stage => room.pool.every(question => stage.questions.some(candidate => candidate.id === question.id)))?.id ?? ''
          }
          if (req.method === 'POST' && ['/answer', '/control', '/prepare'].includes(url.pathname)) {
            if (typeof body.run !== 'number' || !Number.isSafeInteger(body.run) || body.run < 1) throw new RaceError('Include the current race number.')
            if (body.run !== room.run) throw new RaceError('This race has changed. Refresh and try again.')
            if (['/control', '/prepare'].includes(url.pathname) && secret !== room.host) { send(403, { error: 'Only the host can control the race.' }); return }
          }
          if (advanceRace(room, receivedAt)) await save(room)
          if (req.method === 'POST') {
            if (url.pathname === '/join') joinRoom(room, String(body.name ?? ''), secret)
            else if (url.pathname === '/answer') answer(room, secret, Number(body.round), Number(body.choice), receivedAt, body.run as number)
            else if (url.pathname === '/control') command(room, secret, String(body.action), Number(body.round), receivedAt, body.run as number)
            else if (url.pathname === '/prepare') prepareRace(room, secret, await selectedStage(body), body.run as number, receivedAt)
            else throw new RaceError('Unknown race action.')
            await save(room)
          }
          const view = viewRoom(room, secret, now())
          if (secret === room.host && lan) view.joinUrl = `http://${lan}:${port}/english/race/join/${room.id}`
          send(200, view)
        } catch (error) { send(error instanceof RaceError ? error.status : 500, { error: error instanceof RaceError ? error.message : 'Could not save or load the race. Please try again.' }) }
      }
      // Serialize mutations and reads so simultaneous taps cannot overwrite one another.
      queue = queue.then(handle, handle)
    })
  } }
}
