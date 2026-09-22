import { afterEach, beforeEach, expect, it, vi } from 'vitest'

const media: FakeAudio[] = []
class FakeAudio {
  src = ''
  onended: (() => void) | null = null
  onerror: (() => void) | null = null
  play = vi.fn(() => Promise.resolve())
  pause = vi.fn()
  constructor() { media.push(this) }
}
beforeEach(() => {
  vi.resetModules()
  media.length = 0
  vi.stubGlobal('Audio', FakeAudio)
})
afterEach(() => vi.unstubAllGlobals())

it('reports playback completion and reuses the phone-unlocked audio element', async () => {
  const { speakEnglish } = await import('./speech')
  const state = vi.fn()
  speakEnglish('A train.', '/train.wav', state)
  expect(state).toHaveBeenCalledWith('playing')
  media[0].onended!()
  expect(state).toHaveBeenLastCalledWith('ended')
  speakEnglish('My sister.', '/sister.wav', state)
  expect(media).toHaveLength(1)
  expect(media[0].src).toBe('/sister.wav')
})

it('reports autoplay permission rejection instead of pretending to play', async () => {
  const { speakEnglish } = await import('./speech')
  speakEnglish('First.', '/first.wav')
  media[0].play.mockRejectedValueOnce(Object.assign(new Error('Tap required'), { name: 'NotAllowedError' }))
  const state = vi.fn()
  speakEnglish('Second.', '/second.wav', state)
  await Promise.resolve()
  expect(state).toHaveBeenLastCalledWith('blocked')
})

it('ignores stale ended callbacks after navigation or stopping', async () => {
  const { speakEnglish, stopEnglishSpeech } = await import('./speech')
  const state = vi.fn()
  speakEnglish('First.', '/first.wav', state)
  const ended = media[0].onended!
  stopEnglishSpeech()
  ended()
  expect(state.mock.calls).toEqual([['playing']])
  expect(media[0].pause).toHaveBeenCalled()
})

it('does not substitute a robotic system voice when a recording fails', async () => {
  const browserSpeak = vi.fn()
  vi.stubGlobal('speechSynthesis', { speak: browserSpeak })
  const { speakEnglish } = await import('./speech')
  const state = vi.fn()
  speakEnglish('Thanks a lot _____ your last letter.', '/audio/lessons/gap.wav', state)
  expect(media[0].src).toBe('/audio/lessons/gap.wav?voice=kokoro-heart-v1&content=20260922-vocab')
  media[0].onerror!()
  expect(state).toHaveBeenLastCalledWith('blocked')
  expect(browserSpeak).not.toHaveBeenCalled()
})

it('releases a stalled audio load instead of remaining in Playing', async () => {
  vi.useFakeTimers()
  const { speakEnglish } = await import('./speech')
  speakEnglish('First.', '/first.wav')
  await Promise.resolve()
  media[0].play.mockImplementationOnce(() => new Promise(() => {}))
  const state = vi.fn()
  speakEnglish('Second.', '/second.wav', state)
  vi.advanceTimersByTime(10000)
  expect(state).toHaveBeenLastCalledWith('blocked')
  expect(media[0].pause).toHaveBeenCalled()
  vi.useRealTimers()
})
