// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, expect, it, vi } from 'vitest'
const load = vi.hoisted(() => vi.fn())
vi.mock('./scoring', () => ({ loadHotelScoreboard: load }))
import HotelScoreboard from './HotelScoreboard'
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
const host = document.createElement('div'); document.body.append(host)
let root = createRoot(host)
afterEach(async () => { await act(() => root.unmount()); root = createRoot(host); vi.clearAllMocks() })
it('shows real returned members including zero points, with period switching', async () => {
  load.mockResolvedValue([{ id:'1',name:'Guest learner',avatarUrl:null,rank:1,points:20,answers:3,correct:2,lastActiveAt:'2026-10-12T02:00:00Z' },
    { id:'2',name:'New learner',avatarUrl:null,rank:2,points:0,answers:0,correct:0,lastActiveAt:'2026-10-12T02:00:00Z' }])
  await act(async () => { root.render(<HotelScoreboard />) })
  expect(host.querySelectorAll('tbody tr')).toHaveLength(2)
  expect(host.textContent).toContain('67%')
  expect(host.textContent).toContain('New learner')
  const today = [...host.querySelectorAll('button')].find(b=>b.textContent==='Today')!
  await act(async () => { today.click(); await new Promise(resolve => setTimeout(resolve, 0)) })
  expect(load.mock.calls.at(-1)?.[0]).toBe('today')
})
it('shows a retry on failure rather than a fake empty leaderboard', async () => {
  load.mockRejectedValue(new Error('Unavailable'))
  await act(async () => { root.render(<HotelScoreboard />) })
  expect(host.querySelector('[role="alert"]')?.textContent).toContain('Retry')
  expect(host.querySelector('table')).toBeNull()
})
