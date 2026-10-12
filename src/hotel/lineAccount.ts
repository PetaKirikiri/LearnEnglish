import liff from '@line/liff'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { ENGLISH_ORIGIN, hotelAccountUrl, hotelLineId } from './lineEntry'

export type AccountResult = { kind: 'member'; url: string } | { kind: 'guest' } | { kind: 'redirect' }

// An SDK/network stall must not leave the learner on an indefinite spinner.
// Guard every subsequent side effect as well as racing the timeout.
export async function bounded<T>(work: (signal: AbortSignal) => Promise<T>, ms = 15000): Promise<T> {
  const controller = new AbortController()
  let timer: ReturnType<typeof setTimeout>
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort()
      reject(new Error('LINE took too long. Please try again.'))
    }, ms)
  })
  try { return await Promise.race([work(controller.signal), timeout]) }
  finally { clearTimeout(timer!); controller.abort() }
}

async function invoke(name: string, body: object, signal: AbortSignal) {
  signal.throwIfAborted()
  const { data, error } = await supabase.functions.invoke(name, { body, signal })
  signal.throwIfAborted()
  if (error || data?.error) throw new Error('Account service could not complete sign-in. Please try again.')
  return data
}

export async function resolveLineAccount(createAccount = false): Promise<AccountResult> {
  const liffId = hotelLineId()
  if (!liffId) throw new Error('English Success LINE sign-in is being configured. Please try again later.')
  if (window.location.origin !== ENGLISH_ORIGIN) throw new Error('Open English Success to sign in.')
  if (!isSupabaseConfigured) throw new Error('Account service is unavailable.')
  return bounded(async signal => {
    await liff.init({ liffId, withLoginOnExternalBrowser: false })
    signal.throwIfAborted()
    if (!liff.isLoggedIn()) {
      // One redirect per callback document chain. Never bounce forever if LINE
      // returns without a usable session (denied consent / blocked cookies).
      if (sessionStorage.getItem('hotel:line-login-attempt')) {
        sessionStorage.removeItem('hotel:line-login-attempt')
        throw new Error('LINE did not complete sign-in. Open the QR in LINE and try again.')
      }
      sessionStorage.setItem('hotel:line-login-attempt', '1')
      const redirect = new URL(hotelAccountUrl())
      redirect.search = new URLSearchParams({ app: 'englishsuccess', mode: 'hotel' }).toString()
      liff.login({ redirectUri: redirect.href })
      return { kind: 'redirect' }
    }
    sessionStorage.removeItem('hotel:line-login-attempt')
    const token = liff.getIDToken()
    if (!token) throw new Error('LINE did not share your identity. Please try again.')
    let match = await invoke('line-liff-recognize', { id_token: token, handoff: true }, signal)
    if (match?.recognised === false && !createAccount) return { kind: 'guest' }
    if (match?.recognised === false && createAccount) {
      // Only explicit confirmation creates a shared account. Never use a name,
      // QR request ID, or a client-decoded token as proof of identity.
      const registered = await invoke('line-liff-auth', { id_token: token, access_token: liff.getAccessToken() }, signal)
      if (!registered?.access_token || !registered?.refresh_token) throw new Error('Account registration did not finish. Please try again.')
      match = await invoke('line-liff-recognize', { id_token: token, handoff: true }, signal)
    }
    if (match?.recognised !== true || typeof match.ticket !== 'string' || !match.ticket) throw new Error('Could not finish LINE sign-in. Please try again.')
    return { kind: 'member', url: hotelAccountUrl(match.ticket) }
  })
}
