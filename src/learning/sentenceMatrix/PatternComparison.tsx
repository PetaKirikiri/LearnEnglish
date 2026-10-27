import { useEffect, useRef, useState } from 'react'
import ExampleLanguage from '../ExampleLanguage'
import Icon from '../../ui/Icon'
import { t } from '../../classroom/language'
import { locationSentence, type MatrixLesson } from './model'
function Sound({ src, english, label = 'ฟังประโยค', onPlayed }: { src: string; english?:string; label?: string; onPlayed?: () => void }) {
  const audio = useRef<HTMLAudioElement>(null)
  const [error, setError] = useState(false)
  const [playing, setPlaying] = useState(false)
  useEffect(() => { const player = audio.current; return () => { player?.pause() } }, [])
  async function play() {
    if (!src && english) { window.speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(english); utterance.lang='en-GB'; utterance.rate=.85; window.speechSynthesis.speak(utterance); return }
    const player = audio.current
    if (!player) return
    player.currentTime = 0; setError(false)
    try { await player.play(); onPlayed?.() } catch { setError(true) }
  }
  return <div className="cw-audio"><audio ref={audio} src={src || undefined} preload="none" onPlay={() => setPlaying(true)} onEnded={() => setPlaying(false)} onPause={() => setPlaying(false)}/><button className={`cw-sound${playing ? ' is-playing' : ''}`} onClick={() => void play()} aria-label={t(label)}><Icon name="sound"/><span>{t(label)}</span></button>{error && <p role="alert">{t('เล่นเสียงไม่ได้ ลองกดอีกครั้ง')}</p>}</div>
}

export default function PatternComparison({word,lesson}:{word:string;lesson:MatrixLesson}) {
  const [missing, setMissing] = useState<'complete' | 'missing-is' | 'missing-the'>('missing-is')
  const item = lesson.vocabulary.find(item => item.word === word) ?? lesson.vocabulary[0]
  const units = locationSentence(item).units.filter(unit => !((missing === 'missing-is' && unit.english === 'is') || (missing === 'missing-the' && unit.english === 'the')))
  return <><div className={`cw-centre cw-${missing}`}><ExampleLanguage matrix english={units.map(unit => unit.english).join(' ')} thai={`${item.thai}อยู่ที่ไหน`} units={units}/><Sound key={`${word}-${missing}`} src="" english={units.map(unit => unit.english).join(' ')}/><p className={`cw-pattern-feedback ${missing === 'complete' ? 'is-complete' : ''}`} role="status">{missing === 'complete' ? t('✓ ครบทั้งสี่ส่วน') : `${t('ยังขาด')} ${missing === 'missing-is' ? 'is' : 'the'}`}</p></div><div className="cw-segments" aria-label={t('เปรียบเทียบรูปแบบ')}>{(['complete', 'missing-is', 'missing-the'] as const).map(variant => <button key={variant} aria-pressed={missing === variant} onClick={() => setMissing(variant)}>{variant === 'complete' ? t('ครบทุกคำ') : `${t('ไม่มี')} ${variant === 'missing-is' ? 'is' : 'the'}`}</button>)}</div></>
}
