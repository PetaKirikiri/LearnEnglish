// @vitest-environment happy-dom
import { afterEach, expect, it, vi } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import * as Y from 'yjs'
import { holidayVocabulary } from './holidayVocabulary'

vi.mock('../portal/documentSync', () => ({
  remoteOrigin: 'remote',
  encodeDocument: (doc: Y.Doc) => Buffer.from(Y.encodeStateAsUpdate(doc)).toString('base64'),
  mergeDocument: (doc: Y.Doc, snapshot: string) => Y.applyUpdate(doc, Buffer.from(snapshot, 'base64'), 'remote'),
}))
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.resetModules() })

it('publishes readable notes and audio for every lesson word', () => {
  const data = JSON.parse(readFileSync('public/lessons/where-is-the.json', 'utf8'))
  const doc = new Y.Doc()
  Y.applyUpdate(doc, Buffer.from(data.snapshot, 'base64'))
  expect(data.canEdit).toBe(false)
  const lesson = doc.getXmlFragment('default').toString()
  expect(lesson).toContain('Where')
  expect(lesson).toContain('<holidaywords>')
  for (const item of holidayVocabulary) expect(existsSync(`public/audio/race-holiday/${item.word}-complete.wav`)).toBe(true)
  doc.destroy()
})

it('public visitors load the published snapshot and cannot upload edits', async () => {
  vi.stubEnv('PROD', true)
  const data = JSON.parse(readFileSync('public/lessons/where-is-the.json', 'utf8'))
  const request = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ...data, canEdit: true }), { headers: { 'Content-Type': 'application/json' } }))
  vi.stubGlobal('fetch', request)
  const { connectRaceLesson } = await import('./raceLessonSync')
  const doc = new Y.Doc(), status = vi.fn()
  const stop = connectRaceLesson(doc, status)
  await vi.waitFor(() => expect(status).toHaveBeenLastCalledWith({ ready: true, canEdit: false, saving: false, error: '' }))
  expect(request).toHaveBeenCalledWith('/lessons/where-is-the.json', expect.objectContaining({ method: 'GET' }))
  doc.getMap('test').set('edit', true)
  expect(request).toHaveBeenCalledTimes(1)
  expect(status).toHaveBeenCalledTimes(1)
  stop(); doc.destroy()
})
