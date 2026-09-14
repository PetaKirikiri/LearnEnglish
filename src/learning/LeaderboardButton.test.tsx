import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import QuizPage from './QuizPage'

const rpc = vi.hoisted(() => vi.fn())
vi.mock('../lib/supabase', () => ({ supabase: { rpc } }))
vi.mock('./progressSync', () => ({ trackProgress: vi.fn() }))
vi.mock('./speech', () => ({ canSpeakEnglish: () => false, speakEnglish: vi.fn(), stopEnglishSpeech: vi.fn() }))
let root: Root
let container: HTMLDivElement
const rows = [
  { id: 'fifa', name: 'Fifa', rank: 1, points: 100, avatarUrl: 'https://example.com/fifa.jpg' },
  { id: 'peta', name: 'Peta', rank: 2, points: 70 },
  { id: 'june', name: 'June', rank: 3, points: 0 },
  { id: 'worada', name: 'Worada', rank: 3, points: 0 },
]
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  localStorage.clear()
  rpc.mockReset().mockResolvedValue({ data: { rows }, error: null })
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})
afterEach(() => { act(() => root.unmount()); container.remove() })
async function render() {
  await act(async () => root.render(<QuizPage learnerId="Peta" userId="peta" onSignOut={() => {}} />))
}
it('shows the champion beside the header cup and opens every member without losing the question', async () => {
  await render()
  expect(container.querySelector('header > :first-child')!.className).toBe('lesson-brand')
  expect(container.querySelector('.lesson-brand')!.textContent).toBe('EnglishSuccess')
  expect(container.querySelector('header > .englishsuccess-corner-logo:last-child')!.getAttribute('src')).toBe('/brand/englishsuccess-logo.png')
  const question = container.querySelector('h1')!.textContent
  const button = container.querySelector<HTMLButtonElement>('header button[aria-label="Leaderboard"]')!
  expect(button.className).toBe('champion-button')
  expect(button.querySelector('.truncate')!.textContent).toBe('Fifa')
  expect(button.querySelector('img')!.getAttribute('src')).toBe('https://example.com/fifa.jpg')
  expect(button.querySelector('img')!.closest('span')!.nextElementSibling!.textContent).toBe('Fifa')
  expect(button.title).toBe('Champion: Fifa')
  await act(async () => button.click())
  expect([...container.querySelectorAll('ol li')].map(row => row.textContent)).toEqual(['1Fifa100', '2Peta70', '—June0', '—Worada0'])
  expect(container.querySelector('ol li img')!.getAttribute('src')).toBe('https://example.com/fifa.jpg')
  await act(async () => container.querySelector<HTMLButtonElement>('[aria-label="Back to lesson"]')!.click())
  expect(container.querySelector('h1')!.textContent).toBe(question)
  expect(container.querySelector('header .champion-button')!.textContent).toBe('Fifa')
})
it('updates the header champion after scores sync, keeping the name on a failed refresh', async () => {
  await render()
  rpc.mockResolvedValue({ data: { rows: [{ id: 'june', name: 'June', rank: 1, points: 120 }] }, error: null })
  await act(async () => window.dispatchEvent(new Event('fifa-progress-sync')))
  expect(container.querySelector('.champion-button')!.textContent).toBe('June')
  rpc.mockRejectedValue(new Error('offline'))
  await act(async () => window.dispatchEvent(new Event('fifa-progress-sync')))
  expect(container.querySelector('.champion-button')!.textContent).toBe('June')
})
it('does not invent a champion when every member has zero points', async () => {
  rpc.mockResolvedValue({ data: { rows: rows.map(row => ({ ...row, points: 0, rank: 1 })) }, error: null })
  await render()
  expect(container.querySelector('.champion-button .truncate')).toBeNull()
  await act(async () => container.querySelector<HTMLButtonElement>('.champion-button')!.click())
  expect(container.querySelectorAll('ol li')).toHaveLength(4)
})
it('keeps the actual previous champion in the header after a weekly reset', async () => {
  rpc.mockResolvedValue({ data: { rows: rows.map(row => ({ ...row, points: 0, rank: 1 })), champion: rows[0] }, error: null })
  await render()
  expect(container.querySelector('.champion-button')!.textContent).toBe('Fifa')
  await act(async () => container.querySelector<HTMLButtonElement>('.champion-button')!.click())
  expect(container.querySelectorAll('ol li')).toHaveLength(4)
  expect(container.querySelector('ol')!.textContent).toBe('—Fifa0—Peta0—June0—Worada0')
})
