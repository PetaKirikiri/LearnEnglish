import type { HotelQuestion } from '../hotel/course'

type Pair = [string,string,string,string]
export const introductionNodes = [
  {id:'meeting-names',skill:'meeting_names',title:'Introducing yourself',frames:['My name is [name]','I’m [name]','What is your name?'],focus:['my','your','his','her','i\'m','you\'re'],bridge:'Listen for whose name it is. The same name appears in both choices; recognising the name alone cannot answer the question.'},
  {id:'meeting-origins',skill:'meeting_origins',title:'Where you’re from',frames:['I’m from [place]','Where are you from?','Where is she from?'],focus:['i\'m','you\'re','he\'s','she\'s','we','they','you','she','he'],bridge:'Keep the place the same and listen for who comes from there. In questions, are goes with you and is goes with he or she.'},
  {id:'meeting-people',skill:'meeting_people',title:'Introducing people',frames:['This is [name]','He’s my [relationship]','She’s our [relationship]'],focus:['this','that','he\'s','she\'s','my','your','our','their'],bridge:'Notice who is being introduced and their relationship to the speaker. Names and relationship words remain stable between choices.'},
  {id:'meeting-belongings',skill:'meeting_belongings',title:'Your everyday things',frames:['This is my [thing]','Is this your [thing]?','That is her [thing]'],focus:['my','your','his','her','our','their','this','that'],bridge:'The object stays the same. Listen for whose it is, and whether the speaker is telling you or asking you.'},
]

// Each pair holds names, places and objects steady. The learner must listen
// to the person, relationship or question, rather than spot a different noun.
const pairs:Pair[][] = [
  [
    ['My name is Nam.','Your name is Nam.','ฉันชื่อน้ำ','คุณชื่อน้ำ'],
    ["I'm David.","You're David.",'ฉันคือเดวิด','คุณคือเดวิด'],
    ['His name is Sam.','Her name is Sam.','เขาชื่อแซม','เธอชื่อแซม'],
    ['What is your name?','What is her name?','คุณชื่ออะไร','เธอชื่ออะไร'],
    ['What is his name?','What is your name?','เขาชื่ออะไร','คุณชื่ออะไร'],
    ['My name is David.','Your name is David.','ฉันชื่อเดวิด','คุณชื่อเดวิด'],
    ["I'm Nam.","You're Nam.",'ฉันคือน้ำ','คุณคือน้ำ'],
    ['Her name is Alex.','His name is Alex.','เธอชื่ออเล็กซ์','เขาชื่ออเล็กซ์'],
  ],
  [
    ["I'm from Thailand.","You're from Thailand.",'ฉันมาจากประเทศไทย','คุณมาจากประเทศไทย'],
    ["He's from France.","She's from France.",'เขามาจากประเทศฝรั่งเศส','เธอมาจากประเทศฝรั่งเศส'],
    ['Where are you from?','Where is she from?','คุณมาจากที่ไหน','เธอมาจากที่ไหน'],
    ['We are from Bangkok.','They are from Bangkok.','พวกเรามาจากกรุงเทพฯ','พวกเขามาจากกรุงเทพฯ'],
    ['Where is he from?','Where are you from?','เขามาจากที่ไหน','คุณมาจากที่ไหน'],
    ["I'm from France.","You're from France.",'ฉันมาจากประเทศฝรั่งเศส','คุณมาจากประเทศฝรั่งเศส'],
    ["She's from Thailand.","He's from Thailand.",'เธอมาจากประเทศไทย','เขามาจากประเทศไทย'],
    ['They are from Samui.','We are from Samui.','พวกเขามาจากสมุย','พวกเรามาจากสมุย'],
  ],
  [
    ['This is Nam.','That is Nam.','นี่คือน้ำ','นั่นคือน้ำ'],
    ["He's my friend.","She's my friend.",'เขาเป็นเพื่อนของฉัน','เธอเป็นเพื่อนของฉัน'],
    ["She's our coach.","She's their coach.",'เธอเป็นโค้ชของพวกเรา','เธอเป็นโค้ชของพวกเขา'],
    ['This is my friend.','This is your friend.','นี่คือเพื่อนของฉัน','นี่คือเพื่อนของคุณ'],
    ["He's your coach.","He's my coach.",'เขาเป็นโค้ชของคุณ','เขาเป็นโค้ชของฉัน'],
    ['This is David.','That is David.','นี่คือเดวิด','นั่นคือเดวิด'],
    ["She's their friend.","He's their friend.",'เธอเป็นเพื่อนของพวกเขา','เขาเป็นเพื่อนของพวกเขา'],
    ['This is our friend.','This is their friend.','นี่คือเพื่อนของพวกเรา','นี่คือเพื่อนของพวกเขา'],
  ],
  [
    ['This is my racket.','This is your racket.','นี่คือไม้แร็กเกตของฉัน','นี่คือไม้แร็กเกตของคุณ'],
    ['Is this your bag?','Is this my bag?','นี่คือกระเป๋าของคุณใช่ไหม','นี่คือกระเป๋าของฉันใช่ไหม'],
    ['That is her phone.','That is his phone.','นั่นคือโทรศัพท์ของเธอ','นั่นคือโทรศัพท์ของเขา'],
    ['This is our ball.','This is their ball.','นี่คือลูกบอลของพวกเรา','นี่คือลูกบอลของพวกเขา'],
    ['Is that your racket?','Is this your racket?','นั่นคือไม้แร็กเกตของคุณใช่ไหม','นี่คือไม้แร็กเกตของคุณใช่ไหม'],
    ['This is my phone.','This is your phone.','นี่คือโทรศัพท์ของฉัน','นี่คือโทรศัพท์ของคุณ'],
    ['Is this her bag?','Is this his bag?','นี่คือกระเป๋าของเธอใช่ไหม','นี่คือกระเป๋าของเขาใช่ไหม'],
    ['That is our racket.','That is their racket.','นั่นคือไม้แร็กเกตของพวกเรา','นั่นคือไม้แร็กเกตของพวกเขา'],
  ],
]

