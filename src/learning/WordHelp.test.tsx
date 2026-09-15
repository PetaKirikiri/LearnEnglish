import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { expect, it, vi } from 'vitest'
import WordHelp from './WordHelp'

it('tokenizes all words, leaves gaps alone, and only opens help on deliberate activation', () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  const container = document.createElement('div'); document.body.append(container)
  const root = createRoot(container)
  const onHelp = vi.fn(), onOpenChange = vi.fn()
  act(() => root.render(<WordHelp text="last letter. Zzzunknown _____" onHelp={onHelp} onOpenChange={onOpenChange} pointsRemaining={8} />))
  expect(container.querySelectorAll('[role="button"]')).toHaveLength(3)
  const token = container.querySelector('[aria-label="Help with letter"]') as HTMLElement
  act(() => token.dispatchEvent(new MouseEvent('mouseover', { bubbles: true })))
  expect(onHelp).not.toHaveBeenCalled()
  expect(document.querySelector('dialog')?.open).toBe(false)
  act(() => token.click())
  expect(document.querySelector('dialog')?.open).toBe(true)
  expect(document.querySelector('dialog')?.textContent).toContain('จดหมาย')
  expect(document.querySelector('dialog')?.textContent).toContain('8 pts available')
  expect(onHelp).toHaveBeenCalledWith('letter')
  act(() => document.querySelector<HTMLButtonElement>('[aria-label="Close word help"]')!.click())
  expect(document.querySelector('dialog')?.open).toBe(false)
  expect(document.activeElement).toBe(token)
  const unknown = container.querySelector('[aria-label="Help with Zzzunknown"]') as HTMLElement
  act(() => unknown.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Enter' })))
  expect(document.querySelector('dialog')?.textContent).toContain('Translation not available yet.')
  expect(onHelp).toHaveBeenCalledTimes(1)
  act(() => document.querySelector('dialog')!.dispatchEvent(new Event('cancel', { cancelable: true })))
  expect(onOpenChange).toHaveBeenLastCalledWith(false)
  act(() => root.unmount()); container.remove()
})
