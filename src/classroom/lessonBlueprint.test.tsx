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
    expect(host.querySelector('.cw-word-explanation h1')!.textContent).toBe('are')
    await choose('is')
    await click('.cw-word-return')
    expect(host.querySelector('.cw-sentence-board')!.getAttribute('aria-label')).toBe('Where is the shoe?')
    await click('[aria-label="Slot 4: shoe"]')
    await click('[aria-label="Plural words"]')
    await choose('keys')
    expect(host.querySelector('.cw-word-explanation h1')!.textContent).toBe('keys')
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

it('switches words from the inline conveyor, closes it, and keeps noun/verb agreement', async () => {
  const host = document.createElement('div'), root = createRoot(host)
  document.body.append(host)
  const click = async (selector: string) => act(async () => host.querySelector<HTMLButtonElement>(selector)!.click())
  const choose = async (word: string) => act(async () => Array.from(host.querySelectorAll<HTMLButtonElement>('.cw-word-chip')).find(button => button.querySelector('strong')!.textContent === word)!.click())
  try {
    await act(async () => root.render(<Lesson page="example" lessonId="lesson-2"/>))
    await click('[data-picker-slot="1"]')
    expect(host.querySelector('.cw-word-explanation')).toBeNull()
    expect(host.querySelector('.cw-word-conveyor')!.hasAttribute('hidden')).toBe(false)
    await choose('is')
    expect(host.querySelector('.cw-sentence-board')!.getAttribute('aria-label')).toBe('Where is the shoe?')
    expect(host.querySelector('.cw-word-conveyor')!.hasAttribute('hidden')).toBe(true)
    expect(document.activeElement).toBe(host.querySelector('[data-picker-slot="1"]'))
    expect(host.querySelector('.slot-1 .cw-game-icon-clock')).not.toBeNull()
    await click('[data-picker-slot="2"]')
    await choose('my')
    expect(host.querySelector('.cw-sentence-board')!.getAttribute('aria-label')).toBe('Where is my shoe?')
    await click('[data-picker-slot="3"]')
    await choose('keys')
    expect(host.querySelector('.cw-sentence-board')!.getAttribute('aria-label')).toBe('Where are my keys?')
    expect(host.querySelector('.slot-1 .cw-game-icon-clocks')).not.toBeNull()
    expect(host.querySelector('.cw-word-conveyor')!.hasAttribute('hidden')).toBe(true)
    await click('[data-picker-slot="3"]')
    await choose('glasses')
    await click('[data-picker-slot="1"]')
    const singular = Array.from(host.querySelectorAll<HTMLButtonElement>('.cw-word-chip')).find(button=>button.querySelector('strong')!.textContent==='is')!
    expect(singular.disabled).toBe(true)
    await act(async()=>singular.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true})))
    expect(host.querySelector('.cw-word-conveyor')!.hasAttribute('hidden')).toBe(true)
  } finally { await act(async()=>root.unmount()); host.remove() }
})
