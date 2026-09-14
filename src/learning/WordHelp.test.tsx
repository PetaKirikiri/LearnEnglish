import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { expect, it } from 'vitest'
import WordHelp from './WordHelp'

it('pins hints on click, dismisses on a second click or outside click, and keeps them in the viewport', () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  const container = document.createElement('div'); document.body.append(container)
  const root = createRoot(container)
  act(() => root.render(<WordHelp text="last letter." />))
  const token = container.querySelector('[aria-label="Help with letter"]') as HTMLElement
  token.getBoundingClientRect = () => ({ left: window.innerWidth - 15, top: 200, bottom: 225, right: window.innerWidth, width: 15, height: 25, x: 0, y: 0, toJSON: () => ({}) })
  act(() => token.dispatchEvent(new MouseEvent('mouseover', { bubbles: true })))
  act(() => token.click())
  expect(document.querySelector('[role="tooltip"]')?.textContent).toBe('จดหมาย')
  const popup = document.querySelector('[role="tooltip"]') as HTMLElement
  expect(parseInt(popup.style.left) + 192).toBeLessThanOrEqual(window.innerWidth)
  act(() => token.click())
  expect(document.querySelector('[role="tooltip"]')).toBeNull()
  act(() => token.click())
  act(() => document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })))
  expect(document.querySelector('[role="tooltip"]')).toBeNull()
  act(() => root.unmount()); container.remove()
})
