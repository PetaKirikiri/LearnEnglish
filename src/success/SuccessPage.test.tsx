// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import SuccessPage from './SuccessPage'
import { successCourse, isSuccessRoute } from './course'
import { successWordUnits } from './familiarity'
const speech=vi.hoisted(()=>({speak:vi.fn(),stop:vi.fn()}))
vi.mock('../learning/speech',()=>({speakEnglish:speech.speak,stopEnglishSpeech:speech.stop}))

Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true})
const host=document.createElement('div')
document.body.append(host)
let root=createRoot(host)
afterEach(async()=>{await act(()=>root.unmount());root=createRoot(host);vi.unstubAllEnvs();vi.clearAllMocks();localStorage.clear()})

it('contains exactly the owner-selected first lesson without borrowing content',()=>{
  expect(successCourse.id).toBe('success')
  expect(successCourse.name).toBe('Success')
  expect(successCourse.lessons).toHaveLength(1)
  expect(successCourse.questions.slice(0,7).map(q=>q.english)).toEqual(['Who','What','Where','When','How much','How many','Why'])
  expect(successCourse.questions).toHaveLength(35)
  for(const path of ['/success','/success/preview','/success/preview/content']) expect(isSuccessRoute(path)).toBe(true)
  for(const path of ['/padel','/hotel','/english','/successful']) expect(isSuccessRoute(path)).toBe(false)
  const config=JSON.parse(readFileSync('vercel.json','utf8'))
  for(const source of ['/success','/success/:path*']) expect(config.rewrites).toContainEqual({source,destination:'/index.html'})
})
it('shows a minimal lesson list without inventing a production login or completion',async()=>{
  window.location.pathname='/success'
  await act(()=>root.render(<SuccessPage/>))
  expect(document.title).toBe('Success · English')
  expect(host.textContent).toContain('Lesson 1 · Question words')
  expect(host.querySelector('button')).toBeNull()
  expect(host.querySelector('nav')).toBeNull()
  expect(window.location.pathname).toBe('/success')
})
it('groups content by lesson locally, but does not expose draft tools in production',async()=>{
  window.location.pathname='/success/preview/content'
  vi.stubEnv('DEV',true)
  await act(()=>root.render(<SuccessPage/>))
  expect(host.querySelector('h1')?.textContent).toBe('Lesson 1 · Question words 35')
  const cards=[...host.querySelectorAll('.success-content-card')]
  expect(cards).toHaveLength(35)
  expect(host.querySelector('table')).toBeNull()
  expect(cards.map(card=>card.getAttribute('aria-label'))).toEqual(successCourse.questions.map(q=>q.english))
  for(const [i,card] of cards.entries()) {
    const tokens=card.querySelectorAll('.meaning-tile')
    const units=successWordUnits(successCourse.questions[i].english)
    expect(tokens).toHaveLength(units.length)
    expect([...card.querySelectorAll('.word-token')].map(token=>token.getAttribute('aria-label'))).toEqual(units.map(unit=>`Help with ${unit}`))
    expect(card.querySelectorAll('.word-meaning-art')).toHaveLength(tokens.length)
    expect(card.querySelector('.success-card-translation')?.textContent).toBe(successCourse.questions[i].answers[0][0].text)
    expect(card.querySelector('.success-card-alternative')?.textContent).toContain(successCourse.questions[i].answers[1][0].text)
  }
  const first=host.querySelector<HTMLButtonElement>('[aria-label="Play Who"]')!
  await act(()=>first.click())
  expect(speech.speak.mock.calls[0].slice(0,2)).toEqual(['Who','/audio/success/success-lesson-1-1.wav'])
  expect(host.querySelector('[aria-label="Practice"]')?.getAttribute('href')).toBe('/success/preview')
  vi.stubEnv('DEV',false)
  await act(()=>root.render(<SuccessPage/>))
  expect(host.querySelector('nav')).toBeNull()
  expect(host.textContent).not.toContain('Content')
})

it('plays lesson one, waits for audio, offers two Thai answers, and advances manually',async()=>{
  vi.stubEnv('DEV',true)
  window.location.href='http://localhost/success/preview?lesson=1'
  await act(()=>root.render(<SuccessPage/>))
  expect(speech.speak.mock.calls[0][0]).toBe('Who')
  expect(host.querySelectorAll('.hotel-answer')).toHaveLength(2)
  const correct=[...host.querySelectorAll<HTMLButtonElement>('.hotel-answer')].find(b=>b.textContent==='ใคร')!
  expect(correct.disabled).toBe(true)
  expect(host.querySelector('.right')).toBeNull()
  await act(()=>speech.speak.mock.calls[0][2]('ended'))
  await act(()=>correct.click())
  expect(host.querySelector<HTMLElement>('.word-token')?.style.opacity).toBe('0.875')
  expect(host.querySelector('.word-token .word-meaning-art')).not.toBeNull()
  expect(speech.speak).toHaveBeenCalledTimes(1)
  expect(JSON.parse(localStorage.getItem('success:listening:v1:local-success-preview')!)['question-words'].correct).toBe(1)
  await act(()=>host.querySelector<HTMLButtonElement>('.hotel-primary')!.click())
  expect(speech.speak.mock.calls[1][0]).toBe('What')
  expect(localStorage.getItem('padel:v1:local-preview')).toBeNull()
})

it('restores only a little of the picture and text after an audio-only mistake',async()=>{
  vi.stubEnv('DEV',true)
  window.location.href='http://localhost/success/preview?lesson=1'
  localStorage.setItem('success:words:v1:local-success-preview',JSON.stringify({who:{seen:8,strength:8}}))
  await act(()=>root.render(<SuccessPage/>))
  expect(host.querySelector<HTMLElement>('.word-token')?.style.opacity).toBe('0')
  expect(host.querySelector('.word-token')?.textContent).toBe('Who')
  await act(()=>speech.speak.mock.calls[0][2]('ended'))
  const wrong=[...host.querySelectorAll<HTMLButtonElement>('.hotel-answer')].find(b=>b.textContent==='อะไร')!
  await act(()=>wrong.click())
  expect(host.querySelector<HTMLElement>('.word-token')?.style.opacity).toBe('0.125')
  expect(JSON.parse(localStorage.getItem('success:words:v1:local-success-preview')!).who.strength).toBe(7)
})
