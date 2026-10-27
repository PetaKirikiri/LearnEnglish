// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { expect, it } from 'vitest'
import Lesson from './lesson'
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
it('uses the original four boxes and learning window for new nouns and are', async () => {
  const host = document.createElement('div'), root = createRoot(host)
  document.body.append(host)
  const click = async (selector: string) => act(async () => host.querySelector<HTMLButtonElement>(selector)!.click())
  const choose = async (word: string) => act(async () => Array.from(host.querySelectorAll<HTMLButtonElement>('.cw-word-options button')).find(button => button.querySelector('strong')!.textContent === word)!.click())
  try {
    await act(async () => root.render(<Lesson page="example" lessonId="lesson-2"/>))
    expect(host.querySelectorAll('.example-unit-trigger')).toHaveLength(4)
    expect(host.querySelector('.cw-sentence-board')!.getAttribute('aria-label')).toBe('Where are the shoes?')
    expect(host.querySelector('.l2-steps')).toBeNull()
    await click('[aria-label="Slot 2: are"]')
    expect(host.querySelector('#word-explanation h1')!.textContent).toBe('are')
    await choose('is')
    await click('.cw-word-return')
    expect(host.querySelector('.cw-sentence-board')!.getAttribute('aria-label')).toBe('Where is the shoe?')
    await click('[aria-label="Slot 4: shoe"]')
    await choose('keys')
    expect(host.querySelector('#word-explanation h1')!.textContent).toBe('keys')
    await click('.cw-word-return')
    expect(host.querySelector('.cw-sentence-board')!.getAttribute('aria-label')).toBe('Where are the keys?')
    await click('[aria-label="Slot 4: keys"]')
    await choose('glasses')
    await click('.cw-word-return')
    await click('[aria-label="Slot 2: are"]')
    const singular = Array.from(host.querySelectorAll<HTMLButtonElement>('.cw-word-options button')).find(button => button.querySelector('strong')!.textContent === 'is')!
    expect(singular.disabled).toBe(true)
    await act(async () => root.render(<Lesson key="lesson-one" page="example"/>))
    expect(host.querySelectorAll('.example-unit-trigger')).toHaveLength(4)
    expect(host.querySelector('.cw-sentence-board')!.getAttribute('aria-label')).toBe('Where is the hotel?')
  } finally { await act(async () => root.unmount()); host.remove() }
})
