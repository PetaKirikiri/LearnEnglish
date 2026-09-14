import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { PETA_ACCOUNT_ID } from '../auth/appAccess'
import StudentHomePage from '../pages/StudentHomePage'
import { createPracticeRound } from './quizContent'
import { trackProgress } from './progressSync'
import { speakEnglish, type SpeechState } from './speech'

vi.mock('./progressSync', () => ({ trackProgress: vi.fn() }))
vi.mock('../lib/supabase', () => ({ supabase: null }))
vi.mock('../pages/GroupLeaderboardPage', () => ({ default: ({ onExit }: { onExit: () => void }) => <button onClick={onExit}>Return to question</button> }))
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
  act(() => root.render(<StudentHomePage displayName="test" userId="test" syncState="saved" onSignOut={() => {}} />))
})
afterEach(() => {
  act(() => root.unmount())
  container.remove()
  vi.useRealTimers()
})
function click(text: string) {
  const button = [...container.querySelectorAll('button')].find(b => b.textContent === text || b.getAttribute('aria-label') === text)
  expect(button).toBeTruthy()
  act(() => button!.click())
}
function answer(index: number, correct = true) {
  const q = createPracticeRound()[index]
  const choice = correct ? q.answer : q.choices.find(value => value !== q.answer)!
  click(choice)
}
function advance(ms: number) { act(() => vi.advanceTimersByTime(ms)) }

it('keeps every option neutral until answered and clears feedback on every new question', () => {
  for (let i = 0; i < 10; i++) {
    const options = [...container.querySelectorAll<HTMLButtonElement>('.answer-option')]
    expect(options.length).toBeGreaterThan(1)
    expect(new Set(options.map(option => option.className)).size).toBe(1)
    for (const option of options) {
      expect(option.disabled).toBe(false)
      expect(option.className).not.toMatch(/emerald|green|red-/)
    }
    expect(container.querySelector('footer')).toBeNull()
    answer(i, false)
    const correct = container.querySelector('.answer-option.bg-emerald-50')
    expect(correct?.textContent).toBe(createPracticeRound()[i].answer)
    advance(5000)
  }
  expect(container.querySelector('.answer-option.bg-emerald-50')).toBeNull()
  expect(container.querySelector('footer')).toBeNull()
})

