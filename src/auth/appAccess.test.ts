import { describe, expect, it } from 'vitest'
import { appDestination, PETA_ACCOUNT_ID } from './appAccess'

describe('account routing', () => {
  it('sends Peta straight to the app and keeps explicit admin links restricted', () => {
    expect(appDestination(PETA_ACCOUNT_ID, '/')).toBe('student')
    expect(appDestination(PETA_ACCOUNT_ID, '/admin')).toBe('admin')
    expect(appDestination(PETA_ACCOUNT_ID, '/admin/progress')).toBe('admin')
    expect(appDestination(PETA_ACCOUNT_ID, '/app')).toBe('student')
  })
  it('sends everyone else straight to the student app, including direct admin links', () => {
    for (const id of ['165c5880-cf88-4e19-96e3-2353a500388d', 'Peta', 'another-admin']) {
      for (const path of ['/', '/app', '/admin', '/admin/progress']) {
        expect(appDestination(id, path)).toBe('student')
      }
    }
  })
})
