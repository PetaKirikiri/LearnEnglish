import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import RaceAdminPage from './RaceAdminPage'
import { HOST_KEY } from './connection'
import { holidayMeaningQuestions } from './holidayQuestions'
import type { RaceView } from './types'

const credentials = { room: 'AAAAAAAAAA', token: 'teacher-token' }
const request = vi.fn<typeof globalThis.fetch>()
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
let current: RaceView
let saveError: string
let host: HTMLDivElement
let root: Root
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  vi.useFakeTimers()
  localStorage.clear()
  window.location.href = 'http://localhost/english/race/admin'
  saveError = ''
  current = { id: credentials.room, run: 7, stageId: 'where-is-the', phase: 'finished', round: 4, finish: 1600, serverNow: 1000, motionAt: 1000, title: 'Previous race', players: [], opensAt: 0, closesAt: 0 }
  request.mockReset().mockImplementation(async (input, options) => {
    const url = String(input)
    if (url.endsWith('/config')) return json({ canHost: true })
    if (url.includes('/state?')) return json(current)
    if (url.endsWith('/create')) {
      if (saveError) return json({ error: saveError }, 409)
      const body = JSON.parse(String(options?.body)) as { stage: string; questionIds: string[] }
      current = { ...current, run: 1, stageId: body.stage, questionIds: body.questionIds, phase: 'lobby', round: -1 }
      return json(credentials)
    }
    if (url.includes('/prepare?')) {
      if (saveError) return json({ error: saveError }, 409)
      const body = JSON.parse(String(options?.body)) as { stage: string; questionIds: string[]; run: number }
      current = { ...current, run: current.run + 1, stageId: body.stage, questionIds: body.questionIds, phase: 'lobby', round: -1, serverNow: current.serverNow + 1 }
      return json(current)
    }
    throw new Error(`Unexpected request: ${url}`)
  })
  vi.stubGlobal('fetch', request)
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
})
afterEach(async () => {
  await act(async () => { root.unmount() })
  host.remove()
  localStorage.clear()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  vi.useRealTimers()
})
async function mount() { await act(async () => { root.render(<RaceAdminPage/>) }) }
async function mode(label: string) {
  const choice = [...host.querySelectorAll('.race-admin-types label')].find(item => item.textContent?.includes(label))
  expect(choice).toBeTruthy()
  await act(async () => { choice!.querySelector<HTMLInputElement>('input')!.click() })
}
async function chooseWords(words: string[]) {
  for (const label of [...host.querySelectorAll('.race-admin-words label')]) {
    const checkbox = label.querySelector<HTMLInputElement>('input')!
    if (checkbox.checked !== words.includes(label.textContent!.trim())) await act(async () => { checkbox.click() })
  }
}
const selectedWords = () => [...host.querySelectorAll('.race-admin-words label')].filter(label => label.querySelector<HTMLInputElement>('input')!.checked).map(label => label.textContent!.trim())
const selectedRows = () => [...host.querySelectorAll('.race-admin-questions article')].filter(row => row.querySelector<HTMLInputElement>('input')?.checked)
const doneButton = () => [...host.querySelectorAll('button')].find(button => button.textContent?.trim() === 'Done')!

it('retains selected holiday words when switching between judgement and meaning questions', async () => {
  await mount()
  await chooseWords(['taxi', 'beach'])
  expect(selectedRows()).toHaveLength(6)
  await mode('Choose the meaning')
  expect(selectedWords()).toEqual(['taxi', 'beach'])
  expect(selectedRows().map(row => row.querySelector('strong')?.textContent)).toEqual(['Where is the taxi?', 'Where is the beach?'])
  await mode('Correct or wrong')
  expect(selectedWords()).toEqual(['taxi', 'beach'])
  expect(selectedRows()).toHaveLength(6)
  expect(doneButton().disabled).toBe(false)
})

it('keeps an empty holiday selection empty when switching modes', async () => {
  await mount()
  await chooseWords([])
  await mode('Choose the meaning')
  expect(selectedWords()).toEqual([])
  expect(selectedRows()).toHaveLength(0)
  expect(doneButton().disabled).toBe(true)
  await mode('Correct or wrong')
  expect(selectedWords()).toEqual([])
  expect(selectedRows()).toHaveLength(0)
  expect(doneButton().disabled).toBe(true)
})

