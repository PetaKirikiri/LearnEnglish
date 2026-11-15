import {getPlaybackRate} from '../../audio/usePlaybackMode'
import PlaybackButtons from '../../audio/PlaybackButtons'
import { useRef, useState } from 'react'
import { useLocationMatrix } from './useLocationMatrix'
import { locationSentence } from './model'
import ExampleLanguage from './ExampleView'
import { holidayVocabulary, type HolidayWord } from '../../race/holidayVocabulary'

export function QuestionExample({ word, emphasis = 'noun' }: { word: HolidayWord; emphasis?: 'noun' | 'frame' }) {
  const item = holidayVocabulary.find(item => item.word === word)!
  return <ExampleLanguage matrix {...locationSentence(item)} english={emphasis === 'noun' ? `Where is the **${word}?**` : `Where **is the** ${word}?`}/>

}

export function HolidayWordExplorer() {
  const {word,chooseWord:setWord} = useLocationMatrix({id:'holiday',vocabulary:holidayVocabulary,plural:false,initialWord:'hotel'})
  const [error, setError] = useState('')
  const audio = useRef<HTMLAudioElement>(null)
  function listen() {
    if (!audio.current) return
    setError(''); audio.current.src = `/audio/race-holiday/${word}-complete.wav`
    audio.current.playbackRate=getPlaybackRate();audio.current.preservesPitch=true
    void audio.current.play().catch(() => setError('เล่นเสียงไม่ได้ ลองกดอีกครั้ง'))
  }
  return <div contentEditable={false}>
    <audio ref={audio}/>
    <div className="rl-vocabulary" aria-label="เลือกคำในประโยค">{holidayVocabulary.map(item => <button key={item.word} aria-pressed={word === item.word} onClick={() => { setWord(item.word); audio.current?.pause(); setError('') }}><span lang="en">{item.word}</span><span>{item.thai}</span><i aria-hidden="true">{word === item.word ? '✓' : '+'}</i></button>)}</div>
    <div className="rl-example rl-changing" aria-live="polite"><QuestionExample word={word as HolidayWord}/><PlaybackButtons onPlay={listen}/></div>
    {error && <p role="alert">{error}</p>}
  </div>
}
