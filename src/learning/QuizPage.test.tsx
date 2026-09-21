import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { PETA_ACCOUNT_ID } from '../auth/appAccess'
import StudentHomePage from '../pages/StudentHomePage'
import { createPracticeRound } from './quizContent'
import { trackProgress } from './progressSync'
import { speakEnglish, type SpeechState } from './speech'
import { orderedQuestionBank } from './questionSheet'
import { loadLearningMemory, recordAnswer, saveLearningMemory, type LearningMemory } from './learningMemory'

// Exercise the established UI against its original general-course fixtures.
vi.mock('./quizContent', async importOriginal => {
  const content = await importOriginal<typeof import('./quizContent')>()
  return { ...content, createPracticeRound: content.createGeneralPracticeRound }
})

vi.mock('./progressSync', () => ({ trackProgress: vi.fn(), pending: () => [], loadLearnerEvents: () => new Promise(() => {}) }))
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

function openHint(word: string) {
  act(() => container.querySelector<HTMLElement>(`[aria-label="Help with ${word}"]`)!.click())
}
function closeHint() {
  act(() => document.querySelector<HTMLButtonElement>('[aria-label="Close word help"]')!.click())
}
it('reduces the available reward once per word, records hints with the answer, and resets on the next question', () => {
  openHint('train')
  expect(container.querySelector('[data-testid="available-points"]')?.textContent).toContain('8 pts')
  act(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: '1' })))
  expect(container.querySelector('footer')).toBeNull()
  closeHint()
  openHint('train'); closeHint()
  expect(container.querySelector('[data-testid="available-points"]')?.textContent).toContain('8 pts')
  openHint('city'); closeHint()
  expect(container.querySelector('[data-testid="available-points"]')?.textContent).toContain('6 pts')
  click('Leaderboard'); click('Return to question')
  expect(container.querySelector('[data-testid="available-points"]')?.textContent).toContain('6 pts')
  answer(0)
  const event = vi.mocked(trackProgress).mock.calls.find(call => call[1] === 'answer')!
  expect(event[2]?.helpWords).toEqual(['train', 'city'])
  openHint('build')
  advance(10000)
  expect(container.querySelector('footer')).not.toBeNull()
  expect(event[2]?.helpWords).toEqual(['train', 'city'])
  closeHint(); click('Next')
  expect(container.querySelector('[data-testid="available-points"]')?.textContent).toContain('10 pts')
})

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
    click('Next')
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
  expect(container.textContent).toContain('Return to question')
  expect(container.querySelector('.question-panel')).toBeNull()
  click('Return to question')
  expect(container.querySelector('h1')?.textContent).toBe(question.prompt)
  expect(container.textContent).toContain('Correct!')
  expect(vi.mocked(trackProgress).mock.calls.filter(call => call[1] === 'answer')).toHaveLength(1)
})

it('opens on the content block and continues without a menu or results screen', () => {
  for (let i = 0; i < 10; i++) {
    answer(i)
    click('Next')
  }
  expect(container.querySelector('h1')?.textContent).toBe(createPracticeRound(1, loadLearningMemory('test'))[0].prompt)
  expect(container.textContent).not.toMatch(/Your space|Practice|Words|Sentences|Stories|Home|Round complete/i)
  advance(10000)
  expect(vi.mocked(trackProgress).mock.calls.filter(call => call[1] === 'round_completed')).toHaveLength(1)
  expect(vi.mocked(trackProgress).mock.calls.filter(call => call[1] === 'answer')).toHaveLength(10)
})

it('keeps wrong answers visible indefinitely until Next is tapped', () => {
  answer(0, false)
  advance(60000)
  expect(container.textContent).toContain('Correct answer:')
  expect(container.querySelector('button[aria-label="Pause"]')).toBeNull()
  expect(vi.mocked(trackProgress).mock.calls.filter(call => call[1] === 'answer')).toHaveLength(1)
  click('Next')
  expect(container.querySelector('h1')?.textContent).toBe(createPracticeRound()[1].prompt)
  expect(container.querySelector('footer')).toBeNull()
})

