export const ENGLISH_ORIGIN = 'https://learn-english-coral.vercel.app'
// Existing registered LINE entry; its isolated English callback returns a
// one-use ticket without mounting Padel's interface. No new LINE setup needed.
export function hotelLineId(): string {
  return '2010311582-o2c1DCnP'
}
export function hotelAccountUrl(ticket?: string) {
  const url = new URL('/hotel', ENGLISH_ORIGIN)
  if (ticket) url.hash = new URLSearchParams({ ticket }).toString()
  return url.href
}
export function isHotelLineEntry(search: string): boolean {
  const params = new URLSearchParams(search)
  if (params.get('app') === 'englishsuccess' && params.get('mode') === 'hotel') return true
  const state = params.get('liff.state')
  if (!state) return false
  try {
    const nested = new URL(state, ENGLISH_ORIGIN).searchParams
    return nested.get('app') === 'englishsuccess' && nested.get('mode') === 'hotel'
  } catch { return false }
}
export function isHotelSignupEntry(search: string): boolean {
  const params = new URLSearchParams(search)
  if (isHotelLineEntry(search) && params.get('intent') === 'signup') return true
  const state = params.get('liff.state')
  if (!state) return false
  try {
    const nested = new URL(state, ENGLISH_ORIGIN).searchParams
    return nested.get('app') === 'englishsuccess' && nested.get('mode') === 'hotel' && nested.get('intent') === 'signup'
  } catch { return false }
}
export function hotelLineEntryUrl(signup = false) {
  const id = hotelLineId()
  if (!id) return null
  const params = new URLSearchParams({ app: 'englishsuccess', mode: 'hotel', line_login: '1' })
  if (signup) params.set('intent', 'signup')
  return `https://liff.line.me/${id}?${params}`
}
