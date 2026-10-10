import { expect, it } from 'vitest'
import { hotelLineEntryUrl, isHotelLineEntry } from './lineEntry'
it('uses the existing shared LINE app and carries the hotel destination', () => {
  const url = new URL(hotelLineEntryUrl())
  expect(url.pathname).toBe('/2010311582-o2c1DCnP')
  expect(isHotelLineEntry(url.search)).toBe(true)
  expect(isHotelLineEntry('?liff.state=' + encodeURIComponent('/?app=englishsuccess&mode=hotel'))).toBe(true)
  expect(isHotelLineEntry('?app=englishsuccess')).toBe(false)
  expect(isHotelLineEntry('?app=other&mode=hotel')).toBe(false)
})