it('continues beyond thirty answers without a finish line or resetting visible progress', () => {
  let currentRound = createPracticeRound()
  for (let index = 0; index < 35; index++) {
    if (index % 10 === 0) currentRound = createPracticeRound(Math.floor(index / 10), loadLearningMemory('test'))
    const question = currentRound[index % 10]
    expect(container.querySelector('h1')?.textContent).toBe(question.prompt)
    expect(container.querySelector('[role="progressbar"]')).toBeNull()
    expect(container.querySelector('header')?.textContent).not.toMatch(/\d+\s*\/\s*10/)
    click(question.answer)
    click('Next')
    expect(container.querySelector('footer')).toBeNull()
  }
  expect(container.querySelector('h1')?.textContent).toBe(currentRound[5].prompt)
  const answers = vi.mocked(trackProgress).mock.calls.filter(call => call[1] === 'answer')
  expect(answers).toHaveLength(35)
  expect(new Set(answers.map(call => call[3])).size).toBe(35)
  expect(vi.mocked(trackProgress).mock.calls.filter(call => call[1] === 'round_completed')).toHaveLength(3)
})

it('keeps feedback visible while replaying audio and never advances after unmount', () => {
  answer(0)
  click('Play audio')
  const playing = vi.mocked(speakEnglish).mock.calls.at(-1)![2]!
  act(() => playing('playing'))
  advance(10000)
  expect(container.textContent).toContain('Correct!')
  act(() => root.render(<div>Exited</div>))
  advance(60000)
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
  const complete = vi.mocked(speakEnglish).mock.calls.at(-1)![2]!
  act(() => complete('playing'))
  advance(10000)
  expect(container.querySelector('h1')?.textContent).toBe(question.prompt)
  act(() => complete('ended'))
  advance(1399)
  expect(container.querySelector('footer')).not.toBeNull()
  advance(1)
  const next = createPracticeRound()[1]
  expect(speakEnglish).toHaveBeenLastCalledWith(next.prompt, next.gapAudioUrl, expect.any(Function))
})

it('autoplays vocabulary in a short sentence and keeps the Thai-to-English target hidden', () => {
  let memory: LearningMemory = {}
  for (const { question: q } of orderedQuestionBank()) {
    if (q.mode === 'vocabulary') break
    for (let day = 0; day < 3; day++) memory = recordAnswer(memory, q, true, Date.UTC(2026, 8, 1 + day), `pass-${day}`)
  }
  saveLearningMemory('vocab-test', memory)
  act(() => root.render(<StudentHomePage key="vocab" displayName="vocab-test" userId="vocab-test" syncState="saved" onSignOut={() => {}} />))
  const round = createPracticeRound(0, memory)
  const vocabularyIndex = round.findIndex(q => q.mode === 'vocabulary')
  expect(vocabularyIndex).toBeGreaterThanOrEqual(0)
  for (const earlier of round.slice(0, vocabularyIndex)) { click(earlier.answer); click('Next') }
  const question = round[vocabularyIndex]
  expect(question.mode).toBe('vocabulary')
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

it('blocks Next while a report is open and keeps a wrong answer for review', () => {
  answer(0, false)
  click('Flag this question')
  advance(20000)
  expect(container.querySelector('h1')?.textContent).toBe(createPracticeRound()[0].prompt)
  expect(container.querySelector('dialog')?.open).toBe(true)
  click('Next')
  expect(container.querySelector('footer')).not.toBeNull()
  click('Close report')
  advance(60000)
  expect(container.querySelector('footer')).not.toBeNull()
  click('Next')
  expect(container.querySelector('h1')?.textContent).toBe(createPracticeRound()[1].prompt)
})
it('advances only once when Enter is pressed during the automatic feedback pause', () => {
  localStorage.setItem('fifa:auto:test', 'true')
  act(() => root.render(<StudentHomePage key="old-auto-setting" displayName="test" userId="test" syncState="saved" onSignOut={() => {}} />))
  answer(0)
  advance(500)
  expect(container.textContent).toContain('Correct!')
  expect(container.textContent).not.toMatch(/Auto on|Auto off|Moving on automatically|Resume|Pause/)
  act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
  })
  expect(container.querySelector('h1')?.textContent).toBe(createPracticeRound()[1].prompt)
  expect(container.querySelector('footer')).toBeNull()
})

