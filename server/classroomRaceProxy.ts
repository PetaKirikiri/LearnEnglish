import type { Plugin } from 'vite'

export const publicRaceOrigin = 'https://learn-english-coral.vercel.app'

// The teacher may preview the UI locally, but every shared race lives online.
// Keep the same-origin browser API while forwarding only the race credentials.
export function classroomRaceProxy(request: typeof fetch = fetch): Plugin {
  return { name: 'public-classroom-race', configureServer(server) {
    server.middlewares.use('/api/classroom-race', async (req, res) => {
      res.setHeader('Cache-Control', 'no-store')
      res.setHeader('Content-Type', 'application/json')
      const fail = (status: number, error: string) => { res.statusCode = status; res.end(JSON.stringify({ error })) }
      try {
        if (req.headers.origin && new URL(req.headers.origin).host !== req.headers.host) return fail(403, 'Use the classroom link to connect.')
        if (!['GET', 'POST'].includes(req.method ?? '')) return fail(405, 'Use GET or POST.')
        const url = new URL(req.url ?? '/', 'http://local')
        if (!/^\/(config|create|state|join|answer|control|prepare)$/.test(url.pathname)) return fail(404, 'Unknown race action.')
        let body = ''
        if (req.method === 'POST') {
          if (!req.headers['content-type']?.startsWith('application/json')) return fail(415, 'Send a JSON request.')
          for await (const chunk of req) {
            body += chunk
            if (Buffer.byteLength(body) > 4096) return fail(413, 'Request too large.')
          }
        }
        const upstream = await request(`${publicRaceOrigin}/api/classroom-race${url.pathname}${url.search}`, {
          method: req.method,
          headers: { Origin: publicRaceOrigin, ...(req.headers.authorization ? { Authorization: req.headers.authorization } : {}), ...(req.method === 'POST' ? { 'Content-Type': 'application/json' } : {}) },
          body: req.method === 'POST' ? body : undefined,
          redirect: 'error', signal: AbortSignal.timeout(6000), cache: 'no-store',
        })
        if (!upstream.headers.get('content-type')?.includes('application/json')) return fail(502, 'Could not connect to the public race. Please retry.')
        res.statusCode = upstream.status
        res.end(await upstream.text())
      } catch { fail(503, 'Could not connect to the public race. Check your internet connection and retry.') }
    })
  } }
}
