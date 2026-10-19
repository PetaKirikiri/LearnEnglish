import { expect, it } from 'vitest'
import { englishLineEntryUrl, isEnglishLineEntry } from './lineEntry'
import { isHotelLineEntry } from '../hotel/lineEntry'
it('uses the existing LINE account flow with a distinct, fixed English return mode', () => {
  const url = new URL(englishLineEntryUrl(true))
  expect(url.pathname).toBe('/2010311582-o2c1DCnP')
  expect(url.searchParams.get('mode')).toBe('english')
  expect(url.searchParams.get('intent')).toBe('signup')
  expect(new URL(englishLineEntryUrl()).searchParams.has('intent')).toBe(false)
  expect(isEnglishLineEntry(url.search)).toBe(true)
  expect(isHotelLineEntry(url.search)).toBe(false)
  expect(isEnglishLineEntry('?liff.state='+encodeURIComponent('/?app=englishsuccess&mode=english'))).toBe(true)
  expect(isEnglishLineEntry('?app=englishsuccess&mode=hotel')).toBe(false)
  expect(isEnglishLineEntry('?app=other&mode=english')).toBe(false)
})
