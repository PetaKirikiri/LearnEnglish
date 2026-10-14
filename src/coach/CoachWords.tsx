import { useEffect, useRef, useState } from 'react'
import Icon from '../ui/Icon'
import { speakEnglish as playRecording, stopEnglishSpeech as stopRecording } from '../learning/speech'
import { coachWords } from './content'
import { audioUrl } from './course'

export default function CoachWords({ tokens, onHelp, tokenOpacity = () => 1 }: {
  tokens: string[]; onHelp?: (word: string) => void; tokenOpacity?: (word: string) => number
}) {
  const [word, setWord] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    if (word) dialog.current?.showModal()
  }, [word])
  useEffect(() => () => stopRecording(), [])
  function close() { stopRecording(); dialog.current?.close(); setWord(null) }
  return <>
    {tokens.map((token, i) => <button key={`${i}-${token}`} type="button" className="coach-token" style={{ opacity: tokenOpacity(token) }}
      aria-label={`Sens de ${token}`} onClick={() => { onHelp?.(token); setFailed(false); setWord(token) }}>
      <span lang="th">{token}</span><small lang="th-Latn">{coachWords[token][1]}</small>
    </button>)}
    <dialog ref={dialog} className="coach-word-dialog" aria-labelledby="coach-word-title" onCancel={() => { stopRecording(); setWord(null) }} onClick={event => { if (event.target === event.currentTarget) close() }}>
      {word ? <><header><h2 id="coach-word-title" lang="th">{word}</h2>
        <button aria-label="Écouter ce mot" onClick={() => playRecording(word, audioUrl(word), state => setFailed(state === 'blocked'))}><Icon name="sound" /></button>
        <button aria-label="Fermer" onClick={close}><Icon name="close" /></button></header>
        <p lang="th-Latn">{coachWords[word][1]}</p><p lang="fr" className="coach-gloss">{coachWords[word][0]}</p>
        {failed ? <p role="alert">Audio indisponible. Réessayez.</p> : null}</> : null}
    </dialog>
  </>
}
