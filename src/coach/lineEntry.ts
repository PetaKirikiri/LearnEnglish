import { hotelLineId } from '../hotel/lineEntry'
export function coachLineEntryUrl(signup = false) {
  const params = new URLSearchParams({ app: 'englishsuccess', mode: 'padel-coach', line_login: '1' })
  if (signup) params.set('intent', 'signup')
  return `https://liff.line.me/${hotelLineId()}?${params}`
}
export function isCoachLineEntry(search: string) {
  const direct = new URLSearchParams(search)
  try {
    const nested = new URL(direct.get('liff.state') ?? '', 'https://learn-english-coral.vercel.app').searchParams
    return [direct, nested].some(p => p.get('app') === 'englishsuccess' && p.get('mode') === 'padel-coach')
  } catch { return direct.get('app') === 'englishsuccess' && direct.get('mode') === 'padel-coach' }
}
