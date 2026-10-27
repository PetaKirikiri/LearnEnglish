// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { expect, it, vi } from 'vitest'
import RaceWalkthrough from './RaceWalkthrough'
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
it('lets students rehearse without posting answers, and clears feedback when changing formats', async () => {
  const host = document.createElement('div'), root = createRoot(host)
  const fetch = vi.spyOn(globalThis, 'fetch')
  try {
    await act(async () => root.render(<RaceWalkthrough/>))
    expect(host.querySelector('.rw-phone img')!.getAttribute('src')).toContain('judgement-phone')
    expect(host.querySelector('.rw-modes button[aria-pressed=true]')!.textContent).toContain('รอบ 1')
    await act(async () => host.querySelectorAll<HTMLButtonElement>('.rw-modes button')[1].click())
    await act(async () => host.querySelector<HTMLButtonElement>('.rw-try button')!.click())
    expect(host.querySelector('[role=status]')!.textContent).toContain('ถูกต้อง')
    await act(async () => host.querySelectorAll<HTMLButtonElement>('.rw-modes button')[0].click())
    expect(host.querySelector('[role=status]')!.textContent?.trim()).toBe('')
    expect(host.querySelector('.rw-phone img')!.getAttribute('src')).toContain('judgement-phone')
    await act(async () => host.querySelectorAll<HTMLButtonElement>('.rw-examples button')[1].click())
    expect(host.querySelector('.tonight-slots')!.getAttribute('aria-label')).toBe('Where the hotel?')
    await act(async () => host.querySelectorAll<HTMLButtonElement>('.rw-try button')[1].click())
    expect(host.querySelector('[role=status]')!.textContent).toContain('✓ ถูกต้อง')
    expect(fetch).not.toHaveBeenCalled()
  } finally { await act(async () => root.unmount()); fetch.mockRestore() }
})
