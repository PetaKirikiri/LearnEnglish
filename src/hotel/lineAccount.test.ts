// @vitest-environment happy-dom
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { bounded, resolveLineAccount } from './lineAccount'
const mock = vi.hoisted(() => ({ init: vi.fn(), logged: vi.fn(), token: vi.fn(), access: vi.fn(), login: vi.fn(), invoke: vi.fn() }))
vi.mock('@line/liff', () => ({ default: { init: mock.init, isLoggedIn: mock.logged, getIDToken: mock.token, getAccessToken: mock.access, login: mock.login } }))
vi.mock('../lib/supabase', () => ({ isSupabaseConfigured: true, supabase: { functions: { invoke: mock.invoke } } }))
beforeEach(() => {
  vi.stubEnv('VITE_HOTEL_LIFF_ID', '2010311582-EnglishTest')
  window.location.href = 'https://learn-english-coral.vercel.app/hotel'
  vi.resetAllMocks(); sessionStorage.clear()
  mock.init.mockResolvedValue(undefined); mock.logged.mockReturnValue(true)
  mock.token.mockReturnValue('verified-by-server'); mock.access.mockReturnValue('line-access')
})
afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs() })
it('refuses to initialise on the Padel domain', async () => {
  window.location.href = 'https://success-padel-ffzt.vercel.app/login'
  await expect(resolveLineAccount()).rejects.toThrow('Open English Success')
  expect(mock.init).not.toHaveBeenCalled()
})
it('refuses the old Padel entry even if configured accidentally', async () => {
  vi.stubEnv('VITE_HOTEL_LIFF_ID', '2010311582-o2c1DCnP')
  await expect(resolveLineAccount()).rejects.toThrow('being configured')
  expect(mock.init).not.toHaveBeenCalled()
})
it('recognises an existing account without registering it', async () => {
  mock.invoke.mockResolvedValue({ data: { recognised: true, ticket: 'one-use' } })
  expect(await resolveLineAccount()).toEqual({ kind: 'member', url: 'https://learn-english-coral.vercel.app/hotel#ticket=one-use' })
  expect(mock.invoke).toHaveBeenCalledTimes(1)
})
it('detects a new LINE identity without creating an account automatically', async () => {
  mock.invoke.mockResolvedValue({ data: { recognised: false } })
  expect(await resolveLineAccount()).toEqual({ kind: 'guest' })
  expect(mock.invoke.mock.calls.map(call => call[0])).toEqual(['line-liff-recognize'])
})
it('registers only on confirmation then returns to English with a one-use ticket', async () => {
  mock.invoke.mockResolvedValueOnce({ data: { recognised: false } })
    .mockResolvedValueOnce({ data: { access_token: 'session', refresh_token: 'refresh' } })
    .mockResolvedValueOnce({ data: { recognised: true, ticket: 'new-user-ticket' } })
  expect(await resolveLineAccount(true)).toEqual({ kind: 'member', url: 'https://learn-english-coral.vercel.app/hotel#ticket=new-user-ticket' })
  expect(mock.invoke.mock.calls.map(call => call[0])).toEqual(['line-liff-recognize', 'line-liff-auth', 'line-liff-recognize'])
})
it('does not register when recognition fails instead of reporting unknown', async () => {
  mock.invoke.mockResolvedValue({ error: new Error('offline') })
  await expect(resolveLineAccount(true)).rejects.toThrow('Account service')
  expect(mock.invoke).toHaveBeenCalledTimes(1)
})
it('rejects incomplete registration', async () => {
  mock.invoke.mockResolvedValueOnce({ data: { recognised: false } }).mockResolvedValueOnce({ data: {} })
  await expect(resolveLineAccount(true)).rejects.toThrow('registration did not finish')
})
it('does not create accounts without a LINE ID token', async () => {
  mock.token.mockReturnValue(null)
  await expect(resolveLineAccount(true)).rejects.toThrow('identity')
  expect(mock.invoke).not.toHaveBeenCalled()
})
it('limits SDK stalls and prevents late account writes after timeout', async () => {
  vi.useFakeTimers()
  let release!: () => void
  mock.init.mockReturnValue(new Promise<void>(resolve => { release = resolve }))
  const result = resolveLineAccount(true)
  const rejected = expect(result).rejects.toThrow('too long')
  await vi.advanceTimersByTimeAsync(15000); await rejected
  release(); await vi.advanceTimersByTimeAsync(1)
  expect(mock.invoke).not.toHaveBeenCalled()
})
it('stops repeated OAuth redirects', async () => {
  mock.logged.mockReturnValue(false)
  expect(await resolveLineAccount()).toEqual({ kind: 'redirect' })
  await expect(resolveLineAccount()).rejects.toThrow('did not complete')
  expect(mock.login).toHaveBeenCalledTimes(1)
  expect(mock.login.mock.calls[0][0].redirectUri).toBe('https://learn-english-coral.vercel.app/hotel?app=englishsuccess&mode=hotel')
})
it('aborts stalled account requests', async () => {
  vi.useFakeTimers()
  let signal!: AbortSignal
  const pending = bounded(async s => { signal = s; return new Promise(() => {}) }, 10)
  const rejected = expect(pending).rejects.toThrow('too long')
  await vi.advanceTimersByTimeAsync(10); await rejected
  expect(signal.aborted).toBe(true)
})
