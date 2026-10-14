import { useCallback, useEffect, useRef, useState } from 'react'
import Icon from '../ui/Icon'
import { speakEnglish as playRecording, stopEnglishSpeech as stopRecording } from '../learning/speech'
import * as course from './course'
import CoachWords from './CoachWords'

export default function CoachLesson({ userId }: { userId: string }) {
  const [progress, setProgress] = useState(() => course.loadProgress(userId))
  const [words, setWords] = useState(() => course.loadWords(userId))
  const [question, setQuestion] = useState(() => course.nextQuestion(progress))
  const [selected, setSelected] = useState<number | null>(null)
  const [flipped, setFlipped] = useState(() => Math.random() < 0.5)
  const [helped, setHelped] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [heard, setHeard] = useState(false)
  const [audio, setAudio] = useState('')
  const [saveError, setSaveError] = useState(false)
  const answered = useRef(false)
  const round = useRef(0)
  const play = useCallback((q: course.CoachQuestion) => playRecording(q.thai, q.audioUrl, state => {
    if (state === 'ended') setHeard(true)
    setAudio(state === 'blocked' ? 'Touchez pour écouter' : state === 'playing' ? 'Écoutez…' : 'Réécouter')
  }), [])
  useEffect(() => { play(question); return () => stopRecording() }, [play, question])
  function save(key: string, value: unknown) {
    try { localStorage.setItem(key, JSON.stringify(value)) } catch { setSaveError(true) }
  }
  function choose(index: number) {
    if (answered.current || !heard) return
    answered.current = true
    setSelected(index)
    const correct = index === question.correct
    const updated = course.recordAnswer(progress, question, correct, helped || revealed)
    const memory = course.recordWords(words, question.tokens, correct, helped || revealed)
    setProgress(updated); setWords(memory)
    save(course.progressKey(userId), updated); save(course.memoryKey(userId), memory)
  }
  function help(token: string) {
    if (selected === null) setHelped(true)
    const memory = { ...words, [token]: { seen: words[token]?.seen ?? 0, strength: 0 } }
    setWords(memory); save(course.memoryKey(userId), memory)
  }
  function next() {
    setQuestion(course.nextQuestion(progress, question.id, ++round.current))
    setSelected(null); setHeard(false); setHelped(false); setRevealed(false); setFlipped(Math.random() < 0.5); answered.current = false
  }
  return <section className="hotel-lesson" lang="fr">
    <button className="hotel-listen" onClick={() => play(question)} aria-label="Écouter en thaï"><Icon name="sound" /></button>
    <p className="hotel-audio" aria-live="polite">{audio}</p>
    <div className="hotel-sentence coach-sentence"><CoachWords key={question.id} tokens={question.tokens} onHelp={help}
      tokenOpacity={token => selected !== null || revealed ? 1 : course.opacity(words, token)} /></div>
    <div className="hotel-answers">{(flipped ? [1, 0] : [0, 1]).map(index => <button key={`${question.id}-${index}`} disabled={selected !== null || !heard}
      className={`hotel-answer ${selected !== null && index === question.correct ? 'right' : selected === index ? 'wrong' : ''}`} onClick={() => choose(index)}>{question.choices[index]}</button>)}</div>
    {selected === null ? <button className="hotel-reveal" onClick={() => setRevealed(true)} disabled={revealed}>{revealed ? 'Texte visible' : 'Afficher le texte'}</button>
      : <div className="hotel-feedback" aria-live="polite"><span className="coach-result">{selected === question.correct ? 'Bien !' : question.choices[question.correct]}</span><button className="hotel-primary" onClick={next}>Suivant →</button></div>}
    {saveError ? <p role="alert">La progression n’a pas pu être enregistrée sur cet appareil.</p> : null}
  </section>
}
