// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, expect, it, vi } from 'vitest'
import HotelWordHelp from './HotelWordHelp'
import { hotelQuestions } from './course'
import { hotelWordGlosses } from './wordGlosses'
import { thaiTranslations } from '../content/languageData'
import { normalizeHelpWord } from '../learning/helpPoints'
const mocks = vi.hoisted(() => ({ load: vi.fn(async () => 'database'), speak: vi.fn() }))
vi.mock('../lib/languageDatabase', () => ({ initializeLanguageDatabase: mocks.load }))
vi.mock('../learning/speech', () => ({ speakEnglish: mocks.speak }))
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
const host = document.createElement('div'); document.body.append(host)
let root = createRoot(host)
afterEach(async () => { await act(async () => root.unmount()); root = createRoot(host); vi.clearAllMocks() })

it('covers every Hotel English token with an offline Thai meaning', () => {
  const words = hotelQuestions.flatMap(q => q.english.match(/[\p{L}]+(?:[’'][\p{L}]+)*/gu) ?? [])
  expect([...new Set(words)].filter(w => !(hotelWordGlosses[normalizeHelpWord(w)] ?? thaiTranslations[normalizeHelpWord(w)]))).toEqual([])
})
it('opens the shared modal, loads shared profiles and replays the sentence', async () => {
  const question = hotelQuestions.find(q => q.english === 'The sauna.')!
  await act(async () => { root.render(<HotelWordHelp question={question} />) })
  expect(mocks.load).not.toHaveBeenCalled()
  const token = host.querySelector<HTMLElement>('[aria-label="Help with sauna"]')!
  await act(async () => { token.click() })
  expect(document.querySelector('dialog')?.open).toBe(true)
  expect(document.querySelector('dialog')?.textContent).toContain('ห้องซาวน่า')
  expect(mocks.load).toHaveBeenCalledTimes(1)
  await act(async () => { document.querySelector<HTMLButtonElement>('[aria-label="Hear sentence"]')!.click() })
  expect(mocks.speak).toHaveBeenCalledWith(question.english, question.audioUrl)
  await act(async () => { document.querySelector<HTMLButtonElement>('[aria-label="Close word help"]')!.click() })
  expect(document.querySelector('dialog')?.open).toBe(false)
  expect(document.activeElement).toBe(token)
})