it('tracks the active content block without injecting random vocabulary', () => {
  answer(0)
  click('Next')
  answer(1)
  const events = vi.mocked(trackProgress).mock.calls.filter(call => call[1] === 'answer')
  expect(events.map(call => call[2]?.mode)).toEqual(['sentences', 'sentences'])
  expect(events[0][2]?.roundId).toBe(events[1][2]?.roundId)
})

it('shows the admin link only for Peta’s account, never based on the display name', () => {
  act(() => root.render(<StudentHomePage displayName="Peta" userId="another-account" syncState="saved" onSignOut={() => {}} />))
  expect(container.querySelector('a[href="/admin"]')).toBeNull()
  act(() => root.render(<StudentHomePage displayName="Peta" userId={PETA_ACCOUNT_ID} syncState="saved" onSignOut={() => {}} />))
  expect(container.querySelector('.account-menu a[href="/admin"]')?.textContent).toBe('Admin')
  expect(container.querySelector('h1')?.textContent).toBe(createPracticeRound()[0].prompt)
})

it('keeps collection details in the profile and resumes the same question', () => {
  const prompt = container.querySelector('h1')?.textContent
  expect(container.querySelector('.learner-level')?.textContent).toBe('Level —')
  expect(container.querySelector('[aria-label="Word collection"]')).toBeNull()
  click('Open your profile')
  expect(container.textContent).toContain('test’s profile')
  const answersBefore = vi.mocked(trackProgress).mock.calls.length
  act(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: '1' })))
  expect(vi.mocked(trackProgress).mock.calls).toHaveLength(answersBefore)
  click('← Back to practice')
  expect(container.querySelector('h1')?.textContent).toBe(prompt)
})

it('keeps the same header controls in place across practice, profile, and leaderboard', () => {
  const header = container.querySelector('.lesson-header')!
  const controls = [...header.children]
  const menu = container.querySelector<HTMLDetailsElement>('.account-menu')!
  menu.open = true
  click('Your profile')
  expect(menu.open).toBe(false)
  expect(container.querySelector('.lesson-header')).toBe(header)
  expect([...header.children]).toEqual(controls)
  expect(container.textContent).toContain('test’s profile')
  click('Leaderboard')
  expect(container.querySelector('.lesson-header')).toBe(header)
  expect(container.textContent).toContain('Return to question')
  expect(container.textContent).not.toContain('test’s profile')
  click('Open your profile')
  expect(container.textContent).toContain('test’s profile')
  click('← Back to practice')
  expect(container.querySelector('.question-panel')).not.toBeNull()
  expect(container.querySelectorAll('.lesson-header')).toHaveLength(1)
  expect(container.querySelectorAll('.englishsuccess-corner-logo')).toHaveLength(1)
})

it('advances a correct answer if audio is blocked, but not while word help is open', () => {
  answer(0)
  const notify = vi.mocked(speakEnglish).mock.calls.at(-1)![2]!
  act(() => notify('blocked'))
  openHint('city')
  advance(30000)
  expect(container.querySelector('h1')?.textContent).toBe(createPracticeRound()[0].prompt)
  closeHint()
  advance(1400)
  expect(container.querySelector('h1')?.textContent).toBe(createPracticeRound()[1].prompt)
  expect(vi.mocked(trackProgress).mock.calls.filter(call => call[1] === 'answer')).toHaveLength(1)
})

it('does not get stuck on a correct answer if audio never reports completion', () => {
  answer(0)
  const notify = vi.mocked(speakEnglish).mock.calls.at(-1)![2]!
  act(() => notify('playing'))
  advance(25000)
  expect(container.querySelector('h1')?.textContent).toBe(createPracticeRound()[1].prompt)
})

it('pauses automatic advancement while the explanation is expanded', () => {
  answer(0)
  const details = container.querySelector<HTMLDetailsElement>('footer details')!
  act(() => { details.open = true; details.dispatchEvent(new Event('toggle')) })
  advance(30000)
  expect(container.querySelector('h1')?.textContent).toBe(createPracticeRound()[0].prompt)
  act(() => { details.open = false; details.dispatchEvent(new Event('toggle')) })
  advance(1400)
  expect(container.querySelector('h1')?.textContent).toBe(createPracticeRound()[1].prompt)
})
