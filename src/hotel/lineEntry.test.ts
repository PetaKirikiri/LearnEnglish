import { afterEach, expect, it, vi } from 'vitest'
import { hotelLineEntryUrl, hotelAccountUrl, isHotelLineEntry, isHotelSignupEntry } from './lineEntry'
it('finishes on the canonical account origin, with a fragment-only ticket', () => {
  const url = new URL(hotelAccountUrl('test-ticket'))
  expect(url.origin).toBe('https://learn-english-coral.vercel.app')
  expect(url.pathname).toBe('/hotel')
  expect(url.search).not.toContain('test-ticket')
  expect(url.hash).toBe('#ticket=test-ticket')
})
afterEach(() => vi.unstubAllEnvs())
it('uses the existing entry and carries the hotel destination', () => {
  vi.stubEnv('VITE_HOTEL_LIFF_ID', '2010311582-EnglishTest')
  const url = new URL(hotelLineEntryUrl()!)
  expect(url.pathname).toBe('/2010311582-o2c1DCnP')
  expect(isHotelLineEntry(url.search)).toBe(true)
  expect(isHotelLineEntry('?liff.state=' + encodeURIComponent('/?app=englishsuccess&mode=hotel'))).toBe(true)
  expect(isHotelLineEntry('?app=englishsuccess')).toBe(false)
  expect(isHotelLineEntry('?app=other&mode=hotel')).toBe(false)
})
it('does not depend on creating another LINE entry or console configuration', () => {
  for (const id of ['', '2010311582-o2c1DCnP', 'different-channel-App', 'https://example.com']) {
    vi.stubEnv('VITE_HOTEL_LIFF_ID', id)
    expect(new URL(hotelLineEntryUrl()!).pathname).toBe('/2010311582-o2c1DCnP')
  }
})
it('carries signup intent through a direct link and nested LINE state, without player claims', () => {
  vi.stubEnv('VITE_HOTEL_LIFF_ID', '2010311582-EnglishTest')
  const url = new URL(hotelLineEntryUrl(true)!)
  expect(isHotelSignupEntry(url.search)).toBe(true)
  expect(isHotelSignupEntry('?liff.state=' + encodeURIComponent('/hotel' + url.search))).toBe(true)
  expect(url.searchParams.has('lpl')).toBe(false)
  expect(url.searchParams.has('request')).toBe(false)
  expect(isHotelSignupEntry(new URL(hotelLineEntryUrl()!).search)).toBe(false)
  expect(isHotelSignupEntry('?app=other&mode=hotel&intent=signup')).toBe(false)
})
