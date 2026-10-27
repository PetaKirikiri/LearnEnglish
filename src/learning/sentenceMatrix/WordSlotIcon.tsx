import { t } from '../../classroom/language'
const icons = ['pin', 'clock', 'mystery-apple', 'apple'] as const
const labels = ['สถานที่', 'เวลา', 'สิ่งไหนหรือของใคร', 'คนหรือสิ่งที่พูดถึง']

export default function WordSlotIcon({slot,plural=false,past=false}:{slot:number;plural?:boolean;past?:boolean}) {
  return <span className={`cw-game-icon cw-game-icon-${plural && slot===1 ? 'clocks' : slot===3 && plural ? 'apples' : icons[slot]}`} role="img" aria-label={past ? `${t(labels[slot])} · ${t('Before')}` : t(slot===3 && plural ? 'หลายสิ่ง' : labels[slot])}>{past && <span className="cw-clock-past" aria-hidden="true"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 9a8 8 0 1 1 0 7M4 9V3m0 6h6"/></svg></span>}</span>
}
