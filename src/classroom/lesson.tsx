import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import ExampleLanguage from '../learning/ExampleLanguage'
import { QuestionExample } from '../race/RaceLessonExamples'
import { holidayVocabulary, type HolidayWord } from '../race/holidayVocabulary'
import { classOneQuestions } from '../portal/classOne'
import Icon from '../ui/Icon'
import SentenceLine from './SentenceLine'
import { firstWords, judgementPractice, lessonTitles, meaningPractice } from './lessonOne'
import type { LessonPage, PracticeMode, PracticeQuestion } from './lessonOne'
import '../learning/sentenceSlotBuilder.css'
import './lesson.css'


const whereAudio = classOneQuestions.find(question => question.english === 'Where?')!.audioUrl

function Heading({ page, children }: { page: LessonPage; children?: ReactNode }) {
  return <header className="lesson-heading cw-heading"><p className="cw-lesson-label">01 <span/> Where is the…?</p><h1 id="note-title" lang="th">{lessonTitles[page]}</h1>{children && <p className="lead" lang="th">{children}</p>}</header>
}

function PanelHeader({ page, action }: { page: LessonPage; action?: ReactNode }) {
  return <header className="cw-panel-header"><span className="cw-panel-lesson">Lesson 01</span><div className="cw-panel-header-main"><h1 id="note-title" lang="th">{lessonTitles[page]}</h1>{action}</div></header>
}

function RevealIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>
}

function Sound({ src, label = 'ฟังประโยค', onPlayed }: { src: string; label?: string; onPlayed?: () => void }) {
  const audio = useRef<HTMLAudioElement>(null)
  const [error, setError] = useState(false)
  const [playing, setPlaying] = useState(false)
  useEffect(() => { const player = audio.current; return () => { player?.pause() } }, [])
  async function play() {
    const player = audio.current
    if (!player) return
    player.currentTime = 0; setError(false)
    try { await player.play(); onPlayed?.() } catch { setError(true) }
  }
  return <div className="cw-audio"><audio ref={audio} src={src} preload="none" onPlay={() => setPlaying(true)} onEnded={() => setPlaying(false)} onPause={() => setPlaying(false)}/><button className={`cw-sound${playing ? ' is-playing' : ''}`} onClick={() => void play()} aria-label={label}><Icon name="sound"/><span lang="th">{label}</span></button>{error && <p role="alert" lang="th">เล่นเสียงไม่ได้ ลองกดอีกครั้ง</p>}</div>
}

function Recall() {
  const [visible, setVisible] = useState<string[]>([])
  const allVisible = firstWords.every(word => visible.includes(word))
  return <div className="cw-recall-panel"><PanelHeader page="recall" action={<button className="cw-translation-toggle" aria-pressed={allVisible} onClick={() => setVisible(allVisible ? [] : [...firstWords])} lang="th"><RevealIcon/>{allVisible ? 'ซ่อนคำแปล' : 'แสดงคำแปล'}</button>}/><div className="cw-recall-workspace"><section className="cw-recall-surface" aria-label="คำศัพท์ทบทวน">{firstWords.map(word => {
    const item = holidayVocabulary.find(item => item.word === word)!
    return <button key={word} className="cw-recall-word" aria-label={`${word} · ${visible.includes(word) ? item.thai + ' · ซ่อนคำแปล' : 'ดูคำแปล'}`} aria-expanded={visible.includes(word)} aria-controls={`cw-meaning-${word}`} onClick={() => setVisible(previous => previous.includes(word) ? previous.filter(w => w !== word) : [...previous, word])}><strong lang="en">{word}</strong><span className="cw-recall-meaning" id={`cw-meaning-${word}`} lang="th">{visible.includes(word) ? item.thai : <RevealIcon/>}</span></button>
  })}</section></div></div>
}

