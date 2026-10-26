import type { HotelQuestion } from '../hotel/course'

// Complete meanings, not noun distractors. The event stays identical within
// each pair; only its participant, polarity or time changes.
type Pair = [string, string, string, string]
export const beginnerNodes = [
  { id: 'first-actions', skill: 'first_actions', title: 'Who is doing it?', frames: ['I am [verb-ing]', 'You are [verb-ing]', 'He / she is [verb-ing]', 'We / they are [verb-ing]', 'I / you / we / they want [thing]', 'He / she wants [thing]', 'I / you / we / they have [thing]', 'He / she has [thing]'], focus: ['i','you','he','she','we','they','am','is','are'], bridge: 'Begin with familiar actions. Keep the action unchanged and listen for who is doing it; English be changes with the subject.' },
  { id: 'first-negatives', skill: 'first_negatives', title: 'Doing it or not?', frames: ['[subject] [be] (not) [verb-ing]', '[subject] do / does not [base verb]'], focus: ['not','do','does'], bridge: 'Keep the person and action fixed. Listen for not; with want and have English uses do / does not rather than placing mai before an unchanged verb.' },
]
const who: Pair[] = [
  ['I am eating.','You are eating.','ฉันกำลังกิน','คุณกำลังกิน'],
  ['I am drinking.','You are drinking.','ฉันกำลังดื่ม','คุณกำลังดื่ม'],
  ['I am talking.','You are talking.','ฉันกำลังพูด','คุณกำลังพูด'],
  ['I am going.','You are going.','ฉันกำลังไป','คุณกำลังไป'],
  ['He is eating.','She is eating.','เขากำลังกิน','เธอกำลังกิน'],
  ['He is drinking.','She is drinking.','เขากำลังดื่ม','เธอกำลังดื่ม'],
  ['We are talking.','They are talking.','พวกเรากำลังพูด','พวกเขากำลังพูด'],
  ['We are going.','They are going.','พวกเรากำลังไป','พวกเขากำลังไป'],
  ['I want water.','You want water.','ฉันต้องการน้ำ','คุณต้องการน้ำ'],
  ['I have water.','You have water.','ฉันมีน้ำ','คุณมีน้ำ'],
  // Held-out combinations: no identical English occurs in supported practice.
  ['He is coming.','She is coming.','เขากำลังมา','เธอกำลังมา'],
  ['We want water.','They want water.','พวกเราต้องการน้ำ','พวกเขาต้องการน้ำ'],
  ['He has water.','She has water.','เขามีน้ำ','เธอมีน้ำ'],
  ['We are coming.','They are coming.','พวกเรากำลังมา','พวกเขากำลังมา'],
]
const negative: Pair[] = [
  ['I am eating.','I am not eating.','ฉันกำลังกิน','ฉันไม่ได้กำลังกิน'],
  ['She is drinking.','She is not drinking.','เธอกำลังดื่ม','เธอไม่ได้กำลังดื่ม'],
  ['They are talking.','They are not talking.','พวกเขากำลังพูด','พวกเขาไม่ได้กำลังพูด'],
  ['We are going.','We are not going.','พวกเรากำลังไป','พวกเราไม่ได้กำลังไป'],
  ['I want water.','I do not want water.','ฉันต้องการน้ำ','ฉันไม่ต้องการน้ำ'],
  ['I have water.','I do not have water.','ฉันมีน้ำ','ฉันไม่มีน้ำ'],
  ['I am coming.','I am not coming.','ฉันกำลังมา','ฉันไม่ได้กำลังมา'],
  ['She is eating.','She is not eating.','เธอกำลังกิน','เธอไม่ได้กำลังกิน'],
  ['You are drinking water.','You are not drinking water.','คุณกำลังดื่มน้ำ','คุณไม่ได้กำลังดื่มน้ำ'],
  ['He is talking.','He is not talking.','เขากำลังพูด','เขาไม่ได้กำลังพูด'],
  ['They have water.','They do not have water.','พวกเขามีน้ำ','พวกเขาไม่มีน้ำ'],
  ['She wants water.','She does not want water.','เธอต้องการน้ำ','เธอไม่ต้องการน้ำ'],
]
const rows: { id: string; skill: string; pair: Pair; phase: 'practice'|'transfer'; focus: string[]; explanation: string }[] = []
for (const [index,node] of beginnerNodes.entries()) {
  for (const [i,pair] of (index === 0 ? who : negative).entries()) rows.push({
    id: `${node.id}-${i+1}`, skill: node.skill, pair, phase: i >= (index===0 ? 10 : 8) ? 'transfer' : 'practice', focus: node.focus,
    explanation: index===0 ? 'การกระทำเหมือนกัน ฟังคำต้นประโยคว่าใครเป็นคนทำ I = ฉัน, you = คุณ, he = เขา, she = เธอ, we = พวกเรา, they = พวกเขา' : 'คนและการกระทำเหมือนเดิม not ทำให้ความหมายเป็นปฏิเสธ เมื่อใช้ want หรือ have จะใช้ do not / does not ตามประธาน',
  })
}
// Reuse the easy actions later, before introducing less familiar action words.
for (const [verb,third,past,ing,thai] of [
  ['eat','eats','ate','eating','กิน'], ['drink','drinks','drank','drinking','ดื่ม'],
  ['talk','talks','talked','talking','พูด'], ['go','goes','went','going','ไป'],
]) {
  const variants: [string,Pair,string[] ,string][] = [
    ['habit_ongoing',[`She ${third}.`,`She is ${ing}.`,`เธอ${thai}เป็นประจำ`,`เธอกำลัง${thai}`],['is'], 'การกระทำเดียวกัน รูปธรรมดาบอกกิจวัตร ส่วน is + -ing บอกว่ากำลังทำ'],
    ['route_past_events',[`She ${past}.`,`She ${third}.`,`เธอ${thai}ไปแล้ว`,`เธอ${thai}เป็นประจำ`],[past,third], 'การกระทำเดียวกัน ฟังรูปกริยาที่บอกว่าเกิดขึ้นแล้ว เทียบกับกิจวัตร'],
    ['future_ongoing',[`She will ${verb}.`,`She is ${ing}.`,`เธอจะ${thai}`,`เธอกำลัง${thai}`],['will','is'], 'will บอกสิ่งที่จะทำ ส่วน is + -ing ในบริบทนี้บอกสิ่งที่กำลังทำ'],
  ]
  for (const [skill,pair,focus,explanation] of variants) rows.push({id:`basic-${skill}-${verb}`,skill,pair,focus,explanation,phase:'practice'})
}
export function beginnerQuestions(): HotelQuestion[] {
  return rows.flatMap(row => row.pair.slice(0,2).map((english,side) => ({
    id:`hotel-g3-general-beginner-${row.id}-${side+1}`, skill:row.skill, english, correct:side as 0|1,
    audioUrl:`/audio/hotel/hotel-g3-general-beginner-${row.id}-${side+1}.wav`,
    answers:row.pair.slice(2).map(text=>[{text,skill:row.skill}]) as HotelQuestion['answers'],
    grammar:{kind:'meaning',context:`beginner-${row.id}`,phase:row.phase,targets:row.focus,contrast:row.pair[1-side],explanation:row.explanation,domain:'Home',sequenceTier:0},
  })))
}

