// @vitest-environment node
import { createServer, request, type IncomingMessage, type ServerResponse } from 'node:http'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { ViteDevServer } from 'vite'
import { expect, it } from 'vitest'
import { classroomRacePlugin } from './classroomRacePlugin'
import { command, createRoom, joinRoom, type Room } from './classroomRace'
import { speedFor } from '../src/race/rules'
import type { RaceView } from '../src/race/types'
import { racePools } from '../src/race/pools'

it('scores fractional arrival times even when processing is held beyond the deadline', async () => {
  const root = await mkdtemp(join(tmpdir(), 'race-timing-'))
  const room = createRoom({ id: 'timing', title: 'Timing', questions: [
    { id: 'man', english: 'A man', audioUrl: '', choices: ['man', 'woman'], correct: 0 },
    { id: 'woman', english: 'A woman', audioUrl: '', choices: ['man', 'woman'], correct: 1 },
  ] }, 0)
  const keys = ['a'.repeat(48), 'b'.repeat(48)]
  keys.forEach((key, i) => joinRoom(room, `Rider ${i}`, key))
  command(room, room.host, 'start', -1, 0)
  await mkdir(join(root, '.classroom-races'))
  const file = join(root, '.classroom-races', `${room.id}.json`)
  await writeFile(file, JSON.stringify(room))

  let time = room.opensAt + 1234.5
  let onArrival = () => {}
  let handler: (req: IncomingMessage, res: ServerResponse) => void = () => {}
  const server = createServer((req, res) => handler(req, res))
  const plugin = classroomRacePlugin(() => { onArrival(); return time })
  const configure = plugin.configureServer
  if (typeof configure !== 'function') throw new Error('Missing race middleware')
  configure.call({} as never, {
    config: { root }, httpServer: server,
    middlewares: { use: (_path: string, middleware: typeof handler) => { handler = middleware } },
  } as unknown as ViteDevServer)
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  const port = (server.address() as { port: number }).port
  const body = JSON.stringify({ run: 1, round: 0, choice: room.deck[0].correct })
  const pending = (key: string) => {
    let req!: ReturnType<typeof request>
    const result = new Promise<{ status: number; view: RaceView }>((resolve, reject) => {
      req = request({ hostname: '127.0.0.1', port, path: `/answer?room=${room.id}`, method: 'POST', headers: {
        Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body),
      } }, res => {
        let data = ''
        res.on('data', chunk => { data += chunk })
        res.on('end', () => resolve({ status: res.statusCode!, view: JSON.parse(data) }))
      })
      req.on('error', reject)
      req.flushHeaders()
    })
    return { req, result }
  }
  try {
    let arrived = new Promise<void>(resolve => { onArrival = resolve })
    const first = pending(keys[0])
    await arrived
    time = room.opensAt + 1234.75
    arrived = new Promise<void>(resolve => { onArrival = resolve })
    const second = pending(keys[1])
    await arrived
    // Both taps reached the server on time. Hold the first body, and therefore
    // the second queued request, until the processing clock is past five seconds.
    time = room.closesAt + 1000
    first.req.end(body)
    second.req.end(body)
    const responses = await Promise.all([first.result, second.result])
    responses.forEach(response => expect(response.status).toBe(200))
    const saved = JSON.parse(await readFile(file, 'utf8')) as Room
    expect(saved.round).toBe(1)
    expect(saved.players[0].targetSpeed).toBeCloseTo(speedFor(true, 1234.5), 10)
    expect(saved.players[1].targetSpeed).toBeCloseTo(speedFor(true, 1234.75), 10)
    expect(saved.players[0].targetSpeed).toBeGreaterThan(saved.players[1].targetSpeed)
    expect(saved.updatedAt).toBe(room.opensAt + 1234.75)
  } finally {
    server.closeAllConnections()
    await new Promise<void>(resolve => server.close(() => resolve()))
    await rm(root, { recursive: true, force: true })
  }
})

