export const ENGLISH_ORIGIN = 'https://learn-english-coral.vercel.app'
// Dedicated English Success entry. Never fall back to the Padel LIFF app.
export function hotelLineId(): string {
  const id = import.meta.env.VITE_HOTEL_LIFF_ID?.trim() ?? ''
  return /^2010311582-[A-Za-z0-9]+$/.test(id) && id !== '2010311582-o2c1DCnP' ? id : ''
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
export function hotelLineEntryUrl() {
  const id = hotelLineId()
  if (!id) return null
  const params = new URLSearchParams({ app: 'englishsuccess', mode: 'hotel', line_login: '1' })
  return `https://liff.line.me/${id}?${params}`
}