function Meaning() {
  const [word, setWord] = useState<HolidayWord>('hotel')
  const item = holidayVocabulary.find(item => item.word === word)!
  return <div className="cw-idea-panel">
    <PanelHeader page="idea"/>
    <div className="cw-idea-sections">
      <section className="cw-idea-word" aria-labelledby="cw-word-title">
        <header className="cw-section-heading"><h2 id="cw-word-title" lang="th">คำถาม</h2></header>
        <div className="cw-word-focus"><ExampleLanguage matrix english="Where?" thai="ที่ไหน?" units={[{ english: 'Where?', thai: 'ที่ไหน?' }]}/></div>
        <Sound src={whereAudio} label="ฟังคำนี้"/>
      </section>
      <section className="cw-idea-context" aria-labelledby="cw-context-title">
        <header className="cw-section-heading"><h2 id="cw-context-title" lang="th">ตัวอย่าง</h2></header>
        <div className="cw-context-focus" aria-live="polite"><p className="cw-context-question" lang="th"><span key={word} className="cw-context-noun">{item.thai}</span><strong>อยู่ที่ไหน?</strong></p></div>
        <div className="cw-context-choices" role="group" aria-label="เปลี่ยนสิ่งที่ถามหา">{firstWords.map(value => <button key={value} aria-pressed={word === value} onClick={() => setWord(value)} lang="th">{holidayVocabulary.find(item => item.word === value)!.thai}</button>)}</div>
      </section>
    </div>
  </div>
}

function WorkedExample({ word, onWord }: { word: HolidayWord; onWord: (word: HolidayWord) => void }) {
  return <div className="cw-sentence-panel"><PanelHeader page="example"/><div className="cw-sentence-workspace"><SentenceLine word={word} onWord={onWord} audio={<Sound key={word} src={`/audio/race-holiday/${word}-complete.wav`}/>}/></div></div>
}

function Mistake({ word }: { word: HolidayWord }) {
  const [missing, setMissing] = useState<'complete' | 'missing-is' | 'missing-the'>('missing-is')
  const item = holidayVocabulary.find(item => item.word === word)!
  const units = [{ english: 'Where', thai: 'ที่ไหน' }, { english: 'is', thai: 'อยู่' }, { english: 'the', thai: 'ที่กำลังพูดถึง' }, { english: `${word}?`, thai: item.thai }].filter(unit => !((missing === 'missing-is' && unit.english === 'is') || (missing === 'missing-the' && unit.english === 'the')))
  return <><Heading page="mistake">ในรูปแบบนี้ ต้องมีทั้ง <span lang="en">is</span> และ <span lang="en">the</span></Heading><div className={`cw-centre cw-${missing}`}><ExampleLanguage matrix english={units.map(unit => unit.english).join(' ')} thai={`${item.thai}อยู่ที่ไหน`} units={units}/><Sound key={`${word}-${missing}`} src={`/audio/race-holiday/${word}-${missing}.wav`}/><p className={`cw-pattern-feedback ${missing === 'complete' ? 'is-complete' : ''}`} role="status" lang="th">{missing === 'complete' ? '✓ ครบทั้งสี่ส่วน' : `ยังขาด ${missing === 'missing-is' ? 'is' : 'the'}`}</p></div><div className="cw-segments" aria-label="เปรียบเทียบรูปแบบ">{(['complete', 'missing-is', 'missing-the'] as const).map(variant => <button key={variant} aria-pressed={missing === variant} onClick={() => setMissing(variant)} lang="th">{variant === 'complete' ? 'ครบทุกคำ' : `ไม่มี ${variant === 'missing-is' ? 'is' : 'the'}`}</button>)}</div></>
}

