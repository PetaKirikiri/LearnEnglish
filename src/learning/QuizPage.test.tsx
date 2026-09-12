import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import QuizPage from './QuizPage'
import { createQuizRound } from './quizContent'
import { trackProgress } from './progressSync'

vi.mock('./progressSync', () => ({ trackProgress: vi.fn() }))
vi.mock('../lib/supabase', () => ({ supabase: null }))
vi.mock('./speech', () => ({ canSpeakEnglish: () => true, speakEnglish: vi.fn(), stopEnglishSpeech: vi.fn() }))

let root: Root
let container: HTMLDivElement
beforeEach(() => {
  vi.useFakeTimers()
  vi.clearAllMocks()
  localStorage.clear()
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  act(() => root.render(<QuizPage mode="sentences" learnerId="test" userId="test" onExit={() => {}} />))
})
afterEach(() => {
  act(() => root.unmount())
  container.remove()
  vi.useRealTimers()
})
function click(text: string) {
  const button = [...container.querySelectorAll('button')].find(b => b.textContent === text)
  expect(button).toBeTruthy()
  act(() => button!.click())
}
function answer(index: number, correct = true) {
  const q = createQuizRound('sentences')[index]
  const choice = correct ? q.answer : q.choices.find(value => value !== q.answer)!
  click(`${q.choices.indexOf(choice) + 1}${choice}`)
}
function advance(ms: number) { act(() => vi.advanceTimersByTime(ms)) }

it('advances correct answers without Next and finishes the round exactly once', () => {
  for (let i = 0; i < 10; i++) {
    answer(i)
    advance(1200)
  }
  expect(container.querySelector('h1')?.textContent).toBe('10/10')
  advance(10000)
  expect(vi.mocked(trackProgress).mock.calls.filter(call => call[1] === 'round_completed')).toHaveLength(1)
  expect(vi.mocked(trackProgress).mock.calls.filter(call => call[1] === 'answer')).toHaveLength(10)
})

it('gives wrong answers five seconds and supports pausing and resuming', () => {
  answer(0, false)
  advance(1200)
  expect(container.textContent).toContain('Correct answer:')
  click('Pause to read')
  advance(10000)
  expect(container.querySelector('h1')?.textContent).toBe(createQuizRound('sentences')[0].prompt)
  click('Resume')
  advance(4999)
  expect(container.textContent).toContain('Correct answer:')
  advance(1)
  expect(container.querySelector('h1')?.textContent).toBe(createQuizRound('sentences')[1].prompt)
})

it('pauses when listening and cancels pending advancement when unmounted', () => {
  answer(0)
  click('🔊 Listen to the English')
  advance(10000)
  expect(container.textContent).toContain('Paused for reading')
  click('Resume')
  act(() => root.render(<div>Exited</div>))
  advance(10000)
  expect(container.textContent).toBe('Exited')
  expect(vi.mocked(trackProgress).mock.calls).toHaveLength(1)
})
