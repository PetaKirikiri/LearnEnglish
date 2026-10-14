// An intentionally open, course-only invite, NOT a shared-account credential.
// Never use this profile to authorize API, admin, or LINE account access.
export const DAVID_INVITE_KEY = 'Ajrvq8avW0wX7R_A3HPkJeby'
export const COACH_GUEST_STORAGE = 'padel-coach:guest-invite:v1'
export const DAVID_PROFILE = { id: 'guest:coach-david:v1', name: 'Coach David' } as const

export function resolveCoachGuest(location: Pick<Location, 'pathname' | 'search' | 'hash'>, storage: Pick<Storage, 'getItem'>) {
  if (!/^\/padel-coach\/?$/.test(location.pathname) || new URLSearchParams(location.hash.slice(1)).has('ticket')) return null
  const params = new URLSearchParams(location.search)
  // An explicit invalid invite must not fall back to a remembered profile.
  let key = params.get('invite')
  if (!params.has('invite')) {
    try { key = storage.getItem(COACH_GUEST_STORAGE) } catch { /* Storage may be blocked in an in-app browser. */ }
  }
  return key === DAVID_INVITE_KEY ? DAVID_PROFILE : null
}

export function rememberCoachGuest(storage: Pick<Storage, 'setItem'>) {
  try { storage.setItem(COACH_GUEST_STORAGE, DAVID_INVITE_KEY) } catch { /* The invite still opens for this visit. */ }
}

export function forgetCoachGuest(storage: Pick<Storage, 'removeItem'>) {
  try { storage.removeItem(COACH_GUEST_STORAGE) } catch { /* Do not clear lesson progress or another account. */ }
}
