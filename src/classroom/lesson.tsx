import { LanguageSwitch } from './LanguageSwitch'
import { useLanguage, t } from './language'
import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import ExampleLanguage from '../learning/ExampleLanguage'
import { QuestionExample } from '../race/RaceLessonExamples'
import { holidayVocabulary, type HolidayWord } from '../race/holidayVocabulary'
import Icon from '../ui/Icon'
import SentenceLine from './SentenceLine'
import ClassroomRace from './ClassroomRace'
import { lessonTitles } from './lessonOne'
import type { LessonPage } from './lessonOne'
import '../learning/sentenceSlotBuilder.css'
import './lesson.css'



function Heading({ page, children }: { page: LessonPage; children?: ReactNode }) {
  return <header className="lesson-heading cw-heading"><p className="cw-lesson-label">01 <span/> Where is the…?</p><h1 id="note-title">{t(lessonTitles[page])}</h1>{children && <p className="lead">{children}</p>}</header>
}

function PanelHeader({ page, action }: { page: LessonPage; action?: ReactNode }) {
  return <header className="cw-panel-header"><span className="cw-panel-lesson">{t('Lesson 01')}</span><div className="cw-panel-header-main"><h1 id="note-title">{t(lessonTitles[page])}</h1>{action}</div></header>
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
  return <div className="cw-audio"><audio ref={audio} src={src} preload="none" onPlay={() => setPlaying(true)} onEnded={() => setPlaying(false)} onPause={() => setPlaying(false)}/><button className={`cw-sound${playing ? ' is-playing' : ''}`} onClick={() => void play()} aria-label={t(label)}><Icon name="sound"/><span>{t(label)}</span></button>{error && <p role="alert">{t('เล่นเสียงไม่ได้ ลองกดอีกครั้ง')}</p>}</div>
}

function Recall({ word, onWord }: { word: HolidayWord; onWord: (word: HolidayWord) => void }) {
  return <div className="cw-sentence-panel"><PanelHeader page="recall"/><div className="cw-sentence-workspace"><SentenceLine word={word} onWord={onWord} audio={<Sound key={word} src={`/audio/race-holiday/${word}-complete.wav`}/>}/></div></div>
}

function Meaning({ word, onWord }: { word: HolidayWord; onWord: (word: HolidayWord) => void }) {
  return <div className="cw-sentence-panel"><PanelHeader page="idea"/><div className="cw-sentence-workspace"><SentenceLine word={word} onWord={onWord} audio={<Sound key={word} src={`/audio/race-holiday/${word}-complete.wav`}/>}/></div></div>
}

function WorkedExample({ word, onWord }: { word: HolidayWord; onWord: (word: HolidayWord) => void }) {
  return <div className="cw-sentence-panel"><PanelHeader page="example"/><div className="cw-sentence-workspace"><SentenceLine word={word} onWord={onWord} audio={<Sound key={word} src={`/audio/race-holiday/${word}-complete.wav`}/>}/></div></div>
}

function Mistake({ word }: { word: HolidayWord }) {
  const [missing, setMissing] = useState<'complete' | 'missing-is' | 'missing-the'>('missing-is')
  const item = holidayVocabulary.find(item => item.word === word)!
  const units = [{ english: 'Where', thai: 'ที่ไหน' }, { english: 'is', thai: 'อยู่' }, { english: 'the', thai: 'ที่กำลังพูดถึง' }, { english: `${word}?`, thai: item.thai }].filter(unit => !((missing === 'missing-is' && unit.english === 'is') || (missing === 'missing-the' && unit.english === 'the')))
  return <><Heading page="mistake">{t('ในรูปแบบนี้ ต้องมีทั้ง')} <span lang="en">is</span> {t('และ')} <span lang="en">the</span></Heading><div className={`cw-centre cw-${missing}`}><ExampleLanguage matrix english={units.map(unit => unit.english).join(' ')} thai={`${item.thai}อยู่ที่ไหน`} units={units}/><Sound key={`${word}-${missing}`} src={`/audio/race-holiday/${word}-${missing}.wav`}/><p className={`cw-pattern-feedback ${missing === 'complete' ? 'is-complete' : ''}`} role="status">{missing === 'complete' ? t('✓ ครบทั้งสี่ส่วน') : `${t('ยังขาด')} ${missing === 'missing-is' ? 'is' : 'the'}`}</p></div><div className="cw-segments" aria-label={t('เปรียบเทียบรูปแบบ')}>{(['complete', 'missing-is', 'missing-the'] as const).map(variant => <button key={variant} aria-pressed={missing === variant} onClick={() => setMissing(variant)}>{variant === 'complete' ? t('ครบทุกคำ') : `${t('ไม่มี')} ${variant === 'missing-is' ? 'is' : 'the'}`}</button>)}</div></>
}

function Review({ word }: { word: HolidayWord }) {
  return <><Heading page="review">{t('จำรูปแบบ แล้วเปลี่ยนแค่คำท้าย')}</Heading><div className="cw-centre"><QuestionExample word={word}/><div className="cw-takeaways"><p><strong lang="en">Where</strong><span>{t('ถามว่าที่ไหน')}</span></p><p><strong lang="en">is the</strong><span>{t('เก็บสองคำนี้ไว้')}</span></p><p><strong lang="en">{word}</strong><span>{t('เปลี่ยนสิ่งที่ถามหา')}</span></p></div></div><a className="cw-race-entry" href="/english/race"><Icon name="flag"/><span>{t('เข้าห้องแข่ง')}</span><Icon name="arrow"/></a></>
}

export default function Lesson({ page }: { page: LessonPage }) {
  const language = useLanguage()
  const [word, setWord] = useState<HolidayWord>('hotel')
  return <div lang={language} style={{display:'contents'}}><LanguageSwitch/>{page === 'recall' ? <Recall word={word} onWord={setWord}/> : page === 'idea' ? <Meaning word={word} onWord={setWord}/> : page === 'example' ? <WorkedExample word={word} onWord={setWord}/> : page === 'mistake' ? <Mistake word={word}/> : page === 'practice' ? <ClassroomRace/> : <Review word={word}/>}</div>
}
