import { useCallback, useEffect, useRef, useState } from 'react'
import { practiceDeck, practiceEnglishMeaning } from './practiceDeck'
import './phonePractice.css'
import ListeningMatrix from '../learning/sentenceMatrix/ListeningMatrix'
import type { MatrixSettings } from '../learning/sentenceMatrix/model'
import { useWordProgress } from '../learning/wordProgress/useWordProgress'
import { QUESTION_VERSION, WORD_RULE_VERSION, wordOpacity,wordTokens,type WordScores } from '../learning/wordProgress/model'
import '../classroom/sentenceLine.css'
function Arrow({ back = false }: { back?: boolean }) {
  return <svg viewBox="0 0 32 32" aria-hidden="true" style={back ? {transform:'rotate(180deg)'} : undefined}><path d="M6 16h19M17 7l9 9-9 9" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
const lesson = new URLSearchParams(window.location.search).get('lesson') === '2' ? 2 : 1


const guestSaveKey = `homework-v3-lesson-${lesson}`
function restore(saveKey: string) {
  try {
    const saved = JSON.parse(localStorage.getItem(saveKey) || 'null')
    const expected = practiceDeck()
    if (saved && Array.isArray(saved.deck) && saved.deck.length >= expected.length && saved.deck.every((q: {id:string;english:string;choices:string[];correct:number}) => expected.some(e => e.id === q.id && e.english === q.english && q.choices?.[q.correct] === e.choices[e.correct] && q.choices.length===2 && q.choices.every(c=>e.choices.includes(c)))) && Number.isInteger(saved.index) && saved.index >= 0 && saved.index <= saved.deck.length && Number.isInteger(saved.score)) {
      saved.deck = saved.deck.map((q: {id:string;attemptId?:string}) => ({...q, attemptId:q.attemptId??crypto.randomUUID(), audioUrl: expected.find(e => e.id === q.id)!.audioUrl}))
      return saved
    }
  } catch { /* Storage may be unavailable on private browsers. */ }
  return null
}
export default function PhonePractice({ userId,tester=false,settings={fadeMode:true,trackWords:true} }: { userId?: string;tester?:boolean;settings?:MatrixSettings }) {
  const [language,setLanguage]=useState<'th'|'en'>('th')
  const english=tester && language==='en'
  const label=(thai:string,en:string)=>english?en:thai
  const progress=useWordProgress(userId,settings.trackWords!==false)
  const replays=useRef(0)
  const presentationScores=useRef<WordScores>({})
  const [attemptError,setAttemptError]=useState('')
  const saveKey = userId ? `${guestSaveKey}:${userId}` : guestSaveKey
  const [saved] = useState(() => restore(saveKey))
  const [started, setStarted] = useState(false)
  const [audioError, setAudioError] = useState<'blocked'|'failed'|null>(null)
  const autoPlayed = useRef<string|null>(null)
  const playbackRequest = useRef(0)
  const player = useRef<HTMLAudioElement | null>(null)
  const [deck, setDeck] = useState<ReturnType<typeof practiceDeck>>(() => saved?.deck ?? practiceDeck())
  const [index, setIndex] = useState<number>(saved?.index ?? 0)
  const [picked, setPicked] = useState<number | null>(saved?.picked ?? null)
  const [score, setScore] = useState<number>(saved?.score ?? 0)
  const question = deck[index]
  const correct = picked !== null && picked === question?.correct
  const finished = index >= deck.length
  const nextButton = useRef<HTMLButtonElement>(null)
  const firstAnswer = useRef<HTMLButtonElement>(null)
  const answerLocked = useRef(saved?.picked != null)
  useEffect(() => {
    try { localStorage.setItem(saveKey, JSON.stringify({deck,index,picked,score})) } catch { /* Continue practice without storage. */ }
  }, [deck,index,picked,score,saveKey])
  const play = useCallback((q: ReturnType<typeof practiceDeck>[number]) => {
    const request = ++playbackRequest.current
    autoPlayed.current = q.attemptId
    player.current?.pause()
    window.speechSynthesis?.cancel()
    const fail = (error?: unknown) => {
      if (playbackRequest.current !== request) return
      setAudioError(error instanceof DOMException && error.name === 'NotAllowedError' ? 'blocked' : 'failed')
    }
    if (!q.audioUrl) { fail(); return }
    const audio = player.current ?? new Audio(); player.current = audio
    audio.src = q.audioUrl
    audio.onerror = () => fail()
    void audio.play().then(() => {
      if (playbackRequest.current !== request) return
      replays.current += 1
      setStarted(true)
      setAudioError(null)
    }).catch(fail)
  }, [])
  useEffect(() => {
    if (question && progress.ready && autoPlayed.current !== question.attemptId) play(question)
    if (!question) { playbackRequest.current += 1; player.current?.pause() }
  }, [question, progress.ready, play])
  useEffect(() => () => {
    playbackRequest.current += 1
    autoPlayed.current = null
    player.current?.pause()
    window.speechSynthesis?.cancel()
  }, [])
  function next() {
    if (!answerLocked.current || finished) return
    answerLocked.current = false
    setPicked(null)
    replays.current=0
    setIndex(i => i + 1)
    if (deck[index + 1]) { play(deck[index + 1]) }
  }
  useEffect(() => {
    if (picked !== null) nextButton.current?.focus({ preventScroll: true })
    else if (index > 0) firstAnswer.current?.focus({ preventScroll: true })
  }, [picked, index])
  function choose(choice: number) {
    if (answerLocked.current || finished || !progress.ready) return
    try {progress.record({id:question.attemptId,questionId:question.id,version:QUESTION_VERSION,answer:question.choices[choice],occurredAt:new Date().toISOString(),modality:settings.fadeMode?(wordTokens(question.english).every(w=>wordOpacity(w,presentationScores.current,settings)===0)?'audio':wordTokens(question.english).some(w=>wordOpacity(w,presentationScores.current,settings)<1)?'faded':'visible'):question.audioOnly?'audio':'visible',replays:Math.max(0,replays.current-1),ruleVersion:WORD_RULE_VERSION});setAttemptError('')}
    catch {setAttemptError('บันทึกคำตอบไม่ได้ กรุณาลองอีกครั้ง');return}
    answerLocked.current = true
    setPicked(choice)
    if (choice === question.correct) setScore(value => value + 1)
    if (choice !== question.correct) setDeck(items => [...items, {...question, attemptId:crypto.randomUUID(), choices: [...question.choices].reverse(), correct: 1 - question.correct}])
  }
  return <main className="phone-practice" lang={english?"en":"th"}><div className="practice-shell">
    <header>{tester && <div className="practice-languages" role="group" aria-label="Language"><button aria-label="English" aria-pressed={english} onClick={()=>setLanguage('en')}>🇬🇧</button><button aria-label="ไทย" aria-pressed={!english} onClick={()=>setLanguage('th')}>🇹🇭</button></div>}<a href={`/classroom/index.html?lesson=${lesson}`} aria-label="กลับบทเรียน"><Arrow back/></a><div className="practice-identity"><span lang="en">ENGLISH SUCCESS</span><strong>{label('บทที่','Lesson')} {lesson} · {label('การบ้าน','Practice')}</strong></div><span>{Math.min(index + 1, deck.length)} / {deck.length}</span>{!finished && <button className="practice-audio" onClick={() => play(question)} aria-label="ฟังประโยคภาษาอังกฤษ"><svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true"><path d="M5 12h5l7-6v20l-7-6H5z" fill="currentColor"/><path d="M22 10q6 6 0 12M26 5q10 11 0 22" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>{started ? label('ฟังอีกครั้ง','Listen again') : label('ฟัง','Listen')}</button>}</header>
    <progress value={index} max={deck.length} aria-label="ความคืบหน้า"/>
    {finished ? <section className="practice-complete"><h1>{label('ฝึกครบแล้ว!','Practice complete!')}</h1><p>{score} / {deck.length}</p><button onClick={() => { setDeck(practiceDeck()); setIndex(0); setPicked(null); setScore(0); replays.current=0; answerLocked.current = false }}>{label('ฝึกอีกครั้ง','Practise again')}</button></section> : <>
      <div className="practice-stage">
      <section className="practice-question" aria-label={settings.fadeMode || question.audioOnly ? 'ฟังแล้วเลือกคำตอบ' : question.english}>

      {audioError && <div role="alert"><button className="practice-audio-retry" onClick={() => play(question)}>{audioError === 'blocked' ? label('▶ แตะเพื่อเปิดเสียง','▶ Enable audio') : label('↻ ลองเล่นเสียงอีกครั้ง','↻ Retry audio')}</button></div>}
      {(progress.error || attemptError) && <p role="alert">{attemptError || progress.error} <button onClick={()=>void progress.retry()}>{label('ลองอีกครั้ง','Try again')}</button></p>}
      {!progress.ready ? <span role="status" aria-label="กำลังโหลดความคืบหน้า">…</span> : (settings.fadeMode || !question.audioOnly) && <ListeningMatrix key={question.attemptId} sentence={question.english} scores={progress.scores} settings={settings} onSnapshot={scores=>{presentationScores.current=scores}}/>}
      </section><div className={`practice-response${picked !== null ? ' has-answer' : ' is-ready'}`}><p id="practice-instruction" className="practice-instruction">{picked !== null ? label('ถัดไป →','Next →') : label('แตะคำตอบที่ตรงกับประโยค','Choose the matching answer')}</p>
      <div className="practice-answers" role="group" aria-labelledby="practice-instruction">{question.choices.map((choice, side) => <button ref={side === 0 ? firstAnswer : undefined} key={`${question.id}-${side}`} className={`choice-${side}${picked !== null && side === question.correct ? ' correct' : ''}${picked === side && !correct ? ' incorrect' : ''}`} disabled={picked !== null || !progress.ready} aria-pressed={picked === side} onClick={() => choose(side)}><span className="practice-choice-number" aria-hidden="true">{picked !== null && (side === question.correct || picked === side) ? <img src={`/images/race/answer-${side === question.correct ? 'correct' : 'wrong'}-v2.png`} alt=""/> : side + 1}</span><span className="practice-choice-label">{english ? practiceEnglishMeaning(choice) : choice}</span><span className="practice-choice-go" aria-hidden="true"><Arrow/></span></button>)}</div></div></div>
      <footer className={`practice-feedback${picked !== null ? ' answered' : ''}${picked !== null ? correct ? ' is-correct' : ' is-incorrect' : ''}`}>
        <div className="practice-result" role="status" aria-live="polite">{picked !== null && <><strong>{correct ? label('ถูกต้อง!','Correct!') : label('ยังไม่ถูก','Not quite')}</strong></>}</div>
        <button ref={nextButton} disabled={picked === null} onClick={next}>{label('ถัดไป','Next')} <Arrow/></button>
      </footer>
    </>}
  </div></main>
}
