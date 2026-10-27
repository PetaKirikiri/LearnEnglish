import { useEffect, useRef, useState } from 'react'
import { tonightMeaningQuestions } from './tonightQuestions'
import './phonePractice.css'
import TonightSlots from './TonightSlots'

function practiceDeck() {
  // Keep the known frame stable before introducing each ownership word.
  return ['the', 'my', 'your'].flatMap(owner => {
    const questions = tonightMeaningQuestions.filter(q => q.id.endsWith(`-${owner}`))
    for (let i = questions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1)); [questions[i], questions[j]] = [questions[j], questions[i]]
    }
    return questions.map(q => {
      const correct = q.answers[q.correct][0].text
      const other = Math.random() < .5 ? q.meaningDistractor : q.answers[1 - q.correct][0].text
      const side = Math.random() < .5 ? 0 : 1
      return { id: q.id, english: q.english, choices: side === 0 ? [correct, other] : [other, correct], correct: side }
    })
  })
}
export default function PhonePractice() {
  const [deck, setDeck] = useState(practiceDeck)
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const question = deck[index]
  const correct = picked !== null && picked === question?.correct
  const finished = index >= deck.length
  const nextButton = useRef<HTMLButtonElement>(null)
  const firstAnswer = useRef<HTMLButtonElement>(null)
  const answerLocked = useRef(false)
  function next() {
    if (!answerLocked.current || finished) return
    answerLocked.current = false
    setPicked(null)
    setIndex(i => i + 1)
  }
  useEffect(() => {
    if (picked !== null) nextButton.current?.focus({ preventScroll: true })
    else if (index > 0) firstAnswer.current?.focus({ preventScroll: true })
  }, [picked, index])
  function choose(choice: number) {
    if (answerLocked.current || finished) return
    answerLocked.current = true
    setPicked(choice)
    if (choice === question.correct) setScore(value => value + 1)
  }
  return <main className="phone-practice" lang="th"><div className="practice-shell">
    <header><a href="/english/race/lesson" aria-label="กลับบทเรียน">←</a><div className="practice-identity"><span lang="en">ENGLISH SUCCESS</span><strong lang="en">Where is…?</strong></div><span>{Math.min(index + 1, deck.length)} / {deck.length}</span></header>
    <progress value={index} max={deck.length} aria-label="ความคืบหน้า"/>
    {finished ? <section className="practice-complete"><h1>ฝึกครบแล้ว!</h1><p>{score} / {deck.length}</p><button onClick={() => { setDeck(practiceDeck()); setIndex(0); setPicked(null); setScore(0); answerLocked.current = false }}>ฝึกอีกครั้ง</button></section> : <>
      <div className="practice-stage">
      <section className="practice-question" aria-label={question.english}>
      <TonightSlots assessment values={['Where', 'is', question.english.split(' ')[2], question.english.split(' ').slice(3).join(' ').replace(/\?$/, '')]}/>
      </section><div className="practice-response"><p id="practice-instruction" className="practice-instruction">เลือกความหมายที่ตรงกัน</p>
      <div className="practice-answers" role="group" aria-labelledby="practice-instruction">{question.choices.map((choice, side) => <button ref={side === 0 ? firstAnswer : undefined} key={`${question.id}-${side}`} className={`choice-${side}${picked !== null && side === question.correct ? ' correct' : ''}${picked === side && !correct ? ' incorrect' : ''}`} disabled={picked !== null} aria-pressed={picked === side} onClick={() => choose(side)}><span className="practice-choice-number" aria-hidden="true">{picked !== null && side === question.correct ? '✓' : picked === side ? '×' : side + 1}</span><span>{choice}</span></button>)}</div></div></div>
      <footer className={`practice-feedback${picked !== null ? ' answered' : ''}`}>
        <div className="practice-result" role="status" aria-live="polite">{picked !== null && <><span className="practice-result-mark" aria-hidden="true">{correct ? '✓' : '×'}</span><strong>{correct ? 'ถูกต้อง!' : 'ยังไม่ถูก'}</strong></>}</div>
        <button ref={nextButton} disabled={picked === null} onClick={next}>ถัดไป <span aria-hidden="true">→</span></button>
      </footer>
    </>}
  </div></main>
}
