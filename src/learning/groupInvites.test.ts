import { describe, expect, it } from 'vitest'
import { inviteCode, inviteLink } from './groupInvites'

describe('group invites', () => {
  it('accepts codes and shared links, normalizing pasted spacing', () => {
    expect(inviteCode(' abcd-1234 efab-5678 ')).toBe('ABCD1234EFAB5678')
    expect(inviteCode('https://example.com/?group=abcd1234efab5678')).toBe('ABCD1234EFAB5678')
  })
  it('rejects missing, malformed and non-code values', () => {
    for (const value of ['', 'https://example.com/', 'abc', 'GGGG1234EFAB5678', 'javascript:alert(1)', 'https://']) expect(inviteCode(value)).toBe('')
  })
  it('builds a root invite link that round-trips', () => {
    const url = new URL(inviteLink('ABCD1234EFAB5678'))
    expect(url.pathname).toBe('/')
    expect(inviteCode(url.toString())).toBe('ABCD1234EFAB5678')
  })
})
