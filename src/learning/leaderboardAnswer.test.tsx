import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { expect, it, vi } from 'vitest'
import QuizPage from './QuizPage'
import { createPracticeRound } from './quizContent'
import { questionProgressKey } from './progressData'
import { trackProgress } from './progressSync'

vi.mock('./progressSync', () => ({ trackProgress: vi.fn(), pending: () => [], loadLearnerEvents: () => new Promise(() => {}) }))
vi.mock('../lib/supabase', () => ({ supabase: null }))
vi.mock('./speech', () => ({ canSpeakEnglish: () => false, speakEnglish: vi.fn(), stopEnglishSpeech: vi.fn() }))

it('submits the actual selected answer for server-side scoring, once per question', () => {
  vi.useFakeTimers()
  localStorage.clear()
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  const container = document.createElement('div')
  const root = createRoot(container)
  try {
    act(() => root.render(<QuizPage learnerId="test" userId="test" onSignOut={() => {}} />))
    const question = createPracticeRound()[0]
    const button = [...container.querySelectorAll<HTMLButtonElement>('.answer-option')].find(b => b.textContent === question.answer)
    expect(button).toBeTruthy()
    act(() => { button!.click(); button!.click() })
    expect(trackProgress).toHaveBeenCalledExactlyOnceWith('test', 'answer', expect.objectContaining({
      questionId: questionProgressKey(question), choice: question.answer, correct: true,
    }), expect.any(String))
  } finally { act(() => root.unmount()); vi.useRealTimers() }
})
