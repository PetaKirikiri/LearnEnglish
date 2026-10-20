import type { PadelPair } from './content'

// Each contrast keeps the event and its court vocabulary stable. Both spoken
// directions are tested; the choices distinguish the question's meaning.
export const questionWordSkills = ['question_identity','question_place_time','question_reason_method','question_duration_number']
export const questionWordNames = ['Who / what','Where / when','Why / how','How long / how many']
type Row = readonly [string,string,string,string]
const identity: readonly Row[] = [
  ['Who is on the court?','What is on the court?','ใครอยู่ในสนาม','อะไรอยู่ในสนาม'],
  ['Who is at reception?','What is at reception?','ใครอยู่ที่แผนกต้อนรับ','อะไรอยู่ที่แผนกต้อนรับ'],
  ['Who is by the gate?','What is by the gate?','ใครอยู่ข้างประตูรั้ว','อะไรอยู่ข้างประตูรั้ว'],
  ['Who is in the changing room?','What is in the changing room?','ใครอยู่ในห้องเปลี่ยนเสื้อผ้า','อะไรอยู่ในห้องเปลี่ยนเสื้อผ้า'],
  ['Who can you see?','What can you see?','คุณเห็นใคร','คุณเห็นอะไร'],
  ['Who do you need?','What do you need?','คุณต้องการใคร','คุณต้องการอะไร'],
  ['Who are you waiting for?','What are you waiting for?','คุณกำลังรอใคร','คุณกำลังรออะไร'],
  ['Who did you find?','What did you find?','คุณเจอใคร','คุณเจออะไร'],
]
const placeTime: readonly Row[] = [
  ['Where is your lesson?','When is your lesson?','คุณเรียนที่ไหน','คุณเรียนเมื่อไหร่'],
  ['Where is the match?','When is the match?','แข่งที่ไหน','แข่งเมื่อไหร่'],
  ['Where can we play?','When can we play?','เราเล่นที่ไหนได้','เราเล่นเมื่อไหร่ได้'],
  ['Where can I pay?','When can I pay?','ฉันจ่ายเงินที่ไหนได้','ฉันจ่ายเงินเมื่อไหร่ได้'],
  ['Where can I hire a racket?','When can I hire a racket?','ฉันเช่าไม้พาเดลที่ไหนได้','ฉันเช่าไม้พาเดลเมื่อไหร่ได้'],
  ['Where do we meet the coach?','When do we meet the coach?','เราเจอโค้ชที่ไหน','เราเจอโค้ชเมื่อไหร่'],
  ['Where do I return the balls?','When do I return the balls?','ฉันต้องคืนลูกบอลที่ไหน','ฉันต้องคืนลูกบอลเมื่อไหร่'],
  ['Where can we book a court?','When can we book a court?','เราจองสนามที่ไหนได้','เราจองสนามเมื่อไหร่ได้'],
]
const reasonMethod: readonly Row[] = [
  ['Why do I book a court?','How do I book a court?','ทำไมฉันต้องจองสนาม','ฉันจองสนามอย่างไร'],
  ['Why do I hire a racket?','How do I hire a racket?','ทำไมฉันต้องเช่าไม้พาเดล','ฉันเช่าไม้พาเดลอย่างไร'],
  ['Why do I pay a deposit?','How do I pay a deposit?','ทำไมฉันต้องจ่ายเงินมัดจำ','ฉันจ่ายเงินมัดจำอย่างไร'],
  ['Why do I change my booking?','How do I change my booking?','ทำไมฉันต้องเปลี่ยนการจอง','ฉันเปลี่ยนการจองอย่างไร'],
  ['Why do I cancel my booking?','How do I cancel my booking?','ทำไมฉันต้องยกเลิกการจอง','ฉันยกเลิกการจองอย่างไร'],
  ['Why do I replace the grip tape?','How do I replace the grip tape?','ทำไมฉันต้องเปลี่ยนเทปพันด้ามไม้','ฉันเปลี่ยนเทปพันด้ามไม้อย่างไร'],
  ['Why do we keep the score?','How do we keep the score?','ทำไมเราต้องนับคะแนน','เรานับคะแนนอย่างไร'],
  ['Why do we warm up?','How do we warm up?','ทำไมเราต้องอบอุ่นร่างกาย','เราอบอุ่นร่างกายอย่างไร'],
]
// Count versus duration needs a different English construction, but never a
// different object or action that could reveal the answer independently.
const durationNumber: readonly Row[] = [
  ['How long do you need the rackets?','How many rackets do you need?','คุณต้องการใช้ไม้พาเดลนานเท่าไหร่','คุณต้องการไม้พาเดลกี่อัน'],
  ['How long do you need the courts?','How many courts do you need?','คุณต้องการใช้สนามนานเท่าไหร่','คุณต้องการสนามกี่สนาม'],
  ['How long can we book the courts?','How many courts can we book?','เราจองสนามได้นานเท่าไหร่','เราจองสนามได้กี่สนาม'],
  ['How long can I hire the rackets?','How many rackets can I hire?','ฉันเช่าไม้พาเดลได้นานเท่าไหร่','ฉันเช่าไม้พาเดลได้กี่อัน'],
  ['How long can we use the balls?','How many balls can we use?','เราใช้ลูกบอลได้นานเท่าไหร่','เราใช้ลูกบอลได้กี่ลูก'],
  ['How long can the players stay?','How many players can stay?','ผู้เล่นอยู่ได้นานเท่าไหร่','ผู้เล่นอยู่ได้กี่คน'],
  ['How long can the coaches teach?','How many coaches can teach?','โค้ชสอนได้นานเท่าไหร่','มีโค้ชที่สอนได้กี่คน'],
  ['How long can we use the lockers?','How many lockers can we use?','เราใช้ตู้ล็อกเกอร์ได้นานเท่าไหร่','เราใช้ตู้ล็อกเกอร์ได้กี่ตู้'],
]
export const questionWordPairs: readonly PadelPair[] = [identity,placeTime,reasonMethod,durationNumber].flatMap((rows,index)=>
  rows.map(([a,b,thaiA,thaiB],i)=>[`questions-${index+1}-${i+1}`,questionWordSkills[index],[a,b],[thaiA,thaiB]] as const))
