// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import HotelPage, { HotelLesson } from './HotelPage'
import { PETA_ACCOUNT_ID } from '../auth/appAccess'
import { hotelQuestions, progressKey, grammarWordMemoryKey, recordAnswer, type Progress } from './course'
import { selectLearningCourse } from '../curriculum/database'
const speech = vi.hoisted(() => ({ speak: vi.fn(), stop: vi.fn() }))
const account = vi.hoisted(() => ({ finish: vi.fn(async (): Promise<{ id: string } | null> => null) }))
const scores = vi.hoisted(() => ({ join: vi.fn(async () => {}), queue: vi.fn(), sync: vi.fn(async () => {}), load: vi.fn(async () => []) }))
vi.mock('./scoring', () => ({ joinHotel: scores.join, queueHotelAnswer: scores.queue, syncHotelAnswers: scores.sync, loadHotelScoreboard: scores.load, createListeningScoring: vi.fn(() => ({ join: scores.join, queue: scores.queue, sync: scores.sync, load: scores.load })) }))
vi.mock('../learning/speech', () => ({ speakEnglish: speech.speak, stopEnglishSpeech: speech.stop }))
vi.mock('@line/liff', () => ({ default: { init: vi.fn() } }))
vi.mock('./accountHandoff', () => ({ finishHotelReturn: account.finish }))
vi.mock('../lib/languageDatabase', () => ({ initializeLanguageDatabase: vi.fn(async () => 'database') }))
vi.mock('../curriculum/database', () => ({ initializeCurriculum: vi.fn(async () => 'database'), selectLearningCourse: vi.fn(), getCurriculum: vi.fn(() => undefined) }))
vi.mock('../lib/supabase', () => ({ isSupabaseConfigured: false, supabase: { auth: { getSession: async () => ({ data: { session: null } }) } } }))
const host = document.createElement('div')
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
document.body.append(host)
let root = createRoot(host)
beforeEach(() => { window.location.href = 'https://learn-english-coral.vercel.app/hotel'; account.finish.mockResolvedValue(null) })
afterEach(async () => { await act(() => root.unmount()); root = createRoot(host); localStorage.clear(); vi.clearAllMocks(); vi.unstubAllEnvs() })
it('offers signup and sign-in without a QR or details form', async () => {
  vi.stubEnv('VITE_HOTEL_LIFF_ID', '2010311582-EnglishTest')
  await act(() => root.render(<HotelPage />))
  expect(host.textContent).toContain('Sign up with LINE')
  expect(host.textContent).toContain('Sign in')
  expect(host.querySelector('a[download]')).toBeNull()
  expect(host.querySelector('img')).toBeNull()
  expect(host.querySelector('input')).toBeNull()
  await act(() => (host.querySelector('.hotel-line') as HTMLButtonElement).click())
  expect(window.location.origin).toBe('https://liff.line.me')
  expect(new URLSearchParams(window.location.search).get('intent')).toBe('signup')
})
it('does not create signup intent for an ordinary sign-in', async () => {
  vi.stubEnv('VITE_HOTEL_LIFF_ID', '2010311582-EnglishTest')
  await act(() => root.render(<HotelPage />))
  await act(() => (host.querySelector('.hotel-reveal') as HTMLButtonElement).click())
  expect(window.location.origin).toBe('https://liff.line.me')
  expect(new URLSearchParams(window.location.search).has('intent')).toBe(false)
})
it('uses the English Success entry and keeps its admin links out of Hotel', async () => {
  window.location.href = 'https://learn-english-coral.vercel.app/english'
  await act(() => root.render(<HotelPage courseId="english" />))
  expect(document.title).toBe('English Success')
  expect((host.querySelector('[aria-label="Course"]') as HTMLSelectElement).value).toBe('english')
  await act(() => (host.querySelector('.hotel-line') as HTMLButtonElement).click())
  expect(new URLSearchParams(window.location.search).get('mode')).toBe('english')
  expect(new URLSearchParams(window.location.search).get('intent')).toBe('signup')
  await act(() => root.unmount()); root = createRoot(host)
  window.location.href = 'https://learn-english-coral.vercel.app/english/content'
  account.finish.mockResolvedValue({ id: PETA_ACCOUNT_ID })
  await act(() => root.render(<HotelPage courseId="english" />))
  expect(selectLearningCourse).toHaveBeenCalledWith('english')
  expect(host.querySelector('a[aria-label="Practice"]')?.getAttribute('href')).toBe('/english')
  expect(host.querySelector('a[aria-label="Scoreboard"]')?.getAttribute('href')).toBe('/english/scoreboard')
  expect(host.querySelector('a[aria-label="Learning route"]')?.getAttribute('href')).toBe('/english/curriculum')
  expect(host.querySelector('[aria-label="English Success question table"]')).not.toBeNull()
})
it('enables the existing LINE entry without a dedicated English configuration', async () => {
  vi.stubEnv('VITE_HOTEL_LIFF_ID', '')
  await act(() => root.render(<HotelPage />))
  expect(host.querySelector('img')).toBeNull()
  expect((host.querySelector('.hotel-line') as HTMLButtonElement).disabled).toBe(false)
  expect(host.textContent).not.toContain('being configured')
})
it('offers signup after an unknown-account sign-in without opening LINE again', async () => {
  window.location.href = 'https://learn-english-coral.vercel.app/hotel?line_result=new'
  await act(() => root.render(<HotelPage />))
  expect(host.textContent).toContain('No account yet. Tap Sign up')
  expect(window.location.pathname).toBe('/hotel')
})
it('opens a signed-in account directly into the lesson', async () => {
  account.finish.mockResolvedValue({ id: 'signed-in-user' })
  await act(() => root.render(<HotelPage />))
  expect(host.querySelectorAll('.hotel-answer')).toHaveLength(2)
  expect(host.textContent).not.toMatch(/YOUR LISTENING ROOM|A little English|Start listening|Progress stays on this device/)
  expect(speech.speak).toHaveBeenCalledTimes(1)
})
it('shows the content table only to the existing admin account', async () => {
  window.location.href = 'https://learn-english-coral.vercel.app/hotel/content'
  account.finish.mockResolvedValue({ id: PETA_ACCOUNT_ID })
  await act(() => root.render(<HotelPage />))
  expect(host.querySelectorAll('tbody tr')).toHaveLength(100)
  expect(host.querySelector('h1')?.textContent).toContain(String(hotelQuestions.length))
  expect(host.querySelector('a[aria-label="Practice"] svg')).not.toBeNull()
  expect(host.querySelector('a[aria-label="Scoreboard"] svg')).not.toBeNull()
  expect(host.querySelector('nav')?.textContent).toBe('Content')
  expect(speech.speak).not.toHaveBeenCalled()
})
it('keeps answer tables out of the learner route', async () => {
  window.location.href = 'https://learn-english-coral.vercel.app/hotel/content'
  account.finish.mockResolvedValue({ id: 'learner' })
  await act(() => root.render(<HotelPage />))
  expect(host.querySelector('table')).toBeNull()
  expect(host.querySelectorAll('.hotel-answer')).toHaveLength(2)
  expect(host.querySelector('a[href="/hotel/content"]')).toBeNull()
})
it('does not expose content navigation or tables before sign-in', async () => {
  window.location.href = 'https://learn-english-coral.vercel.app/hotel/content'
  await act(async () => { root.render(<HotelPage />) })
  expect(host.querySelector('table')).toBeNull()
  expect(host.querySelector('a[href="/hotel/content"]')).toBeNull()
})
it('allows a tap on audio when the phone blocks automatic playback', async () => {
  await act(() => root.render(<HotelLesson userId="test-user" />))
  await act(() => speech.speak.mock.calls[0][2]('blocked'))
  expect(host.textContent).toContain('Tap to retry audio')
  expect(host.querySelectorAll('.hotel-answer')).toHaveLength(2)
  await act(() => (host.querySelector('.hotel-listen') as HTMLButtonElement).click())
  expect(speech.speak).toHaveBeenCalledTimes(2)
})
it('plays on entry, waits for audio, records once, and only advances on Next', async () => {
  await act(() => root.render(<HotelLesson userId="test-user" />))
  expect(speech.speak).toHaveBeenCalledTimes(1)
  const choice = host.querySelector('.hotel-answer') as HTMLButtonElement
  await act(() => choice.click())
  expect(localStorage.getItem(progressKey('test-user'))).toBeNull()
  await act(() => speech.speak.mock.calls[0][2]('ended'))
  await act(() => { choice.click(); choice.click() })
  const stored = JSON.parse(localStorage.getItem(progressKey('test-user'))!)
  expect(stored.roles.attempts).toBe(1)
  expect(scores.queue).toHaveBeenCalledTimes(1)
  expect(scores.queue.mock.calls[0][0]).toBe('test-user')
  expect(speech.speak).toHaveBeenCalledTimes(1)
  expect(host.textContent).toContain('Next')
  expect(localStorage.getItem(progressKey('someone-else'))).toBeNull()
  await act(() => (host.querySelector('.hotel-primary') as HTMLButtonElement).click())
  expect(speech.speak).toHaveBeenCalledTimes(2)
})
it('pauses embedded audio and retains the answered question when returning',async()=>{
  await act(()=>root.render(<HotelLesson userId="test-user" active/>))
  const spoken=speech.speak.mock.calls[0][0]
  await act(()=>speech.speak.mock.calls[0][2]('ended'))
  await act(()=>(host.querySelector('.hotel-answer') as HTMLButtonElement).click())
  const stored=localStorage.getItem(progressKey('test-user'))
  await act(()=>root.render(<HotelLesson userId="test-user" active={false}/>))
  expect(speech.stop).toHaveBeenCalled()
  expect(speech.speak).toHaveBeenCalledTimes(1)
  expect(host.querySelector('.word-token')).toBeNull()
  await act(()=>root.render(<HotelLesson userId="test-user" active/>))
  expect(speech.speak.mock.calls.at(-1)?.[0]).toBe(spoken)
  expect(host.querySelector('.hotel-primary')?.textContent).toContain('Next')
  expect(localStorage.getItem(progressKey('test-user'))).toBe(stored)
  expect(scores.queue).toHaveBeenCalledTimes(1)
})
it('lets only the admin open the Hotel scoreboard', async () => {
  window.location.href = 'https://learn-english-coral.vercel.app/hotel/scoreboard'
  account.finish.mockResolvedValue({ id: PETA_ACCOUNT_ID })
  await act(() => root.render(<HotelPage />))
  expect(host.textContent).toContain('Scoreboard')
  expect(scores.load).toHaveBeenCalled()
  expect(host.querySelectorAll('.hotel-answer')).toHaveLength(0)
  await act(() => root.unmount()); root = createRoot(host)
  account.finish.mockResolvedValue({ id: 'learner' })
  await act(() => root.render(<HotelPage />))
  expect(host.querySelector('table')).toBeNull()
  expect(host.querySelector('a[href="/hotel/scoreboard"]')).toBeNull()
})
it('never sends local preview answers to the shared scores', async () => {
  await act(() => root.render(<HotelLesson userId="local-preview" />))
  await act(() => speech.speak.mock.calls[0][2]('ended'))
  await act(() => (host.querySelector('.hotel-answer') as HTMLButtonElement).click())
  expect(scores.queue).not.toHaveBeenCalled()
  expect(scores.join).not.toHaveBeenCalled()
})
it('shows English immediately and treats word lookup as assisted help without answering', async () => {
  await act(async () => { root.render(<HotelLesson userId="test-user" />) })
  expect(host.querySelectorAll('.word-token').length).toBeGreaterThan(0)
  expect((host.querySelector('.word-token') as HTMLElement).style.opacity).toBe('1')
  await act(async () => { (host.querySelector('.word-token') as HTMLElement).click() })
  expect(document.querySelector('dialog')?.open).toBe(true)
  expect(scores.queue).not.toHaveBeenCalled()
  await act(async () => { document.querySelector<HTMLButtonElement>('[aria-label="Close word help"]')!.click() })
  await act(async () => { speech.speak.mock.calls[0][2]('ended') })
  await act(async () => { (host.querySelector('.hotel-answer') as HTMLButtonElement).click() })
  expect(scores.queue).toHaveBeenCalledWith('test-user', expect.any(String), expect.any(Number), true)
})
it('fades familiar English independently, keeps Thai readable, and restores English on request', async () => {
  const random = vi.spyOn(Math, 'random').mockReturnValue(0)
  localStorage.setItem(grammarWordMemoryKey('test-user'), JSON.stringify({ she: { seen: 8, strength: 8 } }))
  await act(() => root.render(<HotelLesson userId="test-user" />))
  const words = host.querySelectorAll<HTMLElement>('.word-token')
  expect(words[0].textContent).toBe('She')
  expect(words[0].style.opacity).toBe('0')
  expect(words[1].style.opacity).toBe('1')
  expect(host.querySelector('.hotel-answer [style]')).toBeNull()
  expect(localStorage.getItem(grammarWordMemoryKey('someone-else'))).toBeNull()
  await act(() => (host.querySelector('.hotel-reveal') as HTMLButtonElement).click())
  expect(words[0].style.opacity).toBe('1')
  await act(() => speech.speak.mock.calls[0][2]('ended'))
  await act(() => (host.querySelector('.hotel-answer') as HTMLButtonElement).click())
  expect(scores.queue).toHaveBeenCalledWith('test-user', expect.any(String), expect.any(Number), true)
  random.mockRestore()
})
it('builds independent familiarity for every heard word without granting listening mastery', async () => {
  const random = vi.spyOn(Math, 'random').mockReturnValue(0)
  try {
    await act(() => root.render(<HotelLesson userId="word-test-user" />))
    const expected: Record<string, number> = {}
    for (let round = 0; round < 3; round++) {
      const spoken = speech.speak.mock.calls.at(-1)!
      const question = hotelQuestions.find(q => (q.grammar?.prompt ?? q.english) === spoken[0])!
      for (const word of new Set(question.english.toLowerCase().match(/[a-z]+/g)!)) expected[word] = (expected[word] ?? 0) + 1
      await act(() => spoken[2]('ended'))
      const meaning = question.answers[question.correct].map(segment => segment.text).join('')
      const choice = [...host.querySelectorAll<HTMLButtonElement>('.hotel-answer')].find(button => button.textContent === meaning)!
      await act(() => choice.click())
      const saved = JSON.parse(localStorage.getItem(grammarWordMemoryKey('word-test-user'))!)
      expect(Object.fromEntries(Object.entries(saved).map(([word, value]) => [word, (value as {strength:number}).strength]))).toEqual(expected)
      expect(scores.queue.mock.calls.at(-1)?.[3]).toBe(false)
      if (round < 2) await act(() => (host.querySelector('.hotel-primary') as HTMLButtonElement).click())
    }
    expect(expected.called).toBeGreaterThan(0)
    expect(expected.her).toBeGreaterThan(0)
  } finally { random.mockRestore() }
})

