import { t } from './language'
const icons = ['pin', 'clock', 'mystery-apple', 'apple'] as const
const labels = ['สถานที่', 'เวลา', 'สิ่งไหนหรือของใคร', 'คนหรือสิ่งที่พูดถึง']

export default function WordSlotIcon({slot,plural=false}:{slot:number;plural?:boolean}) {
  return <span className={`cw-game-icon cw-game-icon-${plural && slot===1 ? 'clocks' : slot===3 && plural ? 'apples' : icons[slot]}`} role="img" aria-label={t(slot===3 && plural ? 'หลายสิ่ง' : labels[slot])}/>
}
