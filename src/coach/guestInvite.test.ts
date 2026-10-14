// @vitest-environment happy-dom
import { afterEach, expect, it } from 'vitest'
import { COACH_GUEST_STORAGE, DAVID_INVITE_KEY, DAVID_PROFILE, forgetCoachGuest, rememberCoachGuest, resolveCoachGuest } from './guestInvite'

afterEach(() => localStorage.clear())
const location = (path = '/padel-coach', search = '', hash = '') => ({ pathname: path, search, hash })

it('accepts only the fixed invite on the practice route, never arbitrary names or IDs', () => {
  expect(resolveCoachGuest(location('/padel-coach', `?invite=${DAVID_INVITE_KEY}`), localStorage)).toEqual(DAVID_PROFILE)
  expect(resolveCoachGuest(location('/padel-coach', '?invite=admin&name=Peta'), localStorage)).toBeNull()
  for (const path of ['/padel-coach/content', '/padel-coach/preview', '/admin', '/hotel', '/padel']) {
    expect(resolveCoachGuest(location(path, `?invite=${DAVID_INVITE_KEY}`), localStorage)).toBeNull()
  }
})
it('remembers only the course profile, rejects explicit wrong keys, and gives LINE tickets precedence', () => {
  rememberCoachGuest(localStorage)
  expect(localStorage.getItem(COACH_GUEST_STORAGE)).toBe(DAVID_INVITE_KEY)
  expect(resolveCoachGuest(location(), localStorage)).toEqual(DAVID_PROFILE)
  expect(resolveCoachGuest(location('/padel-coach', '?invite=wrong'), localStorage)).toBeNull()
  expect(resolveCoachGuest(location('/padel-coach', '', '#ticket=real-login'), localStorage)).toBeNull()
  localStorage.setItem('padel-coach:v1:guest:coach-david:v1', 'saved-progress')
  localStorage.setItem('line-session', 'untouched')
  forgetCoachGuest(localStorage)
  expect(resolveCoachGuest(location(), localStorage)).toBeNull()
  expect(localStorage.getItem('line-session')).toBe('untouched')
  expect(localStorage.getItem('padel-coach:v1:guest:coach-david:v1')).toBe('saved-progress')
})
it('still opens the link if browser storage is unavailable', () => {
  const blocked = { getItem: () => { throw Error('blocked') }, setItem: () => { throw Error('blocked') }, removeItem: () => { throw Error('blocked') } }
  expect(resolveCoachGuest(location('/padel-coach', `?invite=${DAVID_INVITE_KEY}`), blocked)).toEqual(DAVID_PROFILE)
  expect(resolveCoachGuest(location(), blocked)).toBeNull()
  expect(() => rememberCoachGuest(blocked)).not.toThrow()
  expect(() => forgetCoachGuest(blocked)).not.toThrow()
})