it('keeps the completed form out of the prompt audio until after answering', async () => {
  let progress:Progress={}
  for(const q of hotelQuestions.filter(q=>q.skill==='roles')) for(let i=0;i<2;i++) progress=recordAnswer(progress,q,true,false,1000+i,true)
  localStorage.setItem(progressKey('test-user'),JSON.stringify(progress))
  const random=vi.spyOn(Math,'random').mockReturnValue(0)
  try {
    await act(()=>root.render(<HotelLesson userId="test-user" />))
    const form=hotelQuestions.find(q=>q.skill==='object_forms')!
    expect(speech.speak.mock.calls[0][0]).toBe(form.grammar!.prompt)
    expect(speech.speak.mock.calls[0][1]).toBe(form.grammar!.promptAudioUrl)
    expect(host.querySelector('p[lang="en"]')?.textContent).toContain('_____')
    expect(host.querySelector('p[lang="en"]')?.textContent).not.toContain(form.english)
    expect(host.querySelector('.hotel-answer.right')).toBeNull()
    await act(()=>speech.speak.mock.calls[0][2]('ended'))
    await act(()=>host.querySelector<HTMLButtonElement>('.hotel-answer')!.click())
    expect(speech.speak.mock.calls.at(-1)?.[0]).toBe(form.english)
    expect(host.querySelector('p[lang="en"]')?.textContent).toBe(form.english)
  } finally {random.mockRestore()}
})

