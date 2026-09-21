import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import WordConfidence from './WordConfidence'
import { cachedConfidence, loadConfidence, saveConfidence } from './confidence'

vi.mock('./confidence', () => ({ cachedConfidence: vi.fn(), loadConfidence: vi.fn(), saveConfidence: vi.fn() }))
let root: Root
let container: HTMLDivElement
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  vi.resetAllMocks()
  vi.mocked(cachedConfidence).mockReturnValue(null)
  vi.mocked(loadConfidence).mockResolvedValue({ score: null, source: 'saved' })
  vi.mocked(saveConfidence).mockResolvedValue('saved')
  container = document.createElement('div'); document.body.append(container)
  root = createRoot(container)
})
afterEach(() => { act(() => root.unmount()); container.remove() })

it('does not select or save any confidence until the learner chooses it', async () => {
  await act(async () => root.render(<WordConfidence userId="learner" word="city" />))
  expect(container.textContent).toContain('ยังไม่ประเมิน')
  expect(container.querySelectorAll('[aria-pressed="true"]')).toHaveLength(0)
  expect(saveConfidence).not.toHaveBeenCalled()
  await act(async () => container.querySelectorAll<HTMLButtonElement>('.confidence-scores button')[1].click())
  expect(saveConfidence).toHaveBeenCalledExactlyOnceWith('learner', 'city', 2)
  const selected = container.querySelectorAll('[aria-pressed="true"]')
  expect(selected).toHaveLength(1)
  expect(selected[0].getAttribute('aria-label')).toContain('2 จาก 5')
})

it('highlights only the rating actually loaded for this word', async () => {
  vi.mocked(loadConfidence).mockResolvedValue({ score: 3, source: 'saved' })
  await act(async () => root.render(<WordConfidence userId="learner" word="train" />))
  expect(container.querySelectorAll('[aria-pressed="true"]')).toHaveLength(1)
  expect(container.querySelector('[aria-pressed="true"]')?.getAttribute('aria-label')).toContain('3 จาก 5')
  expect(saveConfidence).not.toHaveBeenCalled()
})
