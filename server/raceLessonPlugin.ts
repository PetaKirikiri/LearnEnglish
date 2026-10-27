import { pluralLessonSeed } from '../src/race/pluralLessonSeed'
import type { Plugin } from 'vite'
import { join } from 'node:path'
import { raceLessonStore } from './raceLessonDocument'

// The same local classroom boundary as the race: students can read on Wi-Fi;
// only the teacher's loopback connection can edit. No cloud or browser-only save.
export function raceLessonPlugin(): Plugin {
  return { name: 'race-lesson-document', configureServer(server) {
    const firstDocument = raceLessonStore(join(server.config.root, '.classroom-races'))
    const pluralDocument = raceLessonStore(join(server.config.root, '.classroom-races'), { filename: 'where-are-my-notes.json', seed: pluralLessonSeed })
    server.middlewares.use('/api/race-lesson-document', async (req, res) => {
      res.setHeader('Cache-Control', 'no-store')
      const send = (status: number, data: unknown) => { res.statusCode = status; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(data)) }
      const lesson = new URL(req.url ?? '/', 'http://localhost').searchParams.get('lesson')
      if (lesson && lesson !== 'where-are-my' && lesson !== 'where-is-the') { send(404, { error: 'Lesson not found.' }); return }
      const document = lesson === 'where-are-my' ? pluralDocument : firstDocument
      const local = ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress ?? '')
      try {
        if (req.headers.origin && new URL(req.headers.origin).host !== req.headers.host) { send(403, { error: 'Open the classroom link.' }); return }
        if (req.method === 'GET') { send(200, { snapshot: await document(), canEdit: local }); return }
        if (req.method !== 'POST') { send(405, { error: 'Method not allowed.' }); return }
        if (!local) { send(403, { error: 'Only the teacher’s laptop can edit the notes.' }); return }
        if (!req.headers['content-type']?.startsWith('application/json')) { send(415, { error: 'Send a document snapshot.' }); return }
        let raw = ''
        for await (const chunk of req) { raw += chunk; if (raw.length > 2_100_000) { send(413, { error: 'The document is too large.' }); return } }
        const body = JSON.parse(raw)
        if (typeof body.snapshot !== 'string') { send(400, { error: 'Send a document snapshot.' }); return }
        send(200, { snapshot: await document(body.snapshot), canEdit: true })
      } catch { send(500, { error: 'Could not save or load the lesson notes. Try again.' }) }
    })
  } }
}
