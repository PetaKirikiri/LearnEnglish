export default function RacePhoneAnswers({ choices, picked, disabled, onChoose }: { choices: string[]; picked?: number | null; disabled: boolean; onChoose: (choice: number) => void }) {
  return <div className="race-answers">{choices.map((choice, i) => {
    const judgement = /^(correct|wrong|incorrect)$/i.test(choice)
    const positive = /^correct$/i.test(choice)
    return <button key={i} className={`${judgement ? `race-judgement ${positive ? 'is-yes' : 'is-no'}` : ''}${picked === i ? ' is-picked' : ''}`} aria-pressed={picked === i} disabled={disabled} onClick={() => onChoose(i)}>
      {judgement && <svg className="race-answer-symbol" viewBox="0 0 64 64" aria-hidden="true"><path d={positive ? 'M12 33 L26 47 L53 17' : 'M17 17 L47 47 M47 17 L17 47'}/></svg>}
      <span lang="th">{judgement ? positive ? 'ถูกต้อง' : 'ไม่ถูกต้อง' : choice}</span>
      {!judgement && <b aria-hidden="true">{i + 1}</b>}
    </button>
  })}</div>
}
