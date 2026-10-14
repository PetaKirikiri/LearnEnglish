// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, expect, it, vi } from 'vitest'
import HotelContentPage from './HotelContentPage'
import { hotelQuestions } from './course'

const speech = vi.hoisted(() => ({ speak: vi.fn(), stop: vi.fn() }))
vi.mock('../learning/speech', () => ({ speakEnglish: speech.speak, stopEnglishSpeech: speech.stop }))
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
const host = document.createElement('div')
let root = createRoot(host)
afterEach(async () => { await act(() => root.unmount()); root = createRoot(host); vi.clearAllMocks() })

it('shows every real question, both complete answers and curriculum order', async () => {
  await act(() => root.render(<HotelContentPage />))
  const rows = [...host.querySelectorAll('tbody tr')]
  expect(rows).toHaveLength(hotelQuestions.length)
  rows.forEach((row, index) => {
    const question = hotelQuestions[index]
    const cells = row.querySelectorAll('td')
    expect(cells[0].textContent).toBe(String(index + 1))
    expect(cells[2].textContent).toBe((question.grammar?.prompt ?? question.english) + (question.grammar?.thai ?? ''))
    expect(cells[3].textContent).toBe(question.answers[question.correct].map(s => s.text).join(''))
    expect(cells[4].textContent).toBe(question.answers[question.correct === 0 ? 1 : 0].map(s => s.text).join(''))
  })
  expect(speech.speak).not.toHaveBeenCalled()
})

it('plays the actual lesson recording and stops on unmount', async () => {
  await act(() => root.render(<HotelContentPage />))
  const button = host.querySelector('button')!
  await act(() => button.click())
  expect(speech.speak).toHaveBeenCalledWith(hotelQuestions[0].english, hotelQuestions[0].audioUrl, expect.any(Function))
  expect(button.getAttribute('aria-pressed')).toBe('true')
  await act(() => speech.speak.mock.calls[0][2]('blocked'))
  expect(host.querySelector('[role="alert"]')?.textContent).toContain(hotelQuestions[0].english)
  await act(() => root.unmount())
  expect(speech.stop).toHaveBeenCalled()
  root = createRoot(host)
})
