import { afterEach, expect, it, vi } from 'vitest'
import { hotelLineEntryUrl, hotelAccountUrl, isHotelLineEntry } from './lineEntry'
it('finishes on the canonical account origin, with a fragment-only ticket', () => {
  const url = new URL(hotelAccountUrl('test-ticket'))
  expect(url.origin).toBe('https://learn-english-coral.vercel.app')
  expect(url.pathname).toBe('/hotel')
  expect(url.search).not.toContain('test-ticket')
  expect(url.hash).toBe('#ticket=test-ticket')
})
afterEach(() => vi.unstubAllEnvs())
it('uses only the dedicated English entry and carries the hotel destination', () => {
  vi.stubEnv('VITE_HOTEL_LIFF_ID', '2010311582-EnglishTest')
  const url = new URL(hotelLineEntryUrl()!)
  expect(url.pathname).toBe('/2010311582-EnglishTest')
  expect(isHotelLineEntry(url.search)).toBe(true)
  expect(isHotelLineEntry('?liff.state=' + encodeURIComponent('/?app=englishsuccess&mode=hotel'))).toBe(true)
  expect(isHotelLineEntry('?app=englishsuccess')).toBe(false)
  expect(isHotelLineEntry('?app=other&mode=hotel')).toBe(false)
})
it('never falls back to Padel if English configuration is missing or incorrect', () => {
  for (const id of ['', '2010311582-o2c1DCnP', 'different-channel-App', 'https://example.com']) {
    vi.stubEnv('VITE_HOTEL_LIFF_ID', id)
    expect(hotelLineEntryUrl()).toBeNull()
  }
})
