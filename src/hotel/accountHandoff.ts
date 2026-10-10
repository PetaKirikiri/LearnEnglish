import { supabase } from '../lib/supabase'
import { hotelAccountUrl } from './lineEntry'

let resume: ReturnType<typeof restore> | undefined
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
  // StrictMode must not consume a one-use ticket twice.
  resume ??= restore(ticket).catch(error => { resume = undefined; throw error })
  return resume
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
