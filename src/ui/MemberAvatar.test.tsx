import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { beforeEach, afterEach, expect, it } from 'vitest'
import MemberAvatar from './MemberAvatar'

let root: Root
let container: HTMLDivElement
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  container = document.createElement('div')
  root = createRoot(container)
})
afterEach(() => act(() => root.unmount()))
it('shows the stored photo with fixed circular dimensions', () => {
  act(() => root.render(<MemberAvatar name="Fifa" url="https://example.com/fifa.jpg" size={28} />))
  expect(container.querySelector('img')!.getAttribute('src')).toBe('https://example.com/fifa.jpg')
  expect(container.firstElementChild!.className).toContain('rounded-full')
  expect((container.firstElementChild as HTMLElement).style.width).toBe('28px')
})
it('falls back to an initial for missing or broken photos, and retries a changed photo', () => {
  act(() => root.render(<MemberAvatar name="Fifa" />))
  expect(container.querySelector('[data-initial]')!.getAttribute('data-initial')).toBe('F')
  act(() => root.render(<MemberAvatar name="Fifa" url="https://example.com/old.jpg" />))
  act(() => container.querySelector('img')!.dispatchEvent(new Event('error')))
  expect(container.querySelector('img')).toBeNull()
  expect(container.querySelector('[data-initial]')!.getAttribute('data-initial')).toBe('F')
  act(() => root.render(<MemberAvatar name="Fifa" url="https://example.com/new.jpg" />))
  expect(container.querySelector('img')!.getAttribute('src')).toBe('https://example.com/new.jpg')
})
it('does not load unsafe or non-HTTPS image URLs', () => {
  act(() => root.render(<MemberAvatar name="Fifa" url="javascript:alert(1)" />))
  expect(container.querySelector('img')).toBeNull()
})
