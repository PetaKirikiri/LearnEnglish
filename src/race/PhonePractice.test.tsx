// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { beforeEach, expect, it, vi } from 'vitest'
import PhonePractice from './PhonePractice'
import { practiceDeck } from './practiceDeck'
import { loadWordProgress,queueAttempt } from '../learning/wordProgress/store'
vi.mock('../learning/wordProgress/store',()=>({loadWordProgress:vi.fn(async()=>[]),flushWordAttempts:vi.fn(async()=>{}),queueAttempt:vi.fn()}))
let ended: (() => void) | null = null
beforeEach(() => { vi.stubGlobal('Audio', class { onended: (() => void) | null = null; pause() {} play() { ended = () => this.onended?.(); return Promise.resolve() } }) })
async function listen(host: HTMLElement) { await act(async () => { host.querySelector<HTMLButtonElement>('.practice-audio')!.click(); ended?.() }) }
beforeEach(() => localStorage.clear())
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
it('runs independent binary practice, locks answers and keeps feedback in place until Next for either answer', async () => {
  vi.useFakeTimers()
  vi.spyOn(Math, 'random').mockReturnValue(.1)
  const host = document.createElement('div'); const root = createRoot(host)
  try {
    await act(async () => root.render(<PhonePractice/>))
    expect([...host.querySelectorAll('.homework-slot small')].map(slot => slot.textContent)).toEqual(['1','2','3','4'])
    expect(host.querySelector('.practice-question')?.getAttribute('aria-label')).toBe('ฟังแล้วเลือกคำตอบ')
    expect(host.querySelector('.tonight-tree [lang=th]')).toBeNull()
    expect(host.querySelectorAll('.homework-slot button')).toHaveLength(0)
    const sentence = [...host.querySelectorAll('.homework-slot > strong')].map(s => s.textContent).join(' ')
    expect(sentence).toMatch(/^Where is (the|my|your) /)
    expect(host.textContent).not.toContain('ดูคำใบ้')
    expect(host.querySelectorAll('.practice-answers button')).toHaveLength(2)
    expect(host.querySelector<HTMLButtonElement>('.practice-feedback button')?.disabled).toBe(true)
    await listen(host)
    await act(async () => host.querySelectorAll<HTMLButtonElement>('.practice-answers button')[0].click())
    expect([...host.querySelectorAll<HTMLButtonElement>('.practice-answers button')].every(b => b.disabled)).toBe(true)
    await act(async () => vi.advanceTimersByTime(1100))
    expect(host.querySelector('header')?.textContent).toContain('1 / 120')
    expect(host.querySelector('[role=status]')?.textContent).toContain('ถูกต้อง!')
    await act(async () => host.querySelector<HTMLButtonElement>('.practice-feedback button')!.click())
    expect(host.querySelector('header')?.textContent).toContain('2 / 120')
    await listen(host)
    await act(async () => host.querySelectorAll<HTMLButtonElement>('.practice-answers button')[1].click())
    await act(async () => vi.advanceTimersByTime(2000))
    expect(host.querySelector('header')?.textContent).toContain('2 / 121')
    await act(async () => host.querySelector<HTMLButtonElement>('.practice-feedback button')!.click())
    expect(host.querySelector('header')?.textContent).toContain('3 / 121')
    expect(host.querySelector('[role=status]')?.textContent).toBe('')
    expect(host.querySelector<HTMLButtonElement>('.practice-feedback button')?.disabled).toBe(true)
  } finally { await act(async () => root.unmount()); vi.restoreAllMocks(); vi.useRealTimers() }
})

it('counts each answer once, completes the deck, and resets for another round', async () => {
  vi.spyOn(Math, 'random').mockReturnValue(.1)
  const host = document.createElement('div'); const root = createRoot(host)
  try {
    await act(async () => root.render(<PhonePractice/>))
    for (let i = 0; i < 120; i++) {
      await listen(host)
      await act(async () => {
        const answer = host.querySelectorAll<HTMLButtonElement>('.practice-answers button')[i < 60 ? 0 : 1]
        answer.click(); answer.click()
      })
      await act(async () => {
        const next = host.querySelector<HTMLButtonElement>('.practice-feedback button')!
        next.click(); next.click()
      })
    }
    expect(host.querySelector('.practice-complete p')?.textContent).toBe('120 / 120')
    expect(host.querySelector('progress')?.value).toBe(120)
    await act(async () => host.querySelector<HTMLButtonElement>('.practice-complete button')!.click())
    expect(host.querySelector('header')?.textContent).toContain('1 / 120')
    expect(host.querySelector('progress')?.value).toBe(0)
    expect([...host.querySelectorAll<HTMLButtonElement>('.practice-answers button')].filter(button => !button.disabled)).toHaveLength(2)
  } finally { await act(async () => root.unmount()); vi.restoreAllMocks() }
})

