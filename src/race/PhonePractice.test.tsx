// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { expect, it, vi } from 'vitest'
import PhonePractice from './PhonePractice'
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
it('runs independent binary practice, locks answers and keeps feedback in place until Next for either answer', async () => {
  vi.useFakeTimers()
  vi.spyOn(Math, 'random').mockReturnValue(.1)
  const host = document.createElement('div'); const root = createRoot(host)
  try {
    await act(async () => root.render(<PhonePractice/>))
    expect([...host.querySelectorAll('.slot-count')].map(slot => slot.textContent)).toEqual(['1', '1', '3', '20'])
    expect(host.querySelector('.practice-question')?.getAttribute('aria-label')).toMatch(/^Where is the /)
    expect(host.querySelector('.tonight-tree [lang=th]')).toBeNull()
    expect([...host.querySelectorAll<HTMLButtonElement>('.tonight-slot')].every(b => b.disabled)).toBe(true)
    const sentence = [...host.querySelectorAll('.tonight-slot > strong')].map(s => s.textContent).join(' ') + '?'
    expect(sentence).toBe(host.querySelector('.practice-question')?.getAttribute('aria-label'))
    expect(host.querySelectorAll('.practice-answers button')).toHaveLength(2)
    expect(host.querySelector<HTMLButtonElement>('.practice-feedback button')?.disabled).toBe(true)
    await act(async () => host.querySelectorAll<HTMLButtonElement>('.practice-answers button')[0].click())
    expect([...host.querySelectorAll<HTMLButtonElement>('.practice-answers button')].every(b => b.disabled)).toBe(true)
    await act(async () => vi.advanceTimersByTime(1100))
    expect(host.querySelector('header')?.textContent).toContain('1 / 60')
    expect(host.querySelector('[role=status]')?.textContent).toContain('ถูกต้อง!')
    await act(async () => host.querySelector<HTMLButtonElement>('.practice-feedback button')!.click())
    expect(host.querySelector('header')?.textContent).toContain('2 / 60')
    await act(async () => host.querySelectorAll<HTMLButtonElement>('.practice-answers button')[1].click())
    await act(async () => vi.advanceTimersByTime(2000))
    expect(host.querySelector('header')?.textContent).toContain('2 / 60')
    await act(async () => host.querySelector<HTMLButtonElement>('.practice-feedback button')!.click())
    expect(host.querySelector('header')?.textContent).toContain('3 / 60')
    expect(host.querySelector('[role=status]')?.textContent).toBe('')
    expect(host.querySelector<HTMLButtonElement>('.practice-feedback button')?.disabled).toBe(true)
  } finally { await act(async () => root.unmount()); vi.restoreAllMocks(); vi.useRealTimers() }
})

it('counts each answer once, completes the deck, and resets for another round', async () => {
  vi.spyOn(Math, 'random').mockReturnValue(.1)
  const host = document.createElement('div'); const root = createRoot(host)
  try {
    await act(async () => root.render(<PhonePractice/>))
    for (let i = 0; i < 60; i++) {
      await act(async () => {
        const answer = host.querySelector<HTMLButtonElement>('.practice-answers button')!
        answer.click(); answer.click()
      })
      await act(async () => {
        const next = host.querySelector<HTMLButtonElement>('.practice-feedback button')!
        next.click(); next.click()
      })
    }
    expect(host.querySelector('.practice-complete p')?.textContent).toBe('60 / 60')
    expect(host.querySelector('progress')?.value).toBe(60)
    await act(async () => host.querySelector<HTMLButtonElement>('.practice-complete button')!.click())
    expect(host.querySelector('header')?.textContent).toContain('1 / 60')
    expect(host.querySelector('progress')?.value).toBe(0)
    expect([...host.querySelectorAll<HTMLButtonElement>('.practice-answers button')].filter(button => !button.disabled)).toHaveLength(2)
  } finally { await act(async () => root.unmount()); vi.restoreAllMocks() }
})
