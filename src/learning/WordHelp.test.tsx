import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { expect, it, vi } from 'vitest'
import WordHelp from './WordHelp'
import { wordProfiles } from '../content/languageData'

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

it('keeps singular and plural word frames with their before and after words in the modal', () => {
  const container = document.createElement('div'); document.body.append(container)
  const root = createRoot(container)
  wordProfiles.city = {
    nouns: [{ singular: 'city', plural: 'cities', countability: 'countable' }], verbs: [],
    before: [], after: [], occurrences: 1, corpus_version: 'test',
    usage_frames: [
      { word: 'city', before: ['the', 'this'], after: ['is', 'was'], source: 'teaching' },
      { word: 'cities', before: ['the', 'these'], after: ['are', 'were'], source: 'teaching' },
    ],
  }
  try {
    act(() => root.render(<WordHelp text="The city is big." />))
    act(() => container.querySelector<HTMLElement>('[aria-label="Help with city"]')!.click())
    const frames = [...document.querySelectorAll('.word-help-dialog .teaching-orbit')]
    expect(frames).toHaveLength(2)
    expect(frames.map(frame => frame.querySelector('.orbit-focus > span:last-child')?.textContent)).toEqual(['city', 'cities'])
    expect(frames.map(frame => frame.querySelector('.orbit-before')?.textContent)).toEqual(['thethis', 'thethese'])
    expect(frames.map(frame => frame.querySelector('.orbit-after')?.textContent)).toEqual(['iswas', 'arewere'])
    expect(frames.map(frame => frame.querySelectorAll('.word-quantity g').length)).toEqual([1, 3])
  } finally {
    act(() => root.unmount()); container.remove(); delete wordProfiles.city
  }
})
