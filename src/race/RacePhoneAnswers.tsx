import { useRef, useState } from 'react'
export default function RacePhoneAnswers({ choices, picked, disabled, onChoose }: { choices: string[]; picked?: number | null; disabled: boolean; onChoose: (choice: number) => void }) {
  const gesture = useRef<{ id: number; x: number; y: number } | null>(null)
  const dragged = useRef(false)
  const [offset, setOffset] = useState(0)
  const yes = choices.findIndex(choice => /^correct$/i.test(choice))
  const no = choices.findIndex(choice => /^(wrong|incorrect)$/i.test(choice))
  const swipeable = choices.length === 2 && yes >= 0 && no >= 0
  return <div className={`race-answers${swipeable ? ' race-swipe-answers' : ''}`} style={offset ? { transform: `translateX(${Math.max(-70, Math.min(70, offset))}px) rotate(${offset / 45}deg)` } : undefined}
    onPointerDown={event => {
      if (!swipeable || disabled || !event.isPrimary || event.button !== 0) return
      dragged.current = false
      gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY }
    }}
    onPointerMove={event => {
      const start = gesture.current
      if (!start || start.id !== event.pointerId) return
      const dx = event.clientX - start.x, dy = event.clientY - start.y
      if (Math.abs(dy) > 18 && Math.abs(dy) > Math.abs(dx)) { gesture.current = null; setOffset(0); return }
      if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) * 1.4) {
        dragged.current = true
        event.currentTarget.setPointerCapture(event.pointerId)
        setOffset(dx)
      }
    }}
    onPointerUp={event => {
      const start = gesture.current
      gesture.current = null; setOffset(0)
      if (!start || start.id !== event.pointerId || disabled) return
      const dx = event.clientX - start.x, dy = event.clientY - start.y
      if (Math.abs(dx) >= 55 && Math.abs(dx) > Math.abs(dy) * 1.4) {
        dragged.current = true
        onChoose(dx > 0 ? yes : no)
      }
    }}
    onPointerCancel={() => { gesture.current = null; dragged.current = true; setOffset(0) }}
    onClickCapture={event => { if (dragged.current && event.detail !== 0) { event.preventDefault(); event.stopPropagation() } }}
  >{swipeable && <div className="race-swipe-directions" lang="th"><span>← ไม่ถูกต้อง</span><span>ถูกต้อง →</span></div>}{choices.map((choice, i) => {
    const judgement = /^(correct|wrong|incorrect)$/i.test(choice)
    const positive = /^correct$/i.test(choice)
    return <button key={i} className={`${judgement ? `race-judgement ${positive ? 'is-yes' : 'is-no'}` : `race-meaning answer-${i + 1}`}${picked === i ? ' is-picked' : ''}`} aria-pressed={picked === i} disabled={disabled} onClick={() => onChoose(i)}>
      {judgement && <img className="race-answer-art" src={positive ? '/images/race/answer-correct-v2.png' : '/images/race/answer-wrong-v2.png'} alt="" aria-hidden="true"/>}
      <span lang="th">{judgement ? positive ? 'ถูกต้อง' : 'ไม่ถูกต้อง' : choice}</span>
      {!judgement && <b className="race-choice-badge" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 11a8 8 0 0 1-8 8H5l-3 3V11a9 9 0 0 1 18 0Z"/></svg>{i + 1}</b>}
    </button>
  })}</div>
}
