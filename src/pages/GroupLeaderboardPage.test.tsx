import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import GroupLeaderboardPage from './GroupLeaderboardPage'

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }))
vi.mock('../lib/supabase', () => ({ supabase: { rpc } }))
let root: Root
let container: HTMLDivElement
const group = { id: 'g1', name: 'FIFA & friends', invite_code: 'ABCD1234EFAB5678', members: 2 }
const board = { weekStart: '2026-09-07', weekEnd: '2026-09-14', rows: [{ id: 'me', name: 'Peta', rank: 1, points: 20 }, { id: 'friend', name: 'Friend', rank: 1, points: 20 }] }
beforeEach(() => {
  vi.clearAllMocks()
  window.history.replaceState(null, '', '/')
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  container = document.createElement('div'); document.body.append(container); root = createRoot(container)
  rpc.mockImplementation(async (name: string) => ({ data: name === 'fifa_english_my_groups' ? [] : board, error: null }))
})
afterEach(() => { act(() => root.unmount()); container.remove() })
async function render() { await act(async () => root.render(<GroupLeaderboardPage userId="me" onExit={() => {}} onPlay={() => {}} />)) }
async function click(text: string) {
  const button = [...container.querySelectorAll('button')].find(b => b.textContent === text)
  expect(button).toBeTruthy()
  await act(async () => button!.click())
}

it('creates a group with explicit consent and loads its real board', async () => {
  await render()
  await click('Create group')
  expect(container.textContent).toContain('Your individual answers stay private.')
  rpc.mockImplementation(async (name: string) => ({ data: name === 'fifa_english_create_group' ? group.id : name === 'fifa_english_my_groups' ? [group] : board, error: null }))
  await click('Create')
  expect(rpc).toHaveBeenCalledWith('fifa_english_create_group', { group_name: 'FIFA & friends' })
  expect(container.querySelectorAll('ol li')).toHaveLength(2)
  expect(container.textContent).toContain('You')
})

it('opens an invite without silently joining, then joins only on confirmation', async () => {
  window.history.replaceState(null, '', '/?group=abcd1234efab5678')
  await render()
  expect(rpc.mock.calls.some(([name]) => name === 'fifa_english_join_group')).toBe(false)
  rpc.mockImplementation(async (name: string) => ({ data: name === 'fifa_english_join_group' ? group.id : name === 'fifa_english_my_groups' ? [group] : board, error: null }))
  await click('Join')
  expect(rpc).toHaveBeenCalledWith('fifa_english_join_group', { code: group.invite_code })
  expect(window.location.search).toBe('')
})

it('clears the old board while the previous week is loading', async () => {
  let resolvePrevious!: (value: unknown) => void
  rpc.mockImplementation(async (name: string, args?: { previous_week: boolean }) => {
    if (name === 'fifa_english_my_groups') return { data: [group], error: null }
    if (args?.previous_week) return new Promise(resolve => { resolvePrevious = resolve })
    return { data: board, error: null }
  })
  await render()
  expect(container.querySelectorAll('ol li')).toHaveLength(2)
  await click('Last week')
  expect(container.querySelector('ol')).toBeNull()
  expect(container.textContent).toContain('Loading scores')
  await act(async () => resolvePrevious({ data: { ...board, rows: board.rows.map(r => ({ ...r, points: 0 })) }, error: null }))
  expect(container.textContent).toContain('No points were earned last week.')
})

it('shows a load error instead of invented scores', async () => {
  rpc.mockResolvedValue({ data: null, error: { message: 'offline' } })
  await render()
  expect(container.querySelector('[role="alert"]')?.textContent).toContain('Could not load groups')
  expect(container.querySelector('ol')).toBeNull()
})
