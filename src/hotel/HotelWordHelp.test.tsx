// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, expect, it, vi } from 'vitest'
import HotelWordHelp from './HotelWordHelp'
import { hotelWordGlosses } from './wordGlosses'
import { thaiTranslations } from '../content/languageData'
import { normalizeHelpWord } from '../learning/helpPoints'
import { hotelWordProfiles, hotelWordExamples, hotelReferenceQuestions as hotelQuestions } from './wordProfiles'
import { wordProfileSchema } from '../learning/wordInfo/types'
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
  expect(document.querySelector('dialog')?.textContent).toContain('saunas')
  expect(document.querySelector('dialog')?.textContent).toContain('The sauna.')
  expect(mocks.load).toHaveBeenCalledTimes(1)
  await act(async () => { document.querySelector<HTMLButtonElement>('[aria-label="Hear sentence"]')!.click() })
  expect(mocks.speak).toHaveBeenCalledWith(question.english, question.audioUrl)
  await act(async () => { document.querySelector<HTMLButtonElement>('[aria-label="Close word help"]')!.click() })
  expect(document.querySelector('dialog')?.open).toBe(false)
  expect(document.activeElement).toBe(token)
})
it('gives every Hotel token a valid profile, real Hotel neighbours and relevant examples', () => {
  const words = [...new Set(hotelQuestions.flatMap(q => q.english.match(/[\p{L}]+(?:[’'][\p{L}]+)*/gu) ?? []).map(normalizeHelpWord))]
  expect(words.length).toBeGreaterThanOrEqual(271)
  for (const word of words) {
    const profile = wordProfileSchema.parse(hotelWordProfiles[word])
    expect(profile.nouns.length || profile.verbs.length || profile.grammar_note_th, word).toBeTruthy()
    expect(profile.corpus_version).toBe('hotel-grammar-v2')
    const examples = hotelWordExamples(word,'')
    expect(examples.length,word).toBeGreaterThan(0)
    for (const example of examples) expect(hotelQuestions.some(q=>q.english===example)).toBe(true)
    const sentences = hotelQuestions.map(q=>(q.english.toLowerCase().replaceAll('’',"'").match(/[a-z]+(?:'[a-z]+)*/g)??[]))
    for(const neighbour of profile.before) expect(sentences.some(ws=>ws.some((w,i)=>w===word&&ws[i-1]===neighbour.word)),word).toBe(true)
    for(const neighbour of profile.after) expect(sentences.some(ws=>ws.some((w,i)=>w===word&&ws[i+1]===neighbour.word)),word).toBe(true)
  }
})
it('keeps irregular forms and non-verbs distinct', () => {
  expect(hotelWordProfiles.woman.nouns[0]).toMatchObject({singular:'woman',plural:'women'})
  expect(hotelWordProfiles.bring.verbs[0]).toMatchObject({past:'brought',participle:'brought'})
  expect(hotelWordProfiles.paid.verbs[0]).toMatchObject({base:'pay',third:'pays',past:'paid'})
  expect(hotelWordProfiles.planned.verbs[0]).toMatchObject({base:'plan',ing:'planning'})
  expect(hotelWordProfiles.left.verbs[0]).toMatchObject({base:'leave',past:'left'})
  expect(hotelWordProfiles.the.verbs).toEqual([])
  expect(hotelWordProfiles.is.grammar_note_th).toContain('The woman is here')
  expect(hotelWordProfiles.leaves.nouns).toEqual([])
  expect(hotelWordProfiles.leaves.verbs[0].base).toBe('leave')
})
it('opens meaningful help for every distinct Hotel word without relying on a database profile', async () => {
  for (const word of Object.keys(hotelWordProfiles)) {
    const question = hotelQuestions.find(q=>(q.english.match(/[\p{L}]+(?:[’'][\p{L}]+)*/gu)??[]).some(w=>normalizeHelpWord(w)===word))!
    await act(async () => root.render(<HotelWordHelp key={word} question={question} />))
    const token = [...host.querySelectorAll<HTMLElement>('.word-token')].find(el=>normalizeHelpWord(el.textContent??'')===word)!
    await act(async () => token.click())
    const dialog = document.querySelector('dialog')!
    expect(dialog.open,word).toBe(true)
    expect(dialog.querySelector('.word-details'),word).not.toBeNull()
    expect(dialog.querySelector('.word-examples')?.textContent,word).toContain(question.english)
    expect(dialog.textContent,word).not.toContain('ยังไม่มีข้อมูลรูปคำ')
    await act(async () => dialog.querySelector<HTMLButtonElement>('[aria-label="Close word help"]')!.click())
    expect(document.activeElement).toBe(token)
  }
}, 20000)
