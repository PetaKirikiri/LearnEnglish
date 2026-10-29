// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, expect, it, vi } from 'vitest'
import MobileNotes from './MobileNotes'
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
const host = document.createElement('div')
document.body.append(host)
let root = createRoot(host)
afterEach(async () => { await act(async () => root.unmount()); host.replaceChildren(); root = createRoot(host); vi.restoreAllMocks() })
const click = async (selector: string) => act(async () => host.querySelector<HTMLButtonElement>(selector)!.click())
it('opens directly into the requested lesson and keeps only the three lesson controls', async () => {
 window.history.replaceState({}, '', '/english/notes?lesson=2')
 await act(async () => root.render(<MobileNotes/>))
 expect(host.querySelectorAll('nav')).toHaveLength(1)
 expect(host.querySelectorAll('nav button')).toHaveLength(3)
 expect(host.querySelectorAll('.tonight-slot')).toHaveLength(4)
 expect(host.querySelector('.cw-sentence-board')?.getAttribute('aria-label')).toBe('Where are the shoes?')
 expect(host.querySelector('.index,.phases,.classroom-race')).toBeNull()
 await click('[aria-label="Slot 4: shoes"]')
 expect(host.querySelector('.pronunciation-comparison')).not.toBeNull()
 await click('[aria-label="Lesson 3"]')
 expect(location.search).toBe('?lesson=3')
 expect(host.querySelector('.cw-word-explanation')).toBeNull()
 await click('[data-picker-slot="1"]')
 expect([...host.querySelectorAll('.cw-word-chip strong')].map(e => e.textContent)).toEqual(['is','are'])
 await click('[aria-label="Lesson 1"]')
 expect(host.querySelector('.cw-sentence-board')?.getAttribute('aria-label')).toBe('Where is the hotel?')
 await click('[data-picker-slot="3"]')
 expect(host.querySelectorAll('.cw-word-chip')).toHaveLength(20)
})
it('uses recorded lesson-one audio and survives a direct reload with invalid lesson input', async () => {
 window.history.replaceState({}, '', '/english/notes?lesson=unknown')
 const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue()
 await act(async () => root.render(<MobileNotes/>))
 await click('.cw-sound')
 expect(play).toHaveBeenCalledOnce()
 expect(host.querySelector('audio')?.src).toContain('/audio/race-class-one/hotel-the.wav')
})
