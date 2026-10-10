export const ENGLISH_ORIGIN = 'https://learn-english-coral.vercel.app'
export const SHARED_LINE_ID = '2010311582-o2c1DCnP'
export const PADEL_ORIGIN = 'https://successpadel.app'
export function hotelAccountUrl(ticket?: string) {
  const url = new URL('/login?app=englishsuccess&mode=hotel', PADEL_ORIGIN)
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
  const params = new URLSearchParams({ app: 'englishsuccess', mode: 'hotel', line_login: '1' })
  return `https://liff.line.me/${SHARED_LINE_ID}?${params}`
}
