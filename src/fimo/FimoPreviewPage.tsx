import { useEffect, useId, useState, type CSSProperties } from 'react'
import { speakEnglish, stopEnglishSpeech, type SpeechState } from '../learning/speech'
import { pieceArtwork, specimens, translations, type Piece } from './examples'
import './fimo-preview.css'

const prompts = Object.values(specimens).flat().flatMap(example =>
  example.rows.map((row, rowIndex) => ({ example, row, rowIndex })),
)

function RailPiece({ piece, selected, onSelect }: { piece: Piece; selected: boolean; onSelect: () => void }) {
  const id = useId().replaceAll(':', '')
  const shape = 'M20 5H116Q130 5 130 19V47C148 44 148 82 130 79V109Q130 123 116 123H20Q6 123 6 109V79C24 82 24 44 6 47V19Q6 5 20 5Z'
  return <button className={`fimo-piece fimo-${piece.role}`} aria-pressed={selected} aria-label={`About “${piece.word}”`} onClick={onSelect}>
    <span className="fimo-piece-face">
      <svg className="fimo-piece-body" viewBox="0 0 144 128" aria-hidden="true">
        <defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="white" stopOpacity=".30"/><stop offset=".5" stopColor="white" stopOpacity="0"/><stop offset="1" stopColor="#483d32" stopOpacity=".16"/>
        </linearGradient></defs>
        <path className="fimo-piece-pigment" d={shape}/>
        <path fill={`url(#${id})`} d={shape}/>
      </svg>
      <img src={`/images/fimo/${pieceArtwork(piece)}`} alt="" draggable={false}/>
    </span>
    <span className="fimo-word">{piece.word}</span>
  </button>
}

export default function FimoPreviewPage() {
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [answer, setAnswer] = useState<number | null>(null)
  const [playing, setPlaying] = useState(false)
  const [audioError, setAudioError] = useState(false)
  const { example, row, rowIndex } = prompts[index]
  const chosen = selected === null ? null : row.pieces[selected]
  // Counterbalance specimens without changing answer order on rerenders.
  const order = Math.floor(index / 2) % 2 === 0 ? [1, 0] : [0, 1]
  const sentence = row.pieces.map(piece => piece.word).join(' ')

  useEffect(() => {
    const before = document.title
    document.title = 'English Success · FIMO preview'
    return () => { document.title = before; stopEnglishSpeech() }
  }, [])

  function next() {
    stopEnglishSpeech()
    setPlaying(false)
    setAudioError(false)
    setSelected(null)
    setAnswer(null)
    setIndex(current => (current + 1) % prompts.length)
  }

  function play() {
    if (!row.audio) return
    speakEnglish(sentence, `/audio/padel/${row.audio}.wav`, (state: SpeechState) => {
      setPlaying(state === 'playing')
      setAudioError(state === 'blocked')
    })
  }

  return <main className="fimo-studio" aria-label="Translation practice preview">
    <div className="fimo-workspace">
      <section className="fimo-sentence" aria-label={sentence}>
        {row.audio && <button className="fimo-audio" aria-label={`Listen: ${sentence}`} aria-pressed={playing} onClick={play}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M11 4 5 9H2v6h3l6 5 0-16ZM15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/></svg>
        </button>}
        <div className="fimo-rail-scroll"><div className="fimo-rail" style={{ '--piece-count': row.pieces.length } as CSSProperties}>
          {row.pieces.map((piece, i) => <RailPiece key={i} piece={piece} selected={selected === i} onSelect={() => setSelected(selected === i ? null : i)}/>)}
        </div></div>
      </section>
      {chosen && <aside className="fimo-note" aria-live="polite">
        <strong>{chosen.word.replace(/[?.]$/, '')}</strong><span className="fimo-note-role">{chosen.label}</span><span>{chosen.note}</span>
        <button aria-label="Close word detail" onClick={() => setSelected(null)}>×</button>
      </aside>}
      {audioError && <p role="status" className="fimo-audio-error">Audio couldn’t play. Tap the speaker to retry.</p>}
      <div className="fimo-answers" role="group" aria-label="Choose the Thai translation" lang="th">
        {order.map(option => <button key={option} disabled={answer !== null}
          className={`fimo-answer${answer !== null && option === rowIndex ? ' is-correct' : ''}${answer === option && option !== rowIndex ? ' is-wrong' : ''}`}
          onClick={() => { setSelected(null); setAnswer(option) }}>
          {translations[example.title][option]}
          {answer !== null && option === rowIndex && <span aria-hidden="true">✓</span>}
          {answer === option && option !== rowIndex && <span aria-hidden="true">×</span>}
        </button>)}
      </div>
      <div className="fimo-result">{answer !== null && <>
        <span role="status">{answer === rowIndex ? 'Correct' : 'Not quite'}</span>
        <button className="fimo-next" onClick={next}>Next <span aria-hidden="true">→</span></button>
      </>}</div>
    </div>
  </main>
}
