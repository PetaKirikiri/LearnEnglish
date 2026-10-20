import type { PadelPair } from './content'

// Conversation first: both choices must be useful utterances, not mechanical
// who/what substitutions. These authoring notes do not clutter the learner UI.
export const questionWordSkills = ['question_identity','question_place_time','question_reason_method','question_duration_number']
export const questionWordNames = ['People & details','Where & when','Reasons & arrangements','Time & amounts']
type Row = readonly [string,string,string,string,string,string]
const identity: readonly Row[] = [
  ['Who are you playing with?','Who are you playing against?','คุณเล่นคู่กับใคร','คุณเล่นแข่งกับใคร','A player asks about a doubles partner or opponent.','with / against'],
  ['Who booked the court?','Who is booking the court?','ใครจองสนามแล้ว','ใครกำลังจองสนาม','Players establish who made the reservation or is arranging it now.','booked / is booking'],
  ['Who is waiting for the coach?','Who is the coach waiting for?','ใครกำลังรอโค้ช','โค้ชกำลังรอใคร','Reception connects a waiting learner with their coach.','who is waiting / waiting for whom'],
  ['Who should I pay?','Who should pay me?','ฉันควรจ่ายเงินให้ใคร','ใครควรจ่ายเงินให้ฉัน','Players settle a shared court bill: whom to pay or who owes their share.','I / me and payer / recipient'],
  ['What time is your booking?','What day is your booking?','คุณจองไว้กี่โมง','คุณจองไว้วันไหน','Reception locates a reservation by time or day.','what time / what day'],
  ['What do I need to bring?','What do we need to bring?','ฉันต้องนำอะไรมาบ้าง','พวกเราต้องนำอะไรมาบ้าง','A first-time player asks what they or their group should bring.','I / we'],
  ['What is included in the price?','What is not included in the price?','ราคานี้รวมอะไรบ้าง','ราคานี้ไม่รวมอะไรบ้าง','A customer checks what the court or lesson fee covers.','included / not included'],
  ['What do I need to pay for?','What have I paid for?','ฉันต้องจ่ายค่าอะไรบ้าง','ฉันจ่ายค่าอะไรไปแล้วบ้าง','A customer checks outstanding charges or what their payment covered.','need to pay / have paid'],
]
const placeTime: readonly Row[] = [
  ['Where is your lesson?','When is your lesson?','คุณเรียนที่ไหน','คุณเรียนเมื่อไหร่','Reception helps a player find their lesson location or time.','where / when'],
  ['Where is the match?','When is the match?','แข่งที่ไหน','แข่งเมื่อไหร่','A player checks where or when their match takes place.','where / when'],
  ['Where can we play?','When can we play?','เราเล่นที่ไหนได้','เราเล่นเมื่อไหร่ได้','A group asks staff about available courts or playing times.','where / when'],
  ['Where can I pay?','When can I pay?','ฉันจ่ายเงินที่ไหนได้','ฉันจ่ายเงินเมื่อไหร่ได้','A customer asks for the payment location or timing.','where / when'],
  ['Where can we warm up?','When can we warm up?','เราอบอุ่นร่างกายที่ไหนได้','เราอบอุ่นร่างกายเมื่อไหร่ได้','Players ask where or when they may warm up before a session.','where / when'],
  ['Where do we meet the coach?','When do we meet the coach?','เราเจอโค้ชที่ไหน','เราเจอโค้ชเมื่อไหร่','Players arrange the meeting point or time for their lesson.','where / when'],
  ['Where do I return the balls?','When do I return the balls?','ฉันต้องคืนลูกบอลที่ไหน','ฉันต้องคืนลูกบอลเมื่อไหร่','A customer checks where or when to return borrowed equipment.','where / when'],
  ['Where can we book a court?','When can we book a court?','เราจองสนามที่ไหนได้','เราจองสนามเมื่อไหร่ได้','Players ask where to book or when bookings open.','where / when'],
]
const reasonMethod: readonly Row[] = [
  ['Why do I need to pay a deposit?','When do I need to pay a deposit?','ทำไมฉันต้องจ่ายเงินมัดจำ','ฉันต้องจ่ายเงินมัดจำเมื่อไหร่','A customer asks the reason for a deposit or its deadline.','why / when'],
  ['Why is the court closed?','Why is the court still closed?','ทำไมสนามถึงปิด','ทำไมสนามถึงยังปิดอยู่','A player asks about a closure or a court that has not reopened.','closed / still closed'],
  ['Why do we need to wait here?','How long do we need to wait here?','ทำไมเราต้องรอที่นี่','เราต้องรอที่นี่นานแค่ไหน','Players ask staff the reason for a wait or its duration.','why / how long'],
  ['Why do we warm up?','How do we warm up?','ทำไมเราต้องอบอุ่นร่างกาย','เราอบอุ่นร่างกายอย่างไร','Beginners ask a coach about the purpose or method of warming up.','why / how'],
  ['How do I change my booking?','How do we change our booking?','ฉันเปลี่ยนการจองของฉันอย่างไร','เราเปลี่ยนการจองของเราอย่างไร','A customer asks how to change their own or their group reservation.','I / my versus we / our'],
  ['How can I pay?','How can she pay?','ฉันชำระเงินได้อย่างไรบ้าง','เธอชำระเงินได้อย่างไรบ้าง','A customer asks about payment methods for themselves or a companion.','I / she'],
  ['How do I book a court?','How do I book another court?','ฉันจองสนามอย่างไร','ฉันจองสนามเพิ่มอีกหนึ่งสนามอย่างไร','An organiser asks how to book a court or add another for their group.','a / another'],
  ['How do I get a refund?','When do I get a refund?','ฉันขอรับเงินคืนได้อย่างไร','ฉันจะได้รับเงินคืนเมื่อไหร่','After a cancellation, a customer asks about the refund process or timing.','how / when'],
]
const durationNumber: readonly Row[] = [
  ['How long do you need the rackets?','How many rackets do you need?','คุณต้องการใช้ไม้พาเดลนานเท่าไหร่','คุณต้องการไม้พาเดลกี่อัน','Reception confirms equipment hire duration or quantity.','how long / how many'],
  ['How long do you need the courts?','How many courts do you need?','คุณต้องการใช้สนามนานเท่าไหร่','คุณต้องการสนามกี่สนาม','Reception asks an organiser for booking duration or court count.','how long / how many'],
  ['How long can we book the courts for?','How many courts can we book?','เราจองสนามได้นานเท่าไหร่','เราจองสนามได้กี่สนาม','An organiser checks booking duration or the number of courts.','how long / how many'],
  ['How long can I hire the rackets for?','How many rackets can I hire?','ฉันเช่าไม้พาเดลได้นานเท่าไหร่','ฉันเช่าไม้พาเดลได้กี่อัน','A customer asks about equipment hire duration or quantity.','how long / how many'],
  ['How many players are arriving?','How many players have arrived?','มีผู้เล่นกำลังมากี่คน','มีผู้เล่นมาถึงแล้วกี่คน','Staff coordinate an incoming group or count players already checked in.','are arriving / have arrived'],
  ['How long can we play?','How often can we play?','เราเล่นได้นานแค่ไหน','เราเล่นได้บ่อยแค่ไหน','Players check session length or how often they can play under a package.','how long / how often'],
  ['How many lessons have you booked?','How many lessons will you book?','คุณจองบทเรียนไว้แล้วกี่ครั้ง','คุณจะจองบทเรียนกี่ครั้ง','Reception checks existing lessons or plans a future package.','have booked / will book'],
  ['How long can we use the lockers?','How many lockers can we use?','เราใช้ตู้ล็อกเกอร์ได้นานเท่าไหร่','เราใช้ตู้ล็อกเกอร์ได้กี่ตู้','A group checks locker access duration or quantity.','how long / how many'],
]

const rows = [identity,placeTime,reasonMethod,durationNumber].flatMap((group,index) =>
  group.map(([a,b,thaiA,thaiB,scenario,target],i) => ({
    // New IDs prevent old mastery and cached audio standing in for changed
    // questions. Unchanged questions retain their original IDs and progress.
    id: `questions-${index+1}-${i+1}${index===0 || index===2 || index===1&&i===4 || index===3&&[2,3,4,5,6].includes(i) ? '-v2' : ''}`,
    skill: questionWordSkills[index], english: [a,b] as const, thai: [thaiA,thaiB] as const, scenario,target,
  })))
export const questionWordPairs: readonly PadelPair[] = rows.map(row => [row.id,row.skill,row.english,row.thai])
export const questionWordReviews = Object.fromEntries(rows.map(({id,scenario,target}) => [id,{scenario,target}]))
