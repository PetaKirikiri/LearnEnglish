import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, expect, it, vi } from 'vitest'
import QuestionFlag from './QuestionFlag'
import { getQuizCatalogue } from './quizContent'
const { insert } = vi.hoisted(() => ({ insert: vi.fn() }))
vi.mock('../lib/supabase', () => ({ supabase: { from: () => ({ insert }) } }))
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
const container = document.createElement('div')
const root = createRoot(container)
afterEach(async () => { await act(async () => root.render(null)); vi.clearAllMocks() })
async function click(text: string) {
  const button = [...container.querySelectorAll('button')].find(item => item.textContent?.includes(text) || item.getAttribute('aria-label') === text)!
  await act(async () => button.click())
}
it('stores the exact question and confirms only after saving', async () => {
  const question = getQuizCatalogue().sentences[0]
  insert.mockResolvedValue({ error: null })
  await act(async () => root.render(<QuestionFlag question={question} userId="learner" />))
  await click('Flag this question')
  await click('Send flag')
  expect(insert).toHaveBeenCalledWith(expect.objectContaining({ learner_id: 'learner', question, reason: 'More than one answer fits' }))
  expect(container.textContent).toContain('Saved for Peta')
})
it('keeps the form available and does not claim success when saving fails', async () => {
  insert.mockResolvedValue({ error: { code: 'network' } })
  await act(async () => root.render(<QuestionFlag question={getQuizCatalogue().sentences[0]} userId="learner" />))
  await click('Flag this question')
  await click('Send flag')
  expect(container.querySelector('[role="alert"]')?.textContent).toContain('wasn’t sent')
  expect(container.querySelector('textarea')).not.toBeNull()
  expect(container.textContent).not.toContain('Saved for Peta')
})
