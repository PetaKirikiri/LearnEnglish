import { Readable } from 'node:stream'
import type { IncomingMessage, ServerResponse } from 'node:http'
// Shared translator gateway generated from SubtitleDisplay; keep this adapter small.
// @ts-ignore Generated server module.
import { translatorHandler } from '../../server/translator.mjs'

export default async function handler(req: IncomingMessage & { body?: unknown }, res: ServerResponse) {
  const pathname = new URL(req.url || '/', 'https://translator.invalid').pathname
  const action = pathname.split('/').pop()
  if (!['translate', 'transcribe', 'phonetics', 'session'].includes(action || '')) {
    res.statusCode = 404; res.end(); return
  }
  const request = req.body === undefined ? req : Object.assign(
    Readable.from([Buffer.from(typeof req.body === 'string' ? req.body : JSON.stringify(req.body))]),
    { method: req.method, headers: req.headers, socket: req.socket, url: req.url },
  )
  request.url = `/${action}`
  await translatorHandler({
    TRANSLATOR_TEST_MODE: 'peta',
    TRANSLATOR_SITE_ORIGIN: 'https://learn-english-coral.vercel.app',
    TRANSLATOR_TEST_SESSION_SECRET: process.env.TRANSLATOR_TEST_SESSION_SECRET || '',
    AI4THAI_API_KEY: process.env.TRANSLATOR_AI4THAI_API_KEY || '',
    TRANSLATOR_WORDS_URL: process.env.TRANSLATOR_WORDS_URL || '',
    TRANSLATOR_WORDS_KEY: process.env.TRANSLATOR_WORDS_KEY || '',
    OPENAI_API_KEY: process.env.TRANSLATOR_OPENAI_API_KEY || '',
    TRANSLATOR_AUTH_URL: process.env.VITE_SUPABASE_URL || '',
    TRANSLATOR_AUTH_KEY: process.env.VITE_SUPABASE_ANON_KEY || '',
    TRANSLATOR_ALLOWED_USER_ID: '7bdc33ac-7f21-4ebf-bfbf-343080724890',
  })(request, res)
}