it('opens the leaderboard beside the profile without losing or advancing the question', () => {
  const question = createPracticeRound()[0]
  expect(container.querySelector('header button[aria-label="Leaderboard"]')?.nextElementSibling?.className).toBe('account-menu')
  answer(0)
  click('Leaderboard')
  advance(10000)
  act(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' })))
  expect(container.textContent).toBe('Return to question')
  click('Return to question')
  expect(container.querySelector('h1')?.textContent).toBe(question.prompt)
  expect(container.textContent).toContain('Correct!')
  expect(vi.mocked(trackProgress).mock.calls.filter(call => call[1] === 'answer')).toHaveLength(1)
})

it('opens on a question and continues through mixed rounds without a menu or results screen', () => {
  for (let i = 0; i < 10; i++) {
    answer(i)
    advance(1200)
  }
  expect(container.querySelector('h1')?.textContent).toBe(createPracticeRound(1)[0].prompt)
  expect(container.textContent).not.toMatch(/Your space|Practice|Words|Sentences|Stories|Home|Round complete/i)
  advance(10000)
  expect(vi.mocked(trackProgress).mock.calls.filter(call => call[1] === 'round_completed')).toHaveLength(1)
  expect(vi.mocked(trackProgress).mock.calls.filter(call => call[1] === 'answer')).toHaveLength(10)
})

it('gives wrong answers five seconds and supports pausing and resuming', () => {
  answer(0, false)
  advance(1200)
  expect(container.textContent).toContain('Correct answer:')
  click('Pause')
  advance(10000)
  expect(container.querySelector('h1')?.textContent).toBe(createPracticeRound()[0].prompt)
  click('Resume')
  advance(4999)
  expect(container.textContent).toContain('Correct answer:')
  advance(1)
  expect(container.querySelector('h1')?.textContent).toBe(createPracticeRound()[1].prompt)
})

it('continues beyond thirty answers without a finish line or resetting visible progress', () => {
  for (let index = 0; index < 35; index++) {
    const question = createPracticeRound(Math.floor(index / 10))[index % 10]
    expect(container.querySelector('h1')?.textContent).toBe(question.prompt)
    expect(container.querySelector('[role="progressbar"]')).toBeNull()
    expect(container.querySelector('header')?.textContent).not.toMatch(/\d+\s*\/\s*10/)
    click(question.answer)
    advance(1200)
    expect(container.querySelector('footer')).toBeNull()
  }
  expect(container.querySelector('h1')?.textContent).toBe(createPracticeRound(3)[5].prompt)
  const answers = vi.mocked(trackProgress).mock.calls.filter(call => call[1] === 'answer')
  expect(answers).toHaveLength(35)
  expect(new Set(answers.map(call => call[3])).size).toBe(35)
  expect(vi.mocked(trackProgress).mock.calls.filter(call => call[1] === 'round_completed')).toHaveLength(3)
})

it('pauses when listening and cancels pending advancement when unmounted', () => {
  answer(0)
  click('Play audio')
  advance(10000)
  expect(container.textContent).toContain('Paused for reading')
  click('Resume')
  act(() => root.render(<div>Exited</div>))
  advance(10000)
  expect(container.textContent).toBe('Exited')
  expect(vi.mocked(trackProgress).mock.calls).toHaveLength(1)
})

it('autoplays a gapped sentence, then the complete sentence only after answering', () => {
  const question = createPracticeRound()[0]
  expect(speakEnglish).toHaveBeenLastCalledWith(question.prompt, question.gapAudioUrl, expect.any(Function))
  const notify = vi.mocked(speakEnglish).mock.calls.at(-1)![2]!
  act(() => notify('playing'))
  answer(0)
  expect(speakEnglish).toHaveBeenLastCalledWith(question.spokenText, question.audioUrl, expect.any(Function))
  advance(10000)
  expect(container.querySelector('h1')?.textContent).toBe(question.prompt)
  act(() => notify('ended'))
  advance(1200)
  const next = createPracticeRound()[1]
  expect(speakEnglish).toHaveBeenLastCalledWith(next.contextSentence, next.contextAudioUrl, expect.any(Function))
})

it('autoplays vocabulary in a short sentence and keeps the Thai-to-English target hidden', () => {
  answer(0)
  advance(1200)
  const question = createPracticeRound()[1]
  expect(speakEnglish).toHaveBeenLastCalledWith(question.contextSentence, question.contextAudioUrl, expect.any(Function))
  const context = container.querySelector('[lang="en"]')!
  expect(context).toBeTruthy()
  expect(context.textContent).toBe(question.prompt === question.spokenText ? question.contextSentence : question.contextSentence!.replace(new RegExp(`\\b${question.spokenText}\\b`, 'ig'), '_____'))
})

it('offers a tap to play when the browser blocks autoplay', () => {
  const notify = vi.mocked(speakEnglish).mock.calls.at(-1)![2] as (state: SpeechState) => void
  act(() => notify('blocked'))
  expect(container.querySelector('button[aria-label="Play audio"]')).not.toBeNull()
})

it('freezes automatic progression while a report is open and resumes after closing', () => {
  answer(0)
  click('Flag this question')
  advance(20000)
  expect(container.querySelector('h1')?.textContent).toBe(createPracticeRound()[0].prompt)
  expect(container.querySelector('dialog')?.open).toBe(true)
  click('Close report')
  advance(1200)
  expect(container.querySelector('h1')?.textContent).toBe(createPracticeRound()[1].prompt)
})
it('allows learners to turn auto progression off', () => {
  answer(0)
  click('Auto on')
  advance(20000)
  expect(container.querySelector('h1')?.textContent).toBe(createPracticeRound()[0].prompt)
  click('Next')
  expect(container.querySelector('h1')?.textContent).toBe(createPracticeRound()[1].prompt)
  expect(localStorage.getItem('fifa:auto:test')).toBe('false')
})

it('tracks each question under its own learning category in the same round', () => {
  answer(0)
  advance(1200)
  answer(1)
  const events = vi.mocked(trackProgress).mock.calls.filter(call => call[1] === 'answer')
  expect(events.map(call => call[2]?.mode)).toEqual(['sentences', 'vocabulary'])
  expect(events[0][2]?.roundId).toBe(events[1][2]?.roundId)
})

it('shows the admin link only for Peta’s account, never based on the display name', () => {
  act(() => root.render(<StudentHomePage displayName="Peta" userId="another-account" syncState="saved" onSignOut={() => {}} />))
  expect(container.querySelector('a[href="/admin"]')).toBeNull()
  act(() => root.render(<StudentHomePage displayName="Peta" userId={PETA_ACCOUNT_ID} syncState="saved" onSignOut={() => {}} />))
  expect(container.querySelector('.account-menu a[href="/admin"]')?.textContent).toBe('Admin')
  expect(container.querySelector('h1')?.textContent).toBe(createPracticeRound()[0].prompt)
})