it('requires at least two meanings and avoids showing an unselected answer for a single word', async () => {
  await mount()
  await mode('Choose the meaning')
  await chooseWords(['taxi'])
  expect(doneButton().disabled).toBe(true)
  expect(host.querySelector('.race-admin-validation')?.textContent).toBe('Choose at least two words for the two answers.')
  expect(selectedRows()[0].querySelector('div > span')?.textContent).toBe('รถแท็กซี่อยู่ที่ไหน')
  await act(async () => { doneButton().click() })
  expect(request.mock.calls.some(([url]) => String(url).includes('/create') || String(url).includes('/prepare'))).toBe(false)

  await chooseWords(['taxi', 'hotel'])
  expect(doneButton().disabled).toBe(false)
  expect(host.querySelector('.race-admin-validation')).toBeNull()
  await chooseWords(['taxi', 'hotel', 'beach'])
  expect(doneButton().disabled).toBe(false)
})

it('prepares the selected meaning IDs for the current run without opening another classroom', async () => {
  localStorage.setItem(HOST_KEY, JSON.stringify(credentials))
  await mount()
  await mode('Choose the meaning')
  await chooseWords(['taxi', 'beach'])
  expect(doneButton().textContent).toBe('Done')
  await act(async () => { doneButton().click() })
  const sent = request.mock.calls.find(([url]) => String(url).includes('/prepare?'))
  expect(sent?.[0]).toBe('/api/classroom-race/prepare?room=AAAAAAAAAA')
  expect(sent?.[1]).toMatchObject({ method: 'POST', headers: { Authorization: 'Bearer teacher-token', 'Content-Type': 'application/json' } })
  expect(JSON.parse(String(sent?.[1]?.body))).toEqual({ stage: 'holiday-meaning', questionIds: ['race-meaning-taxi', 'race-meaning-beach'], run: 7 })
  expect(request.mock.calls.some(([url]) => String(url).includes('/create'))).toBe(false)
  expect(localStorage.getItem(HOST_KEY)).toBe(JSON.stringify(credentials))
  expect(host.textContent).toContain('Updated')
  expect(window.location.pathname).toBe('/english/race/admin')
})

it('builds each selected meaning preview using only the selected words', async () => {
  await mount()
  await mode('Choose the meaning')
  await chooseWords(['taxi', 'beach'])
  const allowed = ['รถแท็กซี่อยู่ที่ไหน', 'ชายหาดอยู่ที่ไหน']
  expect(selectedRows()).toHaveLength(2)
  for (const row of selectedRows()) {
    const choices = row.querySelector('div > span')!.textContent!.split(' · ')
    expect(choices).toHaveLength(2)
    expect(new Set(choices).size).toBe(2)
    expect([...choices].sort()).toEqual([...allowed].sort())
  }
})

it('previews the same-noun curveball pair alongside the normal meaning pair', async () => {
  await mount()
  expect(host.querySelector('.race-admin-curveball')).toBeNull()
  await mode('Choose the meaning')
  await chooseWords(['taxi', 'beach'])
  expect(selectedRows()).toHaveLength(2)
  for (const row of selectedRows()) {
    const english = row.querySelector('strong')!.textContent
    const question = holidayMeaningQuestions.find(q => q.english === english)!
    const correct = question.answers[question.correct].map(part => part.text).join('')
    const normal = row.querySelector('div > span')!.textContent!.split(' · ')
    expect(normal).toContain(correct)
    expect(normal).not.toContain(question.meaningDistractor)
    expect(row.querySelector('span.race-admin-curveball')?.textContent).toBe(`${correct} · ${question.meaningDistractor}`)
  }
  await mode('Correct or wrong')
  expect(host.querySelector('.race-admin-curveball')).toBeNull()
})