it('resumes the same account at its saved question without a welcome screen', async () => {
  vi.spyOn(Math, 'random').mockReturnValue(.1)
  const host = document.createElement('div')
  let root = createRoot(host)
  await act(async () => root.render(<PhonePractice userId="member-a"/>))
  await listen(host)
  await act(async () => host.querySelector<HTMLButtonElement>('.practice-answers button')!.click())
  await act(async () => host.querySelector<HTMLButtonElement>('.practice-feedback button')!.click())
  const sentence = host.querySelector('.practice-question')?.getAttribute('aria-label')
  await act(async () => root.unmount())
  root = createRoot(host)
  await act(async () => root.render(<PhonePractice userId="member-a"/>))
  expect(host.querySelector('header')?.textContent).toContain('2 / 120')
  expect(host.querySelector('.practice-question')?.getAttribute('aria-label')).toBe(sentence)
  await act(async () => root.unmount())
  root = createRoot(host)
  await act(async () => root.render(<PhonePractice userId="member-b"/>))
  expect(host.querySelector('header')?.textContent).toContain('1 / 120')
  await act(async () => root.unmount())
})

it('includes an audio-only check for every item and interleaves owners', () => { const deck=practiceDeck(); expect(deck.filter(q=>q.audioOnly)).toHaveLength(60); expect(new Set(deck.slice(0,20).map(q=>q.english.split(' ')[2])).size).toBeGreaterThan(1) })

it('uses account word scores for fading and queues the shown modality once', async()=>{
 vi.spyOn(Math,'random').mockReturnValue(.1)
 vi.mocked(loadWordProgress).mockResolvedValueOnce([{word_id:'en:where',correct:25,attempts:25,listening_correct:0,direct_correct:0,last_practised:new Date().toISOString(),recent_results:[true]}])
 vi.mocked(queueAttempt).mockClear()
 const host=document.createElement('div'),root=createRoot(host)
 try {
  await act(async()=>root.render(<PhonePractice userId="fade-student"/>))
  expect(host.querySelector<HTMLElement>('[data-word=where]')?.style.opacity).toBe('0')
  await listen(host)
  await act(async()=>{const answer=host.querySelector<HTMLButtonElement>('.practice-answers button')!;answer.click();answer.click()})
  expect(queueAttempt).toHaveBeenCalledTimes(1)
  expect(queueAttempt).toHaveBeenCalledWith('fade-student',expect.objectContaining({modality:'faded',version:1,replays:1}))
  expect(host.querySelector<HTMLElement>('[data-word=where]')?.style.opacity).toBe('0')
 }finally{await act(async()=>root.unmount());vi.restoreAllMocks()}
})

it('replays the next question when resuming an already answered question', async()=>{
 vi.spyOn(Math,'random').mockReturnValue(.1)
 const host=document.createElement('div');let root=createRoot(host)
 try {
  await act(async()=>root.render(<PhonePractice/>))
  await listen(host)
  await act(async()=>host.querySelector<HTMLButtonElement>('.practice-answers button')!.click())
  await act(async()=>root.unmount())
  ended=null;root=createRoot(host)
  await act(async()=>root.render(<PhonePractice/>))
  expect(host.querySelector('header .practice-audio')).toBeTruthy()
  await act(async()=>host.querySelector<HTMLButtonElement>('.practice-feedback button')!.click())
  expect(ended).not.toBeNull()
  await act(async()=>ended?.())
  expect([...host.querySelectorAll<HTMLButtonElement>('.practice-answers button')].every(button=>!button.disabled)).toBe(true)
 }finally{await act(async()=>root.unmount());vi.restoreAllMocks()}
})

