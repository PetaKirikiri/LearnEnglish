import { useRef, useState } from 'react'
import ExampleLanguage from '../learning/ExampleLanguage'
import { holidayVocabulary, type HolidayWord } from './holidayVocabulary'

export function QuestionExample({ word, emphasis = 'noun' }: { word: HolidayWord; emphasis?: 'noun' | 'frame' }) {
  const item = holidayVocabulary.find(item => item.word === word)!
  return <ExampleLanguage
    english={emphasis === 'noun' ? `Where is the **${word}?**` : `Where **is the** ${word}?`}
    thai={`${item.thai}อยู่ที่ไหน`}
    units={[{ english: 'Where', thai: 'ที่ไหน' }, { english: 'is', thai: 'อยู่' }, { english: 'the', thai: 'ที่กำลังพูดถึง' }, { english: `${word}?`, thai: item.thai }]}
  />
}

function ListenIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4V9Zm12-1a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/></svg>
}

export function HolidayWordExplorer() {
  const [word, setWord] = useState<HolidayWord>('hotel')
  const [error, setError] = useState('')
  const audio = useRef<HTMLAudioElement>(null)
  function listen() {
    if (!audio.current) return
    setError(''); audio.current.src = `/audio/race-holiday/${word}-complete.wav`
    void audio.current.play().catch(() => setError('เล่นเสียงไม่ได้ ลองกดอีกครั้ง'))
  }
  return <div contentEditable={false}>
    <audio ref={audio}/>
    <div className="rl-vocabulary" aria-label="เลือกคำในประโยค">{holidayVocabulary.map(item => <button key={item.word} aria-pressed={word === item.word} onClick={() => { setWord(item.word); audio.current?.pause(); setError('') }}><span lang="en">{item.word}</span><span>{item.thai}</span><i aria-hidden="true">{word === item.word ? '✓' : '+'}</i></button>)}</div>
    <div className="rl-example rl-changing" aria-live="polite"><QuestionExample word={word}/><button className="rl-listen" onClick={listen} aria-label={`ฟัง Where is the ${word}?`}><ListenIcon/></button></div>
    {error && <p role="alert">{error}</p>}
  </div>
}
