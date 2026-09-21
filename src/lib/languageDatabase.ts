import { installLanguageSnapshot, languageSnapshotSchema } from '../content/languageData'

type Config = { url: string; anonKey: string }
type Cache = Pick<Storage, 'getItem' | 'setItem'>
export async function loadLanguageDatabase(config: Config, storage: Cache, request: typeof fetch = fetch): Promise<'database' | 'cache'> {
  if (!config.url || !config.anonKey) throw new Error('Language database is not configured')
  const url = new URL(config.url)
  if (url.protocol !== 'https:') throw new Error('Language database requires HTTPS')
  const cacheKey = `englishsuccess:language:v1:${url.origin}`
  try {
    const response = await request(`${url.origin}/rest/v1/rpc/englishsuccess_language`, {
      method: 'POST',
      // The language connection never receives the Padel login/session token.
      headers: { apikey: config.anonKey, Authorization: `Bearer ${config.anonKey}`, 'Content-Type': 'application/json' },
      body: '{}', signal: AbortSignal.timeout(10000),
    })
    if (!response.ok) throw new Error('Language database unavailable')
    const snapshot = installLanguageSnapshot(await response.json())
    try { storage.setItem(cacheKey, JSON.stringify(snapshot)) } catch { /* Private mode: current database result remains usable. */ }
    return 'database'
  } catch (error) {
    try {
      const cached = languageSnapshotSchema.parse(JSON.parse(storage.getItem(cacheKey) ?? 'null'))
      installLanguageSnapshot(cached)
      return 'cache'
    } catch { throw error }
  }
}

let pending: Promise<'database' | 'cache'> | undefined
export function initializeLanguageDatabase() {
  pending ??= loadLanguageDatabase({ url: import.meta.env.VITE_LANGUAGE_SUPABASE_URL?.trim() ?? '', anonKey: import.meta.env.VITE_LANGUAGE_SUPABASE_ANON_KEY?.trim() ?? '' }, localStorage)
    .catch(error => { pending = undefined; throw error })
  return pending
}