it('shows only teacher settings and Done without branding, classroom panels or separate-screen links', async () => {
  localStorage.setItem(HOST_KEY, JSON.stringify(credentials))
  current = { ...current, phase: 'lobby', round: -1, players: [{ id: 'peta', name: 'Peta', lane: 0, metres: 0, speed: 4, answered: false }] }
  await mount()
  expect(doneButton()).toBeTruthy()
  expect(host.querySelectorAll('img, [target="_blank"]')).toHaveLength(0)
  expect([...host.querySelectorAll('a')].every(link => link.getAttribute('href') === '/english/race/lesson')).toBe(true)
  expect(host.querySelector('.race-admin-classroom, .race-admin-roster, .race-admin-card')).toBeNull()
  for (const text of ['ENGLISH SUCCESS', 'Open race screen', 'Show QR code', 'Classroom', 'Players', 'Start race', 'Peta']) expect(host.textContent).not.toContain(text)
  expect([...host.querySelectorAll('button')].filter(button => !button.getAttribute('aria-label')?.startsWith('Play '))).toHaveLength(1)
})

it('creates the first classroom on Done and confirms the update in place', async () => {
  await mount()
  await mode('Choose the meaning')
  await chooseWords(['taxi', 'beach'])
  await act(async () => { doneButton().click() })
  const sent = request.mock.calls.find(([url]) => String(url).endsWith('/create'))
  expect(sent?.[0]).toBe('/api/classroom-race/create')
  expect(JSON.parse(String(sent?.[1]?.body))).toEqual({ stage: 'holiday-meaning', questionIds: ['race-meaning-taxi', 'race-meaning-beach'] })
  expect(localStorage.getItem(HOST_KEY)).toBe(JSON.stringify(credentials))
  expect(host.textContent).toContain('Updated')
  expect(window.location.pathname).toBe('/english/race/admin')
  expect(host.querySelectorAll('[target="_blank"]')).toHaveLength(0)
  expect([...host.querySelectorAll('a')].every(link => link.getAttribute('href') === '/english/race/lesson')).toBe(true)
})

it.each([0, 2])('updates a waiting lobby with %i joined players using the same credential and latest run', async playerCount => {
  localStorage.setItem(HOST_KEY, JSON.stringify(credentials))
  const players = Array.from({ length: playerCount }, (_, lane) => ({ id: `player-${lane}`, name: `Player ${lane}`, lane, metres: 0, speed: 4, answered: false }))
  current = { ...current, phase: 'lobby', round: -1, players }
  await mount()
  await mode('Choose the meaning')
  await chooseWords(['taxi', 'beach'])
  expect(doneButton().disabled).toBe(false)
  await act(async () => { doneButton().click() })
  expect(host.textContent).toContain('Updated')
  await chooseWords(['taxi', 'hotel'])
  await act(async () => { doneButton().click() })
  const saves = request.mock.calls.filter(([url]) => String(url).includes('/prepare?'))
  expect(saves).toHaveLength(2)
  expect(saves.map(([url, options]) => ({ url, auth: (options?.headers as Record<string, string>).Authorization, body: JSON.parse(String(options?.body)) }))).toEqual([
    { url: '/api/classroom-race/prepare?room=AAAAAAAAAA', auth: 'Bearer teacher-token', body: { stage: 'holiday-meaning', questionIds: ['race-meaning-taxi', 'race-meaning-beach'], run: 7 } },
    { url: '/api/classroom-race/prepare?room=AAAAAAAAAA', auth: 'Bearer teacher-token', body: { stage: 'holiday-meaning', questionIds: ['race-meaning-taxi', 'race-meaning-hotel'], run: 8 } },
  ])
  expect(request.mock.calls.some(([url]) => String(url).includes('/create') || String(url).includes('/control'))).toBe(false)
  expect(localStorage.getItem(HOST_KEY)).toBe(JSON.stringify(credentials))
  expect(window.location.pathname).toBe('/english/race/admin')
})

