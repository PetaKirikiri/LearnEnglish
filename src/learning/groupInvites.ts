export function inviteCode(value: string) {
  const trimmed = value.trim()
  let candidate = trimmed
  if (/^https?:\/\//i.test(trimmed)) {
    try { candidate = new URL(trimmed).searchParams.get('group') ?? '' } catch { return '' }
  }
  const normalized = candidate.replace(/[\s-]/g, '').toUpperCase()
  return /^[A-F0-9]{16}$/.test(normalized) ? normalized : ''
}

export function inviteLink(code: string) {
  const url = new URL('/', window.location.origin)
  url.searchParams.set('group', code)
  return url.toString()
}
