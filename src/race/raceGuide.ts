import { lessonTwoWords, lessonTwoPairs } from '../classroom/lessonTwoContent'
import { racePools } from './pools'
import { meaningChoices } from './meaningChoices'
import { holidayVocabulary } from './holidayVocabulary'
import { tonightWords } from './tonightVocabulary'
import type { ExampleUnit } from '../learning/ExampleLanguage'

export const guideModes = [
  { id: 'where-is-the', label: 'รอบ 1 · ถูก / ไม่ถูก' },
  { id: 'tonight-slots', label: 'เลือกความหมาย · ของฉัน / ของคุณ' },
  { id: 'holiday-meaning', label: 'เลือกความหมาย · สถานที่' },
  {id:'lesson-two-number',label:'is / are'},
  {id:'lesson-two-owner',label:'my / your'},
  {id:'lesson-two-review',label:'ทบทวน'},
] as const
export type GuideExample = { sourceId: string; english: string; units: ExampleUnit[]; thai: string; choices: string[]; correct: number; label: string; explanation: string }
const vocabulary = new Map<string, string>([...holidayVocabulary.map(v => [v.word, v.thai] as [string, string]), ...tonightWords, ...lessonTwoWords.flatMap(v => [[v.singular,v.thai],[v.plural,v.thai]] as [string,string][]), ...lessonTwoPairs.map(v => [v.plural,v.thai] as [string,string])])

// Use the same selected questions and distractor pairing as the race server.
export function raceGuide(stageId: string, questionIds?: string[]) {
  const pool = racePools.find(pool => pool.id === stageId)
  if (!pool || !guideModes.some(mode => mode.id === stageId)) return null
  const selected = pool.questions.filter(q => questionIds === undefined || questionIds.includes(q.id))
  const paired = meaningChoices(selected.map(q => ({ ...q, choices: q.answers.map(answer => answer.map(part => part.text).join('')) })))
  const preferences = stageId.startsWith('lesson-two-') ? (pool.kind === 'judgement' ? ['l2-shoe-the-is','l2-shoes-the-is','l2-shoes-the-are'] : ['l2-owner-shoes-my','l2-owner-shoes-your']) : stageId === 'tonight-slots' ? ['tonight-phone-my', 'tonight-phone-your', 'tonight-hotel-the'] : stageId === 'holiday-meaning' ? ['race-meaning-hotel', 'race-meaning-toilet'] : ['race-where-hotel-complete', 'race-where-hotel-missing-is', 'race-where-hotel-missing-the']
  const examples: GuideExample[] = []
  const candidates = [...preferences.flatMap(id => paired.filter(q => q.id === id)), ...paired]
  const seen = new Set<string>()
  for (const question of candidates) {
    const match = question.english.match(/^Where ((?:is|are) )?(?:(the|my|your) )?(.+)\?$/)
    if (!match) continue
    const [, is, determiner, noun] = match
    const numberExample = stageId.startsWith('lesson-two-')
    const key = numberExample && pool.kind === 'judgement' ? `${question.correct}:${is?.trim()}` : pool.kind === 'judgement' ? is ? determiner ? 'complete' : 'missing-the' : 'missing-is' : `${determiner}:${noun}`
    if (seen.has(key)) continue
    seen.add(key)
    const meaning = vocabulary.get(noun)
    if (!meaning) continue
    const units: ExampleUnit[] = [{ english: 'Where', thai: 'ที่ไหน' }, ...(is ? [{ english: is.trim(), thai: 'อยู่' }] : []), ...(determiner ? [{ english: determiner, thai: determiner === 'my' ? 'ของฉัน' : determiner === 'your' ? 'ของคุณ' : 'ที่กำลังพูดถึง' }] : []), { english: `${noun}?`, thai: meaning }]
    const thai = numberExample && pool.kind === 'meaning' ? question.choices[question.correct] : `${meaning}${determiner === 'my' ? 'ของฉัน' : determiner === 'your' ? 'ของคุณ' : ''}อยู่ที่ไหน`
    const judgement = pool.kind === 'judgement'
    examples.push({ sourceId: question.id, english: question.english, units, thai: judgement && question.correct !== 0 ? numberExample ? 'เลือก is / are ให้ตรงกับจำนวน' : 'ประโยคนี้ยังไม่ครบ' : thai,
      choices: judgement ? ['ถูกต้อง', 'ไม่ถูกต้อง'] : question.choices, correct: question.correct,
      label: numberExample && judgement ? question.correct === 0 ? 'จำนวนตรงกัน' : 'จำนวนไม่ตรงกัน' : judgement ? key === 'complete' ? 'ครบทุกส่วน' : key === 'missing-is' ? 'ขาดคำเชื่อม' : 'ขาดคำหน้าคำนาม' : 'เลือกความหมายให้ตรงกัน',
      explanation: numberExample && judgement ? 'สิ่งเดียวใช้ is · หลายสิ่งใช้ are · my / your ไม่ได้บอกจำนวน' : judgement ? key === 'complete' ? 'ประโยคครบทั้งสี่ส่วน' : key === 'missing-is' ? 'ช่องที่สองหายไป ต้องมีคำเชื่อมก่อนคำหน้าคำนาม' : 'ช่องที่สามหายไป ต้องมีคำหน้าคำนามในรูปแบบนี้' : `คำตอบต้องหมายถึง “${thai}”` })
    if (!judgement && question.meaningDistractor && !question.choices.includes(question.meaningDistractor)) examples.push({ ...examples[examples.length - 1], choices: [question.choices[question.correct], question.meaningDistractor], correct: 0,
      label: determiner === 'my' || determiner === 'your' ? 'สิ่งเดียวกัน แต่เป็นของใคร?' : 'ถามที่ไหน หรือถามอย่างอื่น?',
      explanation: determiner === 'my' ? 'ของฉัน = ของคนพูด อย่าสลับกับของคนที่เราพูดด้วย' : determiner === 'your' ? 'ของคุณ = ของคนที่เราพูดด้วย อย่าสลับกับของคนพูด' : 'คำถามนี้ถามตำแหน่ง ไม่ได้ถามราคา หรือถามว่าอยู่ที่นี่ใช่ไหม' })
    if (seen.size >= (judgement ? 3 : 2)) break
  }
  return { examples, judgement: pool.kind === 'judgement', questionCount: selected.length, hasAudio: selected.length > 0 && selected.every(q => !!q.audioUrl), words: [...new Set(selected.map(q => q.english.match(/(?:the|my|your) (.+)\?$/)?.[1]).filter((word): word is string => !!word))] }
}