function PracticeRound({ question, mode }: { question: PracticeQuestion; mode: PracticeMode }) {
  const [listened, setListened] = useState(false)
  const [answer, setAnswer] = useState<number | null>(null)
  return <div className="cw-practice-round">
    <div className={`cw-listening${answer !== null ? ' has-answer' : ''}`}>
      {answer === null ? <><div className="cw-ear" aria-hidden="true"><Icon name="sound"/></div><Sound key={question.id} src={question.audio} label={listened ? 'ฟังอีกครั้ง' : 'ฟังคำถาม'} onPlayed={() => setListened(true)}/></> : <><p className="cw-correct-pattern" lang="th">รูปแบบที่ถูกต้อง</p><QuestionExample word={question.word}/><Sound key="correct-pattern" src={`/audio/race-holiday/${question.word}-complete.wav`} label="ฟังรูปแบบที่ถูกต้อง"/></>}
    </div>
    <p className="cw-practice-prompt" lang="th">{mode === 'judgement' ? 'ประโยคที่ได้ยิน ครบไหม?' : 'เลือกความหมายที่ได้ยิน'}</p>
    <div className="cw-answers" role="group" aria-label="คำตอบ">{question.choices.map((choice, index) => <button key={index} disabled={!listened || answer !== null} aria-pressed={answer === index} className={answer !== null ? (index === question.correct ? 'is-correct' : answer === index ? 'is-wrong' : '') : ''} onClick={() => setAnswer(index)} lang="th">{mode === 'judgement' && <span className="cw-answer-mark" aria-hidden="true">{index === 0 ? '✓' : '×'}</span>}<span>{choice}</span>{answer !== null && index === question.correct && <Icon name="check"/>}</button>)}</div>
    <p className="cw-answer-feedback" role="status" lang="th">{answer !== null ? answer === question.correct ? 'ถูกต้อง' : 'ยังไม่ถูก · ดูคำตอบที่มีเครื่องหมาย ✓' : '\u00a0'}</p>
  </div>
}

function Practice() {
  const [mode, setMode] = useState<PracticeMode>('judgement')
  const [index, setIndex] = useState(0)
  const questions = mode === 'judgement' ? judgementPractice : meaningPractice
  return <><Heading page="practice"/><div className="cw-segments cw-practice-modes" aria-label="กิจกรรม">{(['judgement', 'meaning'] as const).map(value => <button key={value} aria-pressed={mode === value} lang="th" onClick={() => { setMode(value); setIndex(0) }}>{value === 'judgement' ? 'ถูกหรือผิด' : 'เลือกความหมาย'}</button>)}</div><PracticeRound key={`${mode}-${index}`} question={questions[index]} mode={mode}/><nav className="cw-question-nav" aria-label="เลือกคำถาม">{questions.map((question, i) => <button key={question.id} aria-label={`คำถาม ${i + 1}`} aria-current={i === index ? 'step' : undefined} onClick={() => setIndex(i)}>{i + 1}</button>)}</nav></>
}

function Review({ word }: { word: HolidayWord }) {
  return <><Heading page="review">จำรูปแบบ แล้วเปลี่ยนแค่คำท้าย</Heading><div className="cw-centre"><QuestionExample word={word}/><div className="cw-takeaways" lang="th"><p><strong lang="en">Where</strong><span>ถามว่าที่ไหน</span></p><p><strong lang="en">is the</strong><span>เก็บสองคำนี้ไว้</span></p><p><strong lang="en">{word}</strong><span>เปลี่ยนสิ่งที่ถามหา</span></p></div></div><a className="cw-race-entry" href="/english/race"><Icon name="flag"/><span lang="th">เข้าห้องแข่ง</span><Icon name="arrow"/></a></>
}

export default function Lesson({ page }: { page: LessonPage }) {
  const [word, setWord] = useState<HolidayWord>('hotel')
  return <>{page === 'recall' ? <Recall/> : page === 'idea' ? <Meaning/> : page === 'example' ? <WorkedExample word={word} onWord={setWord}/> : page === 'mistake' ? <Mistake word={word}/> : page === 'practice' ? <Practice/> : <Review word={word}/>}</>
}
