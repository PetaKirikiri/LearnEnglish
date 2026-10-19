// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, expect, it, vi } from 'vitest'
import HotelContentPage from './HotelContentPage'
import { hotelQuestions } from './course'
import { installCurriculum } from '../curriculum/database'
import { buildCurriculumSeed } from '../curriculum/seed'
import snapshot from '../curriculum/syllabus.snapshot.json'

const speech = vi.hoisted(() => ({ speak: vi.fn(), stop: vi.fn() }))
vi.mock('../learning/speech', () => ({ speakEnglish: speech.speak, stopEnglishSpeech: speech.stop }))
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
const host = document.createElement('div')
let root = createRoot(host)
afterEach(async () => { await act(() => root.unmount()); root = createRoot(host); vi.clearAllMocks(); installCurriculum(buildCurriculumSeed()) })

it('shows every real question, both complete answers and curriculum order', async () => {
  await act(() => root.render(<HotelContentPage />))
  const rows = [...host.querySelectorAll('tbody tr')]
  await act(()=>host.querySelector<HTMLButtonElement>('[aria-label="Next page"]')!.click())
  rows.push(...host.querySelectorAll('tbody tr'))
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

it('shows the expanded database catalogue and filters everyday situations without losing old content', async()=>{
  installCurriculum(snapshot)
  window.location.href='http://localhost/hotel/preview/content'
  await act(()=>root.render(<HotelContentPage/>))
  expect(host.querySelector('h1')?.textContent).toBe('Content 2490')
  expect(host.querySelectorAll('tbody tr')).toHaveLength(100)
  const situation=host.querySelector<HTMLSelectElement>('[aria-label="Situation"]')!
  const select=async(value:string)=>act(()=>{situation.value=value;situation.dispatchEvent(new Event('change',{bubbles:true}))})
  await select('Everyday English')
  expect(host.querySelector('h1')?.textContent).toBe('Content 2196')
  await select('Travel')
  const travel=snapshot.questions.filter(q=>'domain' in q.grammar&&q.grammar.domain==='Travel')
  expect(host.querySelector('h1')?.textContent).toBe(`Content ${travel.length}`)
  for(const row of host.querySelectorAll('tbody tr')) expect(row.textContent).toContain('Travel')
  await select('Original content')
  expect(host.querySelector('h1')?.textContent).toBe('Content 294')
  await select('All situations')
  await act(()=>host.querySelector<HTMLButtonElement>('[aria-label="Next page"]')!.click())
  expect(host.querySelector('tbody td')?.textContent).toBe('101')
},20000)
