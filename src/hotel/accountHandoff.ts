import { supabase } from '../lib/supabase'
import { hotelAccountUrl } from './lineEntry'

let resume: { ticket: string | null; promise: ReturnType<typeof restore> } | undefined
async function restore(ticket: string | null) {
  const { data: current } = await supabase.auth.getSession()
  // Same as Padel: never replace an account already signed in on this origin.
  if (current.session) {
    const { data, error } = await supabase.auth.getUser()
    if (error) throw error
    return data.user
  }
  if (!ticket) return null
  const { data, error } = await supabase.auth.verifyOtp({ token_hash: ticket, type: 'email' })
  if (error) throw error
  return data.user
}
export function finishHotelReturn(ticket: string | null) {
  // Share only an in-flight restore (including StrictMode's second mount after
  // the ticket is removed). Never cache a signed-out result or a former user.
  if (resume && (!ticket || resume.ticket === ticket)) return resume.promise
  const pending = { ticket, promise: restore(ticket) }
  resume = pending
  return pending.promise.finally(() => { if (resume === pending) resume = undefined })
}
export async function prepareHotelReturn(idToken: string) {
  const { data, error } = await supabase.functions.invoke('line-liff-recognize', {
    body: { id_token: idToken, handoff: true }, signal: AbortSignal.timeout(12000),
  })
  if (error || data?.recognised !== true || typeof data.ticket !== 'string') {
    throw new Error('Could not finish LINE sign-in. Please try again.')
  }
  return hotelAccountUrl(data.ticket)
}
