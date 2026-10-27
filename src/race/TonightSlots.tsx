import SentenceSlotBuilder from '../learning/SentenceSlotBuilder'
import './tonightSlots.css'
import { tonightWords } from './tonightVocabulary'
const slots = [
  { label: 'Question', options: [['Where', 'ที่ไหน']] },
  { label: 'Link', options: [['is', 'อยู่']] },
  { label: 'Which one?', options: [['the', 'ที่กำลังพูดถึง'], ['my', 'ของฉัน'], ['your', 'ของคุณ']] },
  { label: 'Vocabulary', options: tonightWords },
] as const

export default function TonightSlots({ values, assessment = false }: { values?: readonly string[]; assessment?: boolean }) {
  return <SentenceSlotBuilder values={values} assessment={assessment} slots={slots} label="Tonight’s sentence slots" group={{ label: 'Subject', start: 2, end: 3 }} translation={(parts, selected) => `${parts[3][1]}${selected[2] === 1 ? 'ของฉัน' : selected[2] === 2 ? 'ของคุณ' : ''}อยู่ที่ไหน`}/>
}
