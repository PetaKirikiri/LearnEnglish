import { act, useCallback, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { HOST_KEY, useRaceConnection } from './connection'
import type { RaceCredential, RaceView } from './types'

const credential: RaceCredential = { room: 'AAAAAAAAAA', token: 'host-a' }
function race(overrides: Partial<RaceView> = {}): RaceView {
  return { id: credential.room, run: 1, stageId: 'test', phase: 'answering', round: 0, finish: 1600, serverNow: 1000, motionAt: 1000, title: 'Class race', players: [], opensAt: 1000, closesAt: 6000, question: { id: 'first', english: 'Where is the ball?', choices: ['Here', 'There'] }, ...overrides }
}
const json = (value: RaceView) => new Response(JSON.stringify(value), { headers: { 'Content-Type': 'application/json' } })
function deferredResponse() {
  let resolve!: (response: Response) => void
  const promise = new Promise<Response>(done => { resolve = done })
  return { promise, resolve }
}

// A pending answer is consumer state: only a new race/round may clear it.
function Display({ changed, controlResult }: { changed: () => void; controlResult?: RaceView }) {
  const [pending, setPending] = useState(false)
  const resetAnswer = useCallback(() => { setPending(false); changed() }, [changed])
  const { view, credentials, sync } = useRaceConnection(HOST_KEY, resetAnswer)
  return <>
    <p role="status">{view ? `${view.title}: ${view.question?.english ?? 'Waiting for Start'}` : credentials ? 'Connecting' : 'Open race admin'}</p>
    <button onClick={() => setPending(true)}>Choose answer</button>
    {pending && <p>Answer waiting to send</p>}
    {controlResult && <button onClick={() => sync(controlResult)}>Apply round start</button>}
  </>
}

let host: HTMLDivElement
let root: Root
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  vi.useFakeTimers()
  localStorage.clear()
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
async function click(label: string) {
  const button = [...host.querySelectorAll('button')].find(item => item.textContent === label)
  expect(button).toBeTruthy()
  await act(async () => { button!.click() })
}
async function poll() { await act(async () => { await vi.advanceTimersByTimeAsync(350) }) }
async function fromAdmin(value: RaceCredential) {
  await act(async () => {
    const oldValue = localStorage.getItem(HOST_KEY)
    const newValue = JSON.stringify(value)
    localStorage.setItem(HOST_KEY, newValue)
    window.dispatchEvent(new StorageEvent('storage', { key: HOST_KEY, oldValue, newValue, storageArea: localStorage }))
  })
}

it('connects an already-open display when Admin changes the shared host credential in another tab', async () => {
  const changed = vi.fn()
  const nextRoom: RaceCredential = { room: 'BBBBBBBBBB', token: 'host-b' }
  const fetch = vi.fn<typeof globalThis.fetch>()
    .mockResolvedValueOnce(json(race({ title: 'First classroom', serverNow: 5000 })))
    .mockResolvedValueOnce(json(race({ id: nextRoom.room, title: 'New classroom', serverNow: 1000 })))
  vi.stubGlobal('fetch', fetch)
  await act(async () => { root.render(<Display changed={changed}/>) })
  expect(host.textContent).toContain('Open race admin')
  expect(fetch).not.toHaveBeenCalled()

  await fromAdmin(credential)
  expect(fetch).toHaveBeenNthCalledWith(1, '/api/classroom-race/state?room=AAAAAAAAAA', expect.objectContaining({ headers: { Authorization: 'Bearer host-a' } }))
  expect(host.textContent).toContain('First classroom: Where is the ball?')

  await fromAdmin(nextRoom)
  expect(fetch).toHaveBeenNthCalledWith(2, '/api/classroom-race/state?room=BBBBBBBBBB', expect.objectContaining({ headers: { Authorization: 'Bearer host-b' } }))
  expect(host.textContent).toContain('New classroom: Where is the ball?')
  expect(host.textContent).not.toContain('First classroom')
  expect(changed).toHaveBeenCalledTimes(2)
})

it('clears pending answers on a new run in the same room, including repeated round numbers and lobby restarts', async () => {
  localStorage.setItem(HOST_KEY, JSON.stringify(credential))
  const changed = vi.fn()
  let next = race()
  vi.stubGlobal('fetch', vi.fn<typeof globalThis.fetch>().mockImplementation(async () => json(next)))
  await act(async () => { root.render(<Display changed={changed}/>) })
  await click('Choose answer')
  await poll()
  expect(changed).toHaveBeenCalledTimes(1)
  expect(host.textContent).toContain('Answer waiting to send')

  // The display can miss the lobby between polls. A new run at round zero
  // must still release the previous run's answer lock.
  next = race({ run: 2, round: 0, serverNow: 2000 })
  await poll()
  expect(changed).toHaveBeenCalledTimes(2)
  expect(host.textContent).not.toContain('Answer waiting to send')

  await click('Choose answer')
  next = race({ run: 3, round: -1, phase: 'lobby', question: undefined, serverNow: 3000 })
  await poll()
  expect(changed).toHaveBeenCalledTimes(3)
  expect(host.textContent).toContain('Waiting for Start')
  expect(host.textContent).not.toContain('Answer waiting to send')

  next = race({ run: 3, round: 0, serverNow: 4000 })
  await poll()
  expect(changed).toHaveBeenCalledTimes(4)
  expect(host.textContent).toContain('Where is the ball?')
})

it('ignores an older poll arriving after a newer control response without clearing the current answer', async () => {
  localStorage.setItem(HOST_KEY, JSON.stringify(credential))
  const changed = vi.fn()
  const delayed = deferredResponse()
  const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValueOnce(json(race())).mockReturnValueOnce(delayed.promise)
  vi.stubGlobal('fetch', fetch)
  const nextRound = race({ round: 1, serverNow: 3000, question: { id: 'second', english: 'Where is the chair?', choices: ['Here', 'There'] } })
  await act(async () => { root.render(<Display changed={changed} controlResult={nextRound}/>) })
  await poll()
  expect(fetch).toHaveBeenCalledTimes(2)
  await click('Apply round start')
  await click('Choose answer')
  expect(changed).toHaveBeenCalledTimes(2)

  await act(async () => { delayed.resolve(json(race({ serverNow: 2000 }))) })
  expect(host.textContent).toContain('Where is the chair?')
  expect(host.textContent).not.toContain('Where is the ball?')
  expect(host.textContent).toContain('Answer waiting to send')
  expect(changed).toHaveBeenCalledTimes(2)
})
