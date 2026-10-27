// @vitest-environment node
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import type { ViteDevServer } from 'vite'
import { expect, it, vi } from 'vitest'
import { classroomRaceProxy, publicRaceOrigin } from './classroomRaceProxy'

it('uses the public race service for a local host and retains the real public room link', async () => {
  const joinUrl = `${publicRaceOrigin}/english/race/join/ABCDEF1234`
  const upstream = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ joinUrl }), { headers: { 'Content-Type': 'application/json' } }))
  let handler: (req: IncomingMessage, res: ServerResponse) => void = () => {}
  const plugin = classroomRaceProxy(upstream)
  if (typeof plugin.configureServer !== 'function') throw new Error('Missing proxy')
  plugin.configureServer.call({} as never, { middlewares: { use: (_path: string, fn: typeof handler) => { handler = fn } } } as unknown as ViteDevServer)
  const server = createServer((req,res)=>handler(req,res))
  await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve))
  const origin = `http://127.0.0.1:${(server.address() as {port:number}).port}`
  try {
    const response = await fetch(`${origin}/state?room=ABCDEF1234`, { headers: { Origin: origin, Authorization: 'Bearer host-test', Cookie: 'private=do-not-forward' } })
    expect(await response.json()).toEqual({joinUrl})
    expect(upstream).toHaveBeenCalledWith(`${publicRaceOrigin}/api/classroom-race/state?room=ABCDEF1234`, expect.objectContaining({ headers: { Origin: publicRaceOrigin, Authorization: 'Bearer host-test' } }))
    const denied = await fetch(`${origin}/create`, { method:'POST', headers:{Origin:'https://unrelated.example','Content-Type':'application/json'}, body:'{}' })
    expect(denied.status).toBe(403)
    expect(upstream).toHaveBeenCalledTimes(1)
    await fetch(`${origin}/create`, {method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({stage:'tonight-slots'})})
    expect(upstream).toHaveBeenLastCalledWith(`${publicRaceOrigin}/api/classroom-race/create`, expect.objectContaining({ method:'POST', body:'{"stage":"tonight-slots"}' }))
  } finally { await new Promise<void>((resolve,reject)=>server.close(error=>error?reject(error):resolve())) }
})
