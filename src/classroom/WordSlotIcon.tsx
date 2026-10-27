import { t } from './language'
const icons = ['pin', 'clock', 'mystery-apple', 'apple'] as const
const labels = ['สถานที่', 'เวลา', 'สิ่งไหนหรือของใคร', 'คนหรือสิ่งที่พูดถึง']

export default function WordSlotIcon({slot}:{slot:number}) {
  return <span className={`cw-game-icon cw-game-icon-${icons[slot]}`} role="img" aria-label={t(labels[slot])}/>
}