it('accepts an answer immediately without waiting for an audio-ended event', async()=>{
 const host=document.createElement('div'),root=createRoot(host)
 vi.mocked(queueAttempt).mockClear()
 try {
  await act(async()=>root.render(<PhonePractice userId="click-student"/>))
  const buttons=[...host.querySelectorAll<HTMLButtonElement>('.practice-answers button')]
  expect(buttons.every(button=>!button.disabled)).toBe(true)
  await act(async()=>buttons[0].click())
  expect(queueAttempt).toHaveBeenCalledTimes(1)
  expect(host.querySelector<HTMLButtonElement>('.practice-feedback button')?.disabled).toBe(false)
 }finally{await act(async()=>root.unmount())}
})
it('does not disable unanswered choices during replay or when audio fails', async()=>{
 vi.stubGlobal('Audio',class {pause(){} play(){return Promise.reject(new Error('blocked'))}})
 const host=document.createElement('div'),root=createRoot(host)
 try {
  await act(async()=>root.render(<PhonePractice/>))
  await act(async()=>host.querySelector<HTMLButtonElement>('.practice-audio')!.click())
  expect(host.querySelector('[role=alert]')).toBeTruthy()
  expect([...host.querySelectorAll<HTMLButtonElement>('.practice-answers button')].every(button=>!button.disabled)).toBe(true)
  await act(async()=>host.querySelector<HTMLButtonElement>('.practice-answers button')!.click())
  expect(host.querySelector<HTMLButtonElement>('.practice-feedback button')?.disabled).toBe(false)
 }finally{await act(async()=>root.unmount())}
})

it('autoplays on first load and reload, plays Next once, and preserves manual replay', async()=>{
 const play=vi.fn().mockResolvedValue(undefined)
 vi.stubGlobal('Audio',class {pause(){} play=play})
 const host=document.createElement('div');let root=createRoot(host)
 try {
  await act(async()=>root.render(<PhonePractice/>))
  expect(play).toHaveBeenCalledTimes(1)
  await act(async()=>root.render(<PhonePractice/>))
  expect(play).toHaveBeenCalledTimes(1)
  await act(async()=>host.querySelector<HTMLButtonElement>('.practice-audio')!.click())
  expect(play).toHaveBeenCalledTimes(2)
  await act(async()=>host.querySelector<HTMLButtonElement>('.practice-answers button')!.click())
  await act(async()=>host.querySelector<HTMLButtonElement>('.practice-feedback button')!.click())
  expect(play).toHaveBeenCalledTimes(3)
  await act(async()=>root.unmount());root=createRoot(host)
  await act(async()=>root.render(<PhonePractice/>))
  expect(play).toHaveBeenCalledTimes(4)
 }finally{await act(async()=>root.unmount())}
})
it('offers one-tap sound activation when automatic playback is blocked', async()=>{
 const play=vi.fn().mockRejectedValueOnce(new DOMException('gesture required','NotAllowedError')).mockResolvedValue(undefined)
 vi.stubGlobal('Audio',class {pause(){} play=play})
 const host=document.createElement('div'),root=createRoot(host)
 try {
  await act(async()=>root.render(<PhonePractice/>))
  expect(host.querySelector('.practice-audio-retry')?.textContent).toContain('แตะเพื่อเปิดเสียง')
  await act(async()=>host.querySelector<HTMLButtonElement>('.practice-audio-retry')!.click())
  expect(play).toHaveBeenCalledTimes(2)
  expect(host.querySelector('.practice-audio-retry')).toBeNull()
  expect([...host.querySelectorAll<HTMLButtonElement>('.practice-answers button')].every(button=>!button.disabled)).toBe(true)
 }finally{await act(async()=>root.unmount())}
})

it('only exposes language flags for testers and switches answer meanings without changing answer identity',async()=>{
 const host=document.createElement('div');const root=createRoot(host)
 try{
  await act(async()=>root.render(<PhonePractice/>))
  expect(host.querySelector('.practice-languages')).toBeNull()
  await act(async()=>root.render(<PhonePractice tester/>))
  const before=host.querySelector('.practice-choice-label')?.textContent
  await act(async()=>host.querySelector<HTMLButtonElement>('[aria-label="English"]')!.click())
  expect(host.querySelector('main')?.lang).toBe('en')
  expect(host.querySelector('.practice-choice-label')?.textContent).toMatch(/^Where /)
  await act(async()=>host.querySelector<HTMLButtonElement>('[aria-label="ไทย"]')!.click())
  expect(host.querySelector('.practice-choice-label')?.textContent).toBe(before)
 }finally{await act(async()=>root.unmount())}
})
