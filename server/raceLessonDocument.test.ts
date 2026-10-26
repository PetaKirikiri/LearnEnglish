// @vitest-environment node
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import type { ViteDevServer } from 'vite'
import * as Y from 'yjs'
import { expect, it } from 'vitest'
import { applySnapshot, raceLessonStore, snapshotOf } from './raceLessonDocument'
import { raceLessonPlugin } from './raceLessonPlugin'

it('keeps the editable lesson and concurrent edits after reopening the file store', async () => {
  const root = await mkdtemp(join(tmpdir(), 'race-notes-'))
  const first = new Y.Doc(), second = new Y.Doc(), reopened = new Y.Doc()
  try {
    const store = raceLessonStore(root)
    const original = await store()
    applySnapshot(first, original); applySnapshot(second, original)
    expect(first.getXmlFragment('default').toString()).toContain('Where is the…?')
    expect(first.getXmlFragment('default').toString()).toContain('holidaywords')
    first.getMap('teacher-notes').set('first', 'One change at a time')
    second.getMap('teacher-notes').set('second', 'Keep the frame familiar')
    await Promise.all([store(snapshotOf(first)), store(snapshotOf(second))])
    const restored = await raceLessonStore(root)()
    applySnapshot(reopened, restored)
    expect(reopened.getMap('teacher-notes').toJSON()).toEqual({ first: 'One change at a time', second: 'Keep the frame familiar' })
    expect(reopened.getXmlFragment('default').toString()).toBe(first.getXmlFragment('default').toString())
    await expect(store('not valid')).rejects.toThrow()
    expect(await store()).toBe(restored)
  } finally { first.destroy(); second.destroy(); reopened.destroy(); await rm(root, { recursive: true, force: true }) }
})

it('lets students read, restricts editing to the teacher laptop, and rejects cross-origin writes', async () => {
  const root = await mkdtemp(join(tmpdir(), 'race-notes-api-'))
  let handler: (req: IncomingMessage, res: ServerResponse) => void = () => {}
  const server = createServer((req, res) => {
    Object.defineProperty(req.socket, 'remoteAddress', { configurable: true, value: req.headers['x-test-remote'] ?? '127.0.0.1' })
    handler(req, res)
  })
  const plugin = raceLessonPlugin()
  if (typeof plugin.configureServer !== 'function') throw new Error('Missing middleware')
  plugin.configureServer.call({} as never, { config: { root }, middlewares: { use: (_path: string, next: typeof handler) => { handler = next } } } as unknown as ViteDevServer)
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  const url = `http://127.0.0.1:${(server.address() as { port: number }).port}/`
  try {
    const student = await fetch(url, { headers: { 'x-test-remote': '192.168.1.12' } })
    const data = await student.json()
    expect(data.canEdit).toBe(false)
    expect(data.snapshot.length).toBeGreaterThan(100)
    const write = { method: 'POST', body: JSON.stringify({ snapshot: data.snapshot }), headers: { 'Content-Type': 'application/json' } }
    expect((await fetch(url, { ...write, headers: { ...write.headers, 'x-test-remote': '192.168.1.12' } })).status).toBe(403)
    expect((await fetch(url, { ...write, headers: { ...write.headers, Origin: 'https://other.example' } })).status).toBe(403)
    expect((await fetch(url, write)).status).toBe(200)
    expect((await fetch(url, { method: 'PUT' })).status).toBe(405)
  } finally { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); await rm(root, { recursive: true, force: true }) }
})
