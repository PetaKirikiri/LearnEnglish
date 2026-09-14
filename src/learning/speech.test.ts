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

it('keeps a silent gap in fallback speech without speaking the answer or underscores', async () => {
  vi.useFakeTimers()
  const utterances: { text: string; onend?: () => void }[] = []
  vi.stubGlobal('SpeechSynthesisUtterance', class { text: string; constructor(text: string) { this.text = text } })
  vi.stubGlobal('speechSynthesis', { cancel: vi.fn(), getVoices: () => [], speak: (u: {text:string; onend?: () => void}) => utterances.push(u) })
  const { speakEnglish, stopEnglishSpeech } = await import('./speech')
  speakEnglish('Thanks a lot _____ your last letter.', '/gap.wav')
  media[0].onerror!()
  expect(utterances.map(u => u.text)).toEqual(['Thanks a lot '])
  utterances[0].onend!()
  vi.advanceTimersByTime(649)
  expect(utterances).toHaveLength(1)
  vi.advanceTimersByTime(1)
  expect(utterances.map(u => u.text)).toEqual(['Thanks a lot ', ' your last letter.'])
  stopEnglishSpeech()
  vi.useRealTimers()
})