export function introductionQuestions():HotelQuestion[] {
  return introductionNodes.flatMap((node,index)=>pairs[index].flatMap((pair,i)=>pair.slice(0,2).map((english,side)=>({
    id:`hotel-g3-general-introduction-${node.id}-${i+1}-${side+1}`,skill:node.skill,english,correct:side as 0|1,
    audioUrl:`/audio/hotel/hotel-g3-general-introduction-${node.id}-${i+1}-${side+1}.wav`,
    answers:pair.slice(2).map(text=>[{text,skill:node.skill}]) as HotelQuestion['answers'],
    grammar:{kind:'meaning' as const,context:`${node.id}-${i+1}`,phase:i<5?'practice' as const:'transfer' as const,targets:node.focus,contrast:pair[1-side],explanation:'ชื่อ สถานที่ และสิ่งของเหมือนกันทั้งสองตัวเลือก ให้ฟังว่าเป็นใคร หรือเป็นของใคร แล้วเทียบความหมายของทั้งประโยค',domain:'Leisure' as const,sequenceTier:0},
  }))))
}

export const introductionGlosses:Record<string,string>={
  nam:'น้ำ (ชื่อคน)',david:'เดวิด (ชื่อคน)',sam:'แซม (ชื่อคน)',alex:'อเล็กซ์ (ชื่อคน)',
  thailand:'ประเทศไทย',france:'ประเทศฝรั่งเศส',bangkok:'กรุงเทพฯ',samui:'สมุย',
  "i'm":'ฉันเป็น / ฉันคือ (I am)',"you're":'คุณเป็น / คุณคือ (you are)',
  "he's":'เขาเป็น / เขาคือ (he is)',"she's":'เธอเป็น / เธอคือ (she is)',
  racket:'ไม้แร็กเกต',coach:'โค้ช',name:'ชื่อ',friend:'เพื่อน',phone:'โทรศัพท์',ball:'ลูกบอล',bag:'กระเป๋า',
}
