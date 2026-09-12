function canUseBrowserVoice() {
  return typeof window !== 'undefined'
    && 'speechSynthesis' in window
    && 'SpeechSynthesisUtterance' in window
}

let activeAudio: HTMLAudioElement | null = null

function playWithBrowserVoice(text: string) {
  if (!canUseBrowserVoice()) return false

  const utterance = new SpeechSynthesisUtterance(text)
  const englishVoice = window.speechSynthesis
    .getVoices()
    .find((voice) => voice.lang.toLocaleLowerCase('en').startsWith('en'))

  utterance.lang = englishVoice?.lang ?? 'en-US'
  utterance.voice = englishVoice ?? null
  utterance.rate = 0.86
  utterance.pitch = 1

  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(utterance)
  return true
}

export function canSpeakEnglish() {
  return typeof window !== 'undefined' && ('Audio' in window || canUseBrowserVoice())
}

export function speakEnglish(text: string, audioUrl: string) {
  if ('Audio' in window) {
    activeAudio?.pause()
    const audio = new Audio(audioUrl)
    activeAudio = audio
    void audio.play().catch(() => playWithBrowserVoice(text))
    return true
  }

  return playWithBrowserVoice(text)
}

export function stopEnglishSpeech() {
  activeAudio?.pause()
  activeAudio = null
  if (canUseBrowserVoice()) window.speechSynthesis.cancel()
}