it('shows a failed save without retaining the previous Updated confirmation or leaving the settings page', async () => {
  localStorage.setItem(HOST_KEY, JSON.stringify(credentials))
  current = { ...current, phase: 'lobby', round: -1 }
  await mount()
  await act(async () => { doneButton().click() })
  expect(host.textContent).toContain('Updated')
  saveError = 'The settings could not be saved. Try again.'
  await act(async () => { doneButton().click() })
  expect(host.querySelector('[role="alert"]')?.textContent).toContain(saveError)
  expect(host.textContent).not.toContain('Updated')
  expect(doneButton().disabled).toBe(false)
  expect(localStorage.getItem(HOST_KEY)).toBe(JSON.stringify(credentials))
  expect(window.location.pathname).toBe('/english/race/admin')
})

it('loads the existing classroom selection instead of an older local draft', async () => {
  localStorage.setItem(HOST_KEY, JSON.stringify(credentials))
  localStorage.setItem('english-race:next-content', JSON.stringify({ stage: 'where-is-the', questionIds: ['race-where-taxi-complete', 'race-where-taxi-missing-is'] }))
  current = { ...current, phase: 'lobby', round: -1, stageId: 'holiday-meaning', questionIds: ['race-meaning-hotel', 'race-meaning-shop'] }
  await mount()
  expect(host.querySelector<HTMLSelectElement>('.race-admin-select select')?.value).toBe('holiday-meaning')
  expect(selectedWords()).toEqual(['hotel', 'shop'])
  expect(JSON.parse(localStorage.getItem('english-race:next-content')!)).toEqual({ stage: 'holiday-meaning', questionIds: ['race-meaning-hotel', 'race-meaning-shop'] })
  expect(doneButton().disabled).toBe(false)
  expect(host.textContent).not.toContain('Updated')
})

it('preserves edits already made when the classroom selection arrives late', async () => {
  localStorage.setItem(HOST_KEY, JSON.stringify(credentials))
  current = { ...current, phase: 'lobby', round: -1, stageId: 'holiday-meaning', questionIds: ['race-meaning-hotel', 'race-meaning-shop'] }
  let resolve!: (response: Response) => void
  const delayed = new Promise<Response>(done => { resolve = done })
  const previous = request.getMockImplementation()!
  request.mockImplementation((input, options) => String(input).includes('/state?') ? delayed : previous(input, options))
  await mount()
  await chooseWords(['taxi', 'beach'])
  await mode('Choose the meaning')
  await act(async () => { resolve(json(current)) })
  expect(selectedWords()).toEqual(['taxi', 'beach'])
  expect(JSON.parse(localStorage.getItem('english-race:next-content')!)).toEqual({ stage: 'holiday-meaning', questionIds: ['race-meaning-taxi', 'race-meaning-beach'] })
  expect(doneButton().disabled).toBe(false)
  expect(host.textContent).not.toContain('Updated')
})

it('removes retired station questions from saved host settings while retaining the chosen taxi questions', async () => {
  localStorage.setItem(HOST_KEY, JSON.stringify(credentials))
  current = { ...current, phase: 'lobby', round: -1, stageId: 'where-is-the', questionIds: ['race-where-taxi-complete', 'race-where-taxi-missing-is', 'race-where-taxi-missing-the', 'race-where-station-complete', 'race-where-station-missing-is'] }
  await mount()
  expect(selectedWords()).toEqual(['taxi'])
  expect(host.querySelector('.race-admin-words')?.textContent).not.toContain('station')
  expect(selectedRows().map(row => row.querySelector('strong')?.textContent)).toEqual(['Where is the taxi?', 'Where the taxi?', 'Where is taxi?'])
  expect(JSON.parse(localStorage.getItem('english-race:next-content')!)).toEqual({ stage: 'where-is-the', questionIds: ['race-where-taxi-complete', 'race-where-taxi-missing-is', 'race-where-taxi-missing-the'] })
  expect(doneButton().disabled).toBe(false)
  await act(async () => { doneButton().click() })
  const sent = request.mock.calls.find(([url]) => String(url).includes('/prepare?'))
  expect(JSON.parse(String(sent?.[1]?.body))).toEqual({ stage: 'where-is-the', questionIds: ['race-where-taxi-complete', 'race-where-taxi-missing-is', 'race-where-taxi-missing-the'], run: 7 })
})
