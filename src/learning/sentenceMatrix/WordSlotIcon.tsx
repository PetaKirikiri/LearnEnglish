import { t } from '../../classroom/language'
import TenseTimeline, { type TimelineTense } from './TenseTimeline'
import './tenseTimeline.css'

const icons = ['pin', 'clock', 'mystery-apple', 'apple'] as const
const labels = ['Location', 'Time', 'Which one or whose', 'Thing'] as const

export default function WordSlotIcon({ slot, word, plural = false, past = false, tense }: {
  slot: number; word?:string; plural?: boolean; past?: boolean; tense?: TimelineTense
}) {
  if(slot===2 && word && ['my','your','his','her','our','their'].includes(word.toLowerCase()))return <img className="cw-game-icon" src={`/classroom/icons/ownership/${word.toLowerCase()}.png?v=ownership-two-arms-2`} alt={word} draggable={false}/>
  if (slot === 1) {
    const time = tense ?? (past ? 'past' : 'present')
    return <span className="cw-time-icon" role="img" aria-label={`${t('Time')} · ${time}`}>
      <span className={`cw-game-icon cw-game-icon-${plural ? 'clocks' : 'clock'}`} aria-hidden="true" />
      <TenseTimeline tense={time} />
    </span>
  }
  return <span className={`cw-game-icon cw-game-icon-${slot === 3 && plural ? 'apples' : icons[slot]}`} role="img" aria-label={t(slot === 3 && plural ? 'หลายสิ่ง' : labels[slot])} />
}
