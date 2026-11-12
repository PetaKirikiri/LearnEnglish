import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { beforeEach, afterEach, expect, it, vi } from 'vitest'
const storage=vi.hoisted(()=>({from:vi.fn(),createSignedUrl:vi.fn()}))
vi.mock('../lib/supabase',()=>({supabase:{storage:{from:storage.from}}}))
import MemberAvatar from './MemberAvatar'

let root: Root
let container: HTMLDivElement
beforeEach(() => {
  storage.from.mockReturnValue({createSignedUrl:storage.createSignedUrl})
  storage.createSignedUrl.mockResolvedValue({data:{signedUrl:'https://example.com/private-portrait?token=short-lived'},error:null})
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  container = document.createElement('div')
  root = createRoot(container)
})
it('requests a short-lived authenticated URL for a private learner portrait',async()=>{
 await act(async()=>root.render(<MemberAvatar name="Learner" url="storage://english-learner-avatars/learner/photo.png"/>))
 expect(storage.from).toHaveBeenCalledWith('english-learner-avatars')
 expect(storage.createSignedUrl).toHaveBeenCalledWith('learner/photo.png',300)
 expect(container.querySelector('img')!.src).toBe('https://example.com/private-portrait?token=short-lived')
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