it('holds transfer meanings audio-only and marks text reveal as assisted',async()=>{
  let progress:Progress={}
  for(const q of hotelQuestions.filter(q=>q.skill==='roles'&&q.grammar!.phase==='practice')) for(let i=0;i<2;i++) progress=recordAnswer(progress,q,true,false,1000+i,true)
  localStorage.setItem(progressKey('test-user'),JSON.stringify(progress))
  await act(()=>root.render(<HotelLesson userId="test-user" />))
  expect(host.querySelector('p[lang="en"]')).toBeNull()
  await act(()=>host.querySelector<HTMLButtonElement>('.hotel-reveal')!.click())
  expect(host.querySelector('p[lang="en"]')).not.toBeNull()
  await act(()=>speech.speak.mock.calls[0][2]('ended'))
  await act(()=>host.querySelector<HTMLButtonElement>('.hotel-answer')!.click())
  expect(scores.queue).toHaveBeenCalledWith('test-user',expect.any(String),expect.any(Number),true)
})

it('rechecks familiar practice sentences audio-only and persists explicit listening evidence',async()=>{
  const random=vi.spyOn(Math,'random').mockReturnValue(0)
  try {
    let p:Progress={}
    for(const q of hotelQuestions.filter(q=>q.skill==='roles'&&q.grammar!.phase==='practice'))
      for(let i=0;i<2;i++) p=recordAnswer(p,q,true,false,1000+i)
    localStorage.setItem(progressKey('listener'),JSON.stringify(p))
    await act(()=>root.render(<HotelLesson userId="listener" />))
    const spoken=speech.speak.mock.calls[0]
    const q=hotelQuestions.find(q=>q.english===spoken[0])!
    expect(q.grammar!.phase).toBe('practice')
    expect(host.querySelector('p[lang="en"]')).toBeNull()
    expect([...host.querySelectorAll<HTMLButtonElement>('.hotel-answer')].every(b=>b.disabled)).toBe(true)
    await act(()=>spoken[2]('ended'))
    const choice=[...host.querySelectorAll<HTMLButtonElement>('.hotel-answer')].find(b=>b.textContent===q.answers[q.correct][0].text)!
    await act(()=>choice.click())
    const saved=JSON.parse(localStorage.getItem(progressKey('listener'))!)
    expect(saved.roles.items[q.id].audioStreak).toBe(1)
    expect(host.querySelector('p[lang="en"]')?.textContent).toBe(q.english)
    await act(()=>host.querySelector<HTMLButtonElement>('.hotel-primary')!.click())
    // A delayed callback from the previous recording cannot unlock this item.
    await act(()=>spoken[2]('ended'))
    expect([...host.querySelectorAll<HTMLButtonElement>('.hotel-answer')].every(b=>b.disabled)).toBe(true)
  } finally {random.mockRestore()}
})

it('does not award listening evidence when a learner reveals a practice check',async()=>{
  let p:Progress={}
  for(const q of hotelQuestions.filter(q=>q.skill==='roles'&&q.grammar!.phase==='practice'))
    for(let i=0;i<2;i++) p=recordAnswer(p,q,true,false,1000+i)
  localStorage.setItem(progressKey('helped-listener'),JSON.stringify(p))
  await act(()=>root.render(<HotelLesson userId="helped-listener" />))
  const spoken=speech.speak.mock.calls[0]
  const q=hotelQuestions.find(q=>q.english===spoken[0])!
  await act(()=>host.querySelector<HTMLButtonElement>('.hotel-reveal')!.click())
  await act(()=>spoken[2]('ended'))
  const choice=[...host.querySelectorAll<HTMLButtonElement>('.hotel-answer')].find(b=>b.textContent===q.answers[q.correct][0].text)!
  await act(()=>choice.click())
  const saved=JSON.parse(localStorage.getItem(progressKey('helped-listener'))!)
  expect(saved.roles.items[q.id].audioStreak).toBe(0)
  expect(saved.roles.items[q.id].streak).toBe(0)
})
