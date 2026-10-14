import { hotelLineId } from '../hotel/lineEntry'
export function padelLineEntryUrl(signup = false) {
  const params = new URLSearchParams({ app:'englishsuccess', mode:'padel', line_login:'1' })
  if (signup) params.set('intent','signup')
  return `https://liff.line.me/${hotelLineId()}?${params}`
}
export function isPadelLineEntry(search: string) {
  const params = new URLSearchParams(search)
  if (params.get('app') === 'englishsuccess' && params.get('mode') === 'padel') return true
  try {
    const nested = new URL(params.get('liff.state') ?? '', 'https://learn-english-coral.vercel.app').searchParams
    return nested.get('app') === 'englishsuccess' && nested.get('mode') === 'padel'
  } catch { return false }
}
