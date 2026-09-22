export type SpeechState = 'playing' | 'ended' | 'blocked'

let activeAudio: HTMLAudioElement | null = null
let playbackId = 0
let loadTimer: ReturnType<typeof setTimeout> | undefined

export function canSpeakEnglish() {
  return typeof window !== 'undefined' && 'Audio' in window
}

export function stopEnglishSpeech() {
  playbackId += 1
  clearTimeout(loadTimer)
  if (activeAudio) {
    activeAudio.onended = null
    activeAudio.onerror = null
    activeAudio.pause()
  }
}

export function speakEnglish(_text: string, audioUrl: string, onState?: (state: SpeechState) => void) {
  stopEnglishSpeech()
  const id = playbackId
  const notify = (state: SpeechState) => { if (id === playbackId) onState?.(state) }
  if (!canSpeakEnglish()) { notify('blocked'); return }
  // Keep one phone-unlocked player, but never substitute an arbitrary device
  // voice when the neural recording is unavailable.
  activeAudio ??= new Audio()
  activeAudio.src = audioUrl.startsWith('/audio/lessons/') ? `${audioUrl}?voice=kokoro-heart-v1&content=20260922-level-review` : audioUrl
  activeAudio.onended = () => { if (id === playbackId) { clearTimeout(loadTimer); notify('ended') } }
  const failed = () => {
    if (id !== playbackId) return
    stopEnglishSpeech()
    onState?.('blocked')
  }
  activeAudio.onerror = failed
  notify('playing')
  loadTimer = setTimeout(failed, 10000)
  void activeAudio.play().then(() => {
    if (id === playbackId) clearTimeout(loadTimer)
  }, failed)
}
