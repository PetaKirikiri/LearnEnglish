import { hotelLineId, ENGLISH_ORIGIN } from '../hotel/lineEntry'

export function englishLineEntryUrl(signup = false) {
  const params = new URLSearchParams({ app: 'englishsuccess', mode: 'english', line_login: '1' })
  if (signup) params.set('intent', 'signup')
  return `https://liff.line.me/${hotelLineId()}?${params}`
}
export function isEnglishLineEntry(search: string) {
  const direct = new URLSearchParams(search)
  let nested = new URLSearchParams()
  try { nested = new URL(direct.get('liff.state') ?? '', ENGLISH_ORIGIN).searchParams } catch { /* malformed state */ }
  return [direct, nested].some(p => p.get('app') === 'englishsuccess' && p.get('mode') === 'english')
}