it('filters host content, preserves the classroom roster and rejects stale or unauthorized API actions', async () => {
  const root = await mkdtemp(join(tmpdir(), 'race-session-'))
  let time = 1000
  let handler: (req: IncomingMessage, res: ServerResponse) => void = () => {}
  const server = createServer((req, res) => {
    Object.defineProperty(req.socket, 'remoteAddress', { configurable: true, value: req.headers['x-test-remote'] ?? '127.0.0.1' })
    handler(req, res)
  })
  const plugin = classroomRacePlugin(() => time)
  if (typeof plugin.configureServer !== 'function') throw new Error('Missing race middleware')
  plugin.configureServer.call({} as never, {
    config: { root }, httpServer: server,
    ssrLoadModule: async () => ({ racePools }),
    middlewares: { use: (_path: string, middleware: typeof handler) => { handler = middleware } },
  } as unknown as ViteDevServer)
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  const port = (server.address() as { port: number }).port
  const api = async (path: string, body?: unknown, secret?: string, room?: string, remote?: string) => {
    const response = await fetch(`http://127.0.0.1:${port}/${path}${room ? `?room=${room}` : ''}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { ...(secret ? { Authorization: `Bearer ${secret}` } : {}), ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...(remote ? { 'x-test-remote': remote } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    return { status: response.status, data: await response.json() as RaceView & { room: string; token: string; error?: string } }
  }
  const selected = ['race-where-taxi-complete', 'race-where-taxi-missing-is']
  try {
    expect((await api('create', { stage: 'where-is-the' }, undefined, undefined, '192.168.1.12')).status).toBe(403)
    for (const questionIds of [[], [selected[0]], [selected[0], selected[0]], [selected[0], 'not-from-this-pool'], ['race-where-taxi-missing-is', 'race-where-hotel-missing-the']]) {
      expect((await api('create', { stage: 'where-is-the', questionIds })).status).toBe(400)
    }
    const created = await api('create', { stage: 'where-is-the', questionIds: [...selected].reverse() })
    expect(created.status).toBe(200)
    const { room, token: host } = created.data
    const file = join(root, '.classroom-races', `${room}.json`)
    const hostView = await api('state', undefined, host, room)
    expect(hostView.data).toMatchObject({ run: 1, stageId: 'where-is-the', questionIds: selected, phase: 'lobby' })
    const playerToken = 'd'.repeat(48)
    const joined = await api('join', { name: 'Learner' }, playerToken, room)
    expect(joined.status).toBe(200)
    expect(joined.data.questionIds).toBeUndefined()
    expect(JSON.stringify(joined.data)).not.toContain(host)
    const playerId = joined.data.me!.id
    for (const run of [undefined, '1', 0, 1.5]) {
      expect((await api('control', { action: 'start', round: -1, run }, host, room)).status).toBe(400)
    }
    expect((await api('prepare', { stage: 'who-what', run: 1 }, playerToken, room)).status).toBe(403)
    expect((await api('control', { action: 'start', round: -1, run: 1 }, playerToken, room)).status).toBe(403)
    expect((await api('control', { action: 'start', round: -1, run: 1 }, host, room)).status).toBe(200)
    expect((await api('prepare', { stage: 'who-what', run: 1 }, host, room)).status).toBe(400)
    const running = JSON.parse(await readFile(file, 'utf8')) as Room
    time = running.opensAt + 1234.5
    expect((await api('answer', { round: 0, choice: running.deck[0].correct }, playerToken, room)).status).toBe(400)
    expect((await api('answer', { run: 1, round: 0, choice: running.deck[0].correct }, playerToken, room)).status).toBe(200)
    time += 1000
    expect((await api('control', { run: 1, round: 0, action: 'finish' }, host, room)).status).toBe(200)
    const prepared = await api('prepare', { run: 1, stage: 'who-what' }, host, room)
    expect(prepared.status).toBe(200)
    expect(prepared.data).toMatchObject({ id: room, run: 2, stageId: 'who-what', phase: 'lobby', round: -1 })
    expect(prepared.data.players).toEqual([{ id: playerId, name: 'Learner', lane: 0, metres: 0, speed: 0, targetSpeed: 0, accelerationRemainingMs: 0, streak: 0, answered: false }])
    expect(prepared.data.questionIds).toEqual(racePools.find(pool => pool.id === 'who-what')!.questions.map(q => q.id))
    const beforeStale = await readFile(file, 'utf8')
    for (const [path, body] of [
      ['prepare', { run: 1, stage: 'where-is-the' }],
      ['control', { run: 1, round: -1, action: 'start' }],
      ['control', { run: 1, round: 0, action: 'finish' }],
      ['answer', { run: 1, round: 0, choice: 0 }],
    ] as const) {
      expect((await api(path, body, path === 'answer' ? playerToken : host, room)).status).toBe(400)
      expect(await readFile(file, 'utf8')).toBe(beforeStale)
    }
    const rejoined = await api('join', { name: 'Learner' }, playerToken, room)
    expect(rejoined.data.me?.id).toBe(playerId)
    expect(rejoined.data.players).toHaveLength(1)
    expect((await api('control', { run: 2, round: -1, action: 'start' }, host, room)).status).toBe(200)
    const secondRace = JSON.parse(await readFile(file, 'utf8')) as Room
    time = secondRace.opensAt + .125
    const answered = await api('answer', { run: 2, round: 0, choice: secondRace.deck[0].correct }, playerToken, room)
    expect(answered.status).toBe(200)
    expect(answered.data.players[0].targetSpeed).toBeCloseTo(speedFor(true, .125), 10)
    expect(answered.data.questionIds).toBeUndefined()
    const afterAnswer = JSON.parse(await readFile(file, 'utf8')) as Room
    expect(answered.data.question?.english).toBe(afterAnswer.deck[afterAnswer.round].english)
    expect(answered.data.question?.correct).toBeUndefined()

    const legacy = createRoom({ id: 'man-woman', title: 'People', questions: racePools[0].questions.map(q => ({ id: q.id, english: q.english, audioUrl: q.audioUrl ?? '', choices: q.answers.map(a => a.map(s => s.text).join('')), correct: q.correct })) }, time)
    delete legacy.run
    delete legacy.stageId
    await writeFile(join(root, '.classroom-races', `${legacy.id}.json`), JSON.stringify(legacy))
    const legacyView = await api('state', undefined, legacy.host, legacy.id)
    expect(legacyView.data).toMatchObject({ run: 1, stageId: 'man-woman' })

    const meaningIds = ['race-meaning-taxi', 'race-meaning-hotel']
    expect((await api('create', { stage: 'holiday-meaning', questionIds: [meaningIds[0]] })).status).toBe(400)
    const meaningCreated = await api('create', { stage: 'holiday-meaning', questionIds: meaningIds })
    expect(meaningCreated.status).toBe(200)
    const meaningRoom = JSON.parse(await readFile(join(root, '.classroom-races', `${meaningCreated.data.room}.json`), 'utf8')) as Room

    expect(meaningRoom.kind).toBe('meaning')
    expect(meaningRoom.pool.map(q => q.id)).toEqual(meaningIds)
    meaningRoom.pool.forEach(q => {
      const authored = racePools.find(pool => pool.id === 'holiday-meaning')!.questions.find(question => question.id === q.id)!
      expect(q.choices.toSorted()).toEqual(authored.answers.map(answer=>answer.map(segment=>segment.text).join('')).toSorted())
      expect(q.meaningDistractor).toBe(authored.meaningDistractor)
      expect(q.meaningDistractor).toBeTruthy()
    })
    expect((await api('control', { run: 2, round: 0, action: 'finish' }, host, room)).status).toBe(200)
    const preparedMeanings = await api('prepare', { run: 2, stage: 'holiday-meaning', questionIds: meaningIds }, host, room)
    expect(preparedMeanings.status).toBe(200)
    expect(preparedMeanings.data).toMatchObject({ run: 3, stageId: 'holiday-meaning', questionIds: meaningIds })
    const savedMeanings = JSON.parse(await readFile(file, 'utf8')) as Room
    savedMeanings.pool.forEach(q => {
      expect(q.meaningDistractor).toBe(meaningRoom.pool.find(question => question.id === q.id)!.meaningDistractor)
    })
    expect((await api('control', { run: 3, round: -1, action: 'start' }, host, room)).status).toBe(200)
    const meaningPhone = await api('state', undefined, playerToken, room)
    expect(meaningPhone.data.question).not.toHaveProperty('meaningDistractor')
    expect(meaningPhone.data.question?.correct).toBeUndefined()
    expect(meaningPhone.data.question?.english).toEqual(expect.any(String))
    expect(meaningPhone.data.question?.correct).toBeUndefined()
  } finally {
    server.closeAllConnections()
    await new Promise<void>(resolve => server.close(() => resolve()))
    await rm(root, { recursive: true, force: true })
  }
})
