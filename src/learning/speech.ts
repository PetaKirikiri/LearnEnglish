export type SpeechState = 'playing' | 'ended' | 'blocked'

function canUseBrowserVoice() {
  return typeof window !== 'undefined'
    && 'speechSynthesis' in window
    && 'SpeechSynthesisUtterance' in window
}

let activeAudio: HTMLAudioElement | null = null
let playbackId = 0

export function canSpeakEnglish() {
  return typeof window !== 'undefined' && ('Audio' in window || canUseBrowserVoice())
}

export function stopEnglishSpeech() {
  playbackId += 1
  if (activeAudio) {
    activeAudio.onended = null
    activeAudio.onerror = null
    activeAudio.pause()
  }
  if (canUseBrowserVoice()) window.speechSynthesis.cancel()
}

export function speakEnglish(text: string, audioUrl: string, onState?: (state: SpeechState) => void) {
  stopEnglishSpeech()
  const id = playbackId
  const notify = (state: SpeechState) => { if (id === playbackId) onState?.(state) }
  notify('playing')
  let fallbackStarted = false
  function fallback() {
    if (id !== playbackId || fallbackStarted) return
    fallbackStarted = true
    if (!canUseBrowserVoice()) { notify('blocked'); return }
    const utterance = new SpeechSynthesisUtterance(text)
    const voice = window.speechSynthesis.getVoices().find(v => v.lang.toLowerCase().startsWith('en'))
    utterance.lang = voice?.lang ?? 'en-US'
    utterance.voice = voice ?? null
    utterance.rate = 0.86
    utterance.onend = () => notify('ended')
    utterance.onerror = () => notify('blocked')
    window.speechSynthesis.speak(utterance)
  }
  if (typeof window !== 'undefined' && 'Audio' in window) {
    // Reuse the element so phones can retain playback permission after a tap.
    activeAudio ??= new Audio()
    activeAudio.src = audioUrl
    activeAudio.onended = () => notify('ended')
    activeAudio.onerror = fallback
    void activeAudio.play().catch((error: unknown) => {
      if (id !== playbackId) return
      if (error instanceof Error && error.name === 'NotAllowedError') notify('blocked')
      else fallback()
    })
  } else fallback()
}
