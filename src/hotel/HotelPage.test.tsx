// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, expect, it, vi } from 'vitest'
import HotelPage, { HotelLesson } from './HotelPage'
const speech = vi.hoisted(() => ({ speak: vi.fn(), stop: vi.fn() }))
vi.mock('../learning/speech', () => ({ speakEnglish: speech.speak, stopEnglishSpeech: speech.stop }))
vi.mock('@line/liff', () => ({ default: { init: vi.fn() } }))
vi.mock('qrcode', () => ({ default: { toDataURL: async () => 'data:image/png;base64,test' } }))
vi.mock('../lib/supabase', () => ({ isSupabaseConfigured: false, supabase: { auth: { getSession: async () => ({ data: { session: null } }) } } }))
const host = document.createElement('div')
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
document.body.append(host)
let root = createRoot(host)
afterEach(async () => { await act(() => root.unmount()); root = createRoot(host); localStorage.clear(); vi.clearAllMocks() })
it('offers a saveable LINE QR rather than accepting a name as identity', async () => {
  await act(() => root.render(<HotelPage />))
  expect(host.textContent).toContain('Open LINE')
  expect(host.querySelector('a[download]')).not.toBeNull()
  expect(host.querySelector('img')?.alt).toContain('Scan in LINE')
  expect(host.querySelector('input')).toBeNull()
})
it('plays on start, waits for audio, records once, and only advances on Next', async () => {
  await act(() => root.render(<HotelLesson userId="test-user" />))
  await act(() => (host.querySelector('.hotel-primary') as HTMLButtonElement).click())
  expect(speech.speak).toHaveBeenCalledTimes(1)
  const choice = host.querySelector('.hotel-answer') as HTMLButtonElement
  await act(() => choice.click())
  expect(localStorage.getItem('hotel:v1:test-user')).toBeNull()
  await act(() => speech.speak.mock.calls[0][2]('ended'))
  await act(() => { choice.click(); choice.click() })
  const stored = JSON.parse(localStorage.getItem('hotel:v1:test-user')!)
  expect(stored.people.attempts).toBe(1)
  expect(speech.speak).toHaveBeenCalledTimes(1)
  expect(host.textContent).toContain('Next')
  expect(localStorage.getItem('hotel:v1:someone-else')).toBeNull()
  await act(() => (host.querySelector('.hotel-primary') as HTMLButtonElement).click())
  expect(speech.speak).toHaveBeenCalledTimes(2)
})
