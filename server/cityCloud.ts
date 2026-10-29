import { createHash, randomBytes, randomInt } from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { CityState } from '../src/city/world'
type Member = { id: string; name: string; avatar: number; publicKey: JsonWebKey; tokenHash: string }
export type StoredCity = { topic: string; secret: string; hostHash: string; publicKey: JsonWebKey; lease: string; members: Member[]; snapshot: CityState | null; created: number; lastActive?:number }
export type CityRow = { code: string; revision: number; data: StoredCity }
export type CityStore = { insert(row: CityRow): Promise<boolean>; read(code: string): Promise<CityRow | null>; save(row: CityRow): Promise<boolean> }
const secret = () => randomBytes(32).toString('base64url')
const hash = (value: string) => createHash('sha256').update(value).digest('hex')
export class CityCloudError extends Error { status: number; constructor(message: string, status = 400) { super(message); this.status = status } }
function fail(message: string, status = 400): never { throw new CityCloudError(message, status) }
async function publicKey(value: unknown) {
 const key = value as JsonWebKey
 if (!key || key.d || key.kty !== 'EC' || key.crv !== 'P-256') fail('Invalid controller identity.')
 try { await crypto.subtle.importKey('jwk', key, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']) } catch { fail('Invalid controller identity.') }
 return { kty: key.kty, crv: key.crv, x: key.x, y: key.y, ext: true } as JsonWebKey
}
function view(row: CityRow, role: 'host' | 'player', token: string, playerId?: string) {
 const d = row.data
 return { credentials: { code: row.code, token, role, playerId }, topic: d.topic, secret: d.secret, publicKey: d.publicKey,
  ...(role === 'host' ? { lease: d.lease, members: d.members.map(m => ({id:m.id,name:m.name,avatar:m.avatar,publicKey:m.publicKey})), snapshot: d.snapshot } : {}) }
}
export async function cityCloudAction(store: CityStore, action: string, body: Record<string, unknown>, token: string, now = Date.now()) {
 if (action === 'create') {
  const key = await publicKey(body.publicKey), host = secret()
  for (let attempt = 0; attempt < 8; attempt++) {
   const row: CityRow = { code: String(randomInt(100000, 1000000)), revision: 0, data: { topic: `city-${secret()}`, secret: randomBytes(32).toString('base64'), hostHash: hash(host), publicKey: key, lease: secret(), members: [], snapshot: null, created: now } }
   if (await store.insert(row)) return view(row, 'host', host)
  }
  fail('Could not open a city. Try again.', 503)
 }
 if (!['join', 'resume', 'sync', 'remove'].includes(action)) fail('Unknown city action.', 404)
 const code = String(body.code ?? '')
 if (!/^\d{6}$/.test(code)) fail('Enter the six-digit city code.')
 const key = action === 'join' ? await publicKey(body.publicKey) : null
 for (let attempt = 0; attempt < 12; attempt++) {
  const row = await store.read(code)
  if (!row || now - row.data.created > 8 * 3600000) fail('City not found. Scan the current QR code.', 404)
  const d = row.data
  if (action === 'join') {
   const name = typeof body.name === 'string' ? body.name.trim() : ''
   if (!name || name.length > 18) fail('Enter a name with 1–18 characters.')
   if (d.members.length >= 16) fail('This city is full (16 players).')
   const playerToken = secret(), id = secret().slice(0, 16)
   d.members.push({ id, name, avatar: Number.isInteger(body.avatar) ? Math.max(0, Math.min(3, Number(body.avatar))) : d.members.length % 4, publicKey: key!, tokenHash: hash(playerToken) })
   if (await store.save(row)) return view(row, 'player', playerToken, id)
   continue
  }
  const host = !!token && hash(token) === d.hostHash
  const member = token ? d.members.find(m => m.tokenHash === hash(token)) : undefined
  if (!host && !member) fail('This controller is no longer in the city. Join again.', 403)
  if (action === 'resume') {
   if (!host) return view(row, 'player', token, member!.id)
   d.lease = secret()
   if (await store.save(row)) return view(row, 'host', token)
   continue
  }
  if (!host || body.lease !== d.lease) fail('This city is open on another teacher screen. Reopen it here to take control.', 403)
  if (action === 'remove') d.members = d.members.filter(m => m.id !== body.playerId)
  if (action === 'sync') d.lastActive=now
  if (action === 'sync' && body.snapshot) {
   const snapshot = body.snapshot as CityState
   if (snapshot.code !== code || !Array.isArray(snapshot.players) || snapshot.players.length > 16 || JSON.stringify(snapshot).length > 16000) fail('Invalid city snapshot.')
   d.snapshot = snapshot
  }
  if (await store.save(row)) return view(row, 'host', token)
 }
 fail('The city is busy. Try again.', 409)
}
export function cityConfig() {
 const url = process.env.CITY_SUPABASE_URL || process.env.VITE_SUPABASE_URL
 const anon = process.env.CITY_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
 const key = process.env.CITY_SUPABASE_SERVICE_KEY
 if (!url || !anon || !key) fail('City connection is unavailable. Please try again.', 503)
 return { url, anon, key }
}
export function cityStore(): CityStore {
 const { url, key } = cityConfig()
 async function request(path: string, method: string, body?: unknown) {
  const response = await fetch(`${url}/rest/v1/english_city_rooms${path}`, { method, headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=representation' }, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(8000) })
  if (response.status === 409 && method === 'POST') return null
  if (!response.ok) throw new Error(`City storage failed: ${response.status}`)
  return response.json()
 }
 return { insert: async row => !!await request('', 'POST', row), read: async code => (await request(`?code=eq.${code}&select=code,revision,data`, 'GET'))[0] ?? null,
  save: async row => (await request(`?code=eq.${row.code}&revision=eq.${row.revision}`, 'PATCH', { data: row.data, revision: row.revision + 1 })).length === 1 }
}

async function signedInLearner(accessToken:string){
 const url=process.env.VITE_SUPABASE_URL,key=process.env.VITE_SUPABASE_ANON_KEY
 if(!url||!key||!accessToken)fail('Sign in to EnglishSuccess to join the city.',401)
 const response=await fetch(`${url}/auth/v1/user`,{headers:{apikey:key,Authorization:`Bearer ${accessToken}`},signal:AbortSignal.timeout(8000)})
 if(!response.ok)fail('Sign in to EnglishSuccess to join the city.',401)
 const user=await response.json()
 return {id:user.id as string,name:String(user.user_metadata?.display_name||user.user_metadata?.full_name||user.user_metadata?.name||'Student').slice(0,18)}
}
async function activeCity(){
 const {url,key}=cityConfig()
 const response=await fetch(`${url}/rest/v1/english_city_rooms?select=code,data&order=created_at.desc&limit=20`,{headers:{apikey:key,Authorization:`Bearer ${key}`},signal:AbortSignal.timeout(8000)})
 if(!response.ok)fail('Could not check the active city.',503)
 const rows=await response.json() as CityRow[]
 return selectActiveCity(rows)
}
export function selectActiveCity(rows:CityRow[],now=Date.now()){
 const active=rows.filter(row=>now-(row.data.lastActive??0)<30000&&now-(row.data.lastActive??0)>=0)
 if(active.length!==1)fail(active.length?'Ask your teacher for this city’s join link.':'No city game is running. Wait for your teacher to open it.',409)
 return active[0].code
}

export default async function handler(req: IncomingMessage & { body?: unknown }, res: ServerResponse) {
 res.setHeader('Cache-Control', 'no-store'); res.setHeader('Content-Type', 'application/json')
 try {
  const hostname = req.headers.host
  if (!hostname || !/^[\w.:-]+$/.test(hostname)) fail('Invalid city address.')
  const origin = `https://${hostname}`
  if (req.headers.origin && new URL(req.headers.origin).origin !== origin) fail('Use your teacher’s city link.', 403)
  const action = new URL(req.url ?? '/', origin).pathname.split('/').pop()!
  if(action==='active'&&req.method==='GET'){const learner=await signedInLearner(req.headers.authorization?.replace(/^Bearer /,'')??'');res.end(JSON.stringify({code:await activeCity(),name:learner.name}));return}
  if (action === 'config' && req.method === 'GET') { const { url, anon } = cityConfig(); res.end(JSON.stringify({ transport: 'realtime', joinOrigin: origin, url, anon })); return }
  if (req.method !== 'POST') fail('Use POST.', 405)
  if (!req.headers['content-type']?.startsWith('application/json')) fail('Send a JSON request.', 415)
  let raw = req.body === undefined ? '' : typeof req.body === 'string' ? req.body : JSON.stringify(req.body)
  if (req.body === undefined) for await (const chunk of req) { raw += chunk; if (raw.length > 20000) fail('Request too large.', 413) }
  if (raw.length > 20000) fail('Request too large.', 413)
  let body: Record<string, unknown>
  try { body = JSON.parse(raw || '{}') } catch { fail('Invalid city request.') }
  if (!body || typeof body !== 'object' || Array.isArray(body)) fail('Invalid city request.')
  if(action==='join'&&body.accountToken){const learner=await signedInLearner(String(body.accountToken));body.name=learner.name;delete body.accountToken}
  res.end(JSON.stringify(await cityCloudAction(cityStore(), action, body, req.headers.authorization?.replace(/^Bearer /, '') ?? '')))
 } catch (error) {
  res.statusCode = error instanceof CityCloudError ? error.status : 503
  if (!(error instanceof CityCloudError)) console.error('City request failed', error instanceof Error ? error.message : 'Unknown')
  res.end(JSON.stringify({ error: error instanceof CityCloudError ? error.message : 'Could not reach the city. Try again.' }))
 }
}
