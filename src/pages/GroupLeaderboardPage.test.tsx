import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import GroupLeaderboardPage from './GroupLeaderboardPage'

const rpc = vi.hoisted(() => vi.fn())
vi.mock('../lib/supabase', () => ({ supabase: { rpc } }))
let root: Root
let container: HTMLDivElement
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  window.history.replaceState(null, '', '/app')
  rpc.mockReset()
  rpc.mockResolvedValue({ error: null, data: { rows: [{ id: 'me', name: 'Fifa', rank: 1, points: 100 }, { id: 'friend', name: 'Peta', rank: 2, points: 70 }] } })
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})
afterEach(() => { act(() => root.unmount()); container.remove() })
async function render() {
  await act(async () => { root.render(<GroupLeaderboardPage userId="me" onExit={() => {}} onPlay={() => {}} />) })
}
it('shows only names, ranks, scores and one back button', async () => {
  await render()
  expect(container.querySelectorAll('ol li')).toHaveLength(2)
  expect(container.querySelector('[role="img"]')?.getAttribute('aria-label')).toBe('First place: Fifa')
  const champion = container.querySelector('[role="img"]')!
  expect(champion.className).toContain('flex')
  const name = champion.querySelector('svg')!.nextElementSibling!
  expect(name.textContent).toBe('Fifa')
  expect(name.className).toContain('text-[#a66e19]')
  expect(name.className).not.toContain('absolute')
  expect(container.querySelector('ol')?.textContent).toBe('1Fifa1002Peta70')
  expect(container.querySelectorAll('button')).toHaveLength(1)
  expect(container.querySelector('button')?.getAttribute('aria-label')).toBe('Back to lesson')
  expect(container.querySelector('header, h1, h2, form, details, select, dialog, input')).toBeNull()
  expect(container.textContent).not.toMatch(/group|Invite|Scoring|Play|week|Resets|Leaderboard/i)
})
it('does not open setup controls even from an old invite URL', async () => {
  window.history.replaceState(null, '', '/app?group=abcdefghijklmnop')
  await render()
  expect(container.querySelector('form, dialog, input')).toBeNull()
  expect(container.querySelectorAll('button')).toHaveLength(1)
  expect(container.querySelectorAll('ol li')).toHaveLength(2)
  expect(rpc.mock.calls.map(call => call[0])).toEqual(['fifa_english_leaderboard'])
})
it('does not ask a learner without scores to join or create anything', async () => {
  rpc.mockResolvedValue({ data: { rows: [] }, error: null })
  await render()
  expect(container.textContent).toBe('‹No scores yet.')
  expect(container.querySelectorAll('button')).toHaveLength(1)
})
it('keeps rankings visible while refreshing in the background', async () => {
  await render()
  rpc.mockImplementation(() => new Promise(() => {}))
  act(() => window.dispatchEvent(new Event('fifa-progress-sync')))
  expect(container.querySelectorAll('ol li')).toHaveLength(2)
  expect(container.querySelector('[aria-label="Loading scores"]')).toBeNull()
})
it('reports a load failure without opening a dialog or adding controls', async () => {
  rpc.mockRejectedValue(new Error('offline'))
  await render()
  expect(container.textContent).toContain('Scores unavailable.')
  expect(container.querySelectorAll('button')).toHaveLength(1)
  expect(container.querySelector('dialog')).toBeNull()
  expect(container.querySelector('[role="img"]')).toBeNull()
})
it('updates the name on the cup when the leader changes', async () => {
  await render()
  rpc.mockResolvedValue({ error: null, data: { rows: [{ id: 'friend', name: 'Peta', rank: 1, points: 120 }, { id: 'me', name: 'Fifa', rank: 2, points: 100 }] } })
  await act(async () => window.dispatchEvent(new Event('fifa-progress-sync')))
  expect(container.querySelector('[role="img"]')?.getAttribute('aria-label')).toBe('First place: Peta')
  expect(container.querySelector('[role="img"]')?.textContent).toBe('Peta')
})
it('does not award a cup when everyone has zero points', async () => {
  rpc.mockResolvedValue({ error: null, data: { rows: [{ id: 'me', name: 'Fifa', rank: 1, points: 0 }] } })
  await render()
  expect(container.querySelector('[role="img"]')).toBeNull()
})
it('keeps all returned members visible, including new and inactive zero-point members', async () => {
  rpc.mockResolvedValue({ error: null, data: { rows: [
    { id: 'me', name: 'Fifa', rank: 1, points: 100 },
    { id: 'new', name: 'New member', rank: 2, points: 0 },
    { id: 'inactive', name: 'Inactive member', rank: 2, points: 0 },
  ] } })
  await render()
  expect(container.querySelectorAll('ol li')).toHaveLength(3)
  expect(container.querySelector('ol')?.textContent).toBe('1Fifa100—New member0—Inactive member0')
  expect(rpc.mock.calls).toEqual([['fifa_english_leaderboard']])
})
it('keeps member names visible if a background refresh fails', async () => {
  await render()
  rpc.mockRejectedValue(new Error('offline'))
  await act(async () => window.dispatchEvent(new Event('fifa-progress-sync')))
  expect(container.querySelectorAll('ol li')).toHaveLength(2)
  expect(container.textContent).toContain('Scores unavailable.')
})
