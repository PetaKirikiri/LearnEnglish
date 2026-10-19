import type { HotelQuestion } from '../hotel/course'

// Authored compositional listening content, not random distractor generation.
// Each row supplies the same event to both alternatives; the family changes
// only the intended grammatical relationship. Thai choices are complete meanings.
export type Situation = 'Home'|'Family'|'Food'|'Work'|'Study'|'Shopping'|'Travel'|'Leisure'
type Action = { id:string; domain:Situation; base:string; third:string; past:string; participle:string; ing:string; object:string; thai:string }
const action=(id:string,domain:Situation,forms:string,object:string,thai:string):Action=>{
  const [base,third,past,participle,ing]=forms.split('|')
  return {id,domain,base,third,past,participle,ing,object,thai}
}
export const everydayActions:Action[]=[
  action('door','Home','open|opens|opened|opened|opening','the door','เปิดประตู'),
  action('window','Home','close|closes|closed|closed|closing','the window','ปิดหน้าต่าง'),
  action('clothes','Home','wash|washes|washed|washed|washing','the clothes','ซักเสื้อผ้า'),
  action('floor','Home','clean|cleans|cleaned|cleaned|cleaning','the floor','ทำความสะอาดพื้น'),
  action('chair','Home','repair|repairs|repaired|repaired|repairing','the chair','ซ่อมเก้าอี้'),
  action('table','Home','move|moves|moved|moved|moving','the table','ย้ายโต๊ะ'),
  action('sister','Family','call|calls|called|called|calling','my sister','โทรหาพี่สาวของฉัน'),
  action('parents','Family','visit|visits|visited|visited|visiting','my parents','ไปเยี่ยมพ่อแม่ของฉัน'),
  action('child','Family','help|helps|helped|helped|helping','the child','ช่วยเด็กคนนั้น'),
  action('family','Family','photograph|photographs|photographed|photographed|photographing','the family','ถ่ายรูปครอบครัวนั้น'),
  action('baby','Family','feed|feeds|fed|fed|feeding','the baby','ป้อนอาหารให้ทารก'),
  action('present','Family','wrap|wraps|wrapped|wrapped|wrapping','the present','ห่อของขวัญ'),
  action('dinner','Food','cook|cooks|cooked|cooked|cooking','dinner','ทำอาหารเย็น'),
  action('lunch','Food','prepare|prepares|prepared|prepared|preparing','lunch','เตรียมอาหารกลางวัน'),
  action('cake','Food','bake|bakes|baked|baked|baking','a cake','อบเค้ก'),
  action('rice','Food','order|orders|ordered|ordered|ordering','the rice','สั่งข้าว'),
  action('bread','Food','cut|cuts|cut|cut|cutting','the bread','หั่นขนมปัง'),
  action('cups','Food','collect|collects|collected|collected|collecting','the cups','เก็บถ้วย'),
  action('message','Work','write|writes|wrote|written|writing','the message','เขียนข้อความ'),
  action('email','Work','send|sends|sent|sent|sending','the email','ส่งอีเมล'),
  action('report','Work','check|checks|checked|checked|checking','the report','ตรวจรายงาน'),
  action('meeting','Work','arrange|arranges|arranged|arranged|arranging','the meeting','จัดการประชุม'),
  action('documents','Work','print|prints|printed|printed|printing','the documents','พิมพ์เอกสาร'),
  action('computer','Work','repair|repairs|repaired|repaired|repairing','the computer','ซ่อมคอมพิวเตอร์'),
  action('letter','Study','read|reads|read|read|reading','the letter','อ่านจดหมาย'),
  action('homework','Study','finish|finishes|finished|finished|finishing','the homework','ทำการบ้านให้เสร็จ'),
  action('picture','Study','draw|draws|drew|drawn|drawing','a picture','วาดรูป'),
  action('answer','Study','explain|explains|explained|explained|explaining','the answer','อธิบายคำตอบ'),
  action('name','Study','spell|spells|spelled|spelled|spelling','the name','สะกดชื่อ'),
  action('book','Study','return|returns|returned|returned|returning','the book','คืนหนังสือ'),
  action('shirt','Shopping','buy|buys|bought|bought|buying','the shirt','ซื้อเสื้อเชิ้ต'),
  action('shoes','Shopping','choose|chooses|chose|chosen|choosing','the shoes','เลือกรองเท้า'),
  action('price','Shopping','check|checks|checked|checked|checking','the price','ตรวจราคา'),
  action('groceries','Shopping','carry|carries|carried|carried|carrying','the groceries','ถือของที่ซื้อมา'),
  action('dress','Shopping','return|returns|returned|returned|returning','the dress','คืนชุดเดรส'),
  action('parcel','Shopping','collect|collects|collected|collected|collecting','the parcel','รับพัสดุ'),
  action('ticket','Travel','book|books|booked|booked|booking','the ticket','จองตั๋ว'),
  action('bag','Travel','pack|packs|packed|packed|packing','the bag','จัดกระเป๋า'),
  action('taxi','Travel','call|calls|called|called|calling','the taxi','เรียกแท็กซี่'),
  action('passport','Travel','check|checks|checked|checked|checking','the passport','ตรวจหนังสือเดินทาง'),
  action('map','Travel','study|studies|studied|studied|studying','the map','ศึกษาแผนที่'),
  action('car','Travel','wash|washes|washed|washed|washing','the car','ล้างรถ'),
  action('guitar','Leisure','play|plays|played|played|playing','the guitar','เล่นกีตาร์'),
  action('film','Leisure','watch|watches|watched|watched|watching','the film','ดูภาพยนตร์'),
  action('flowers','Leisure','water|waters|watered|watered|watering','the flowers','รดน้ำดอกไม้'),
  action('bicycle','Leisure','repair|repairs|repaired|repaired|repairing','the bicycle','ซ่อมจักรยาน'),
  action('game','Leisure','start|starts|started|started|starting','the game','เริ่มเกม'),
  action('music','Leisure','record|records|recorded|recorded|recording','the music','บันทึกเสียงดนตรี'),
]
type Subject={en:string;th:string;be:string;was:string;have:string;does:string;singular:boolean}
const subjects:Subject[]=[
  {en:'I',th:'ฉัน',be:'am',was:'was',have:'have',does:'do',singular:false},
  {en:'She',th:'เธอ',be:'is',was:'was',have:'has',does:'does',singular:true},
  {en:'We',th:'พวกเรา',be:'are',was:'were',have:'have',does:'do',singular:false},
  {en:'They',th:'พวกเขา',be:'are',was:'were',have:'have',does:'do',singular:false},
]
type Pair=readonly [string,string,string,string]
type Family={id:string;node:string;skill:string;frames:string[];focus:string[];explanation:string;make:(a:Action,s:Subject)=>Pair}
const phrase=(a:Action,form:keyof Pick<Action,'base'|'third'|'past'|'participle'|'ing'>)=>`${a[form]} ${a.object}`
export const listeningFamilies:Family[]=[
  {id:'routine',node:'routine-now',skill:'habit_ongoing',frames:['[subject] [present verb] [object]','[subject] [be] [verb-ing] [object]'],focus:['am','is','are'],explanation:'รูปปัจจุบันธรรมดาบอกกิจวัตร ส่วน am / is / are + -ing บอกสิ่งที่กำลังทำ ฟังคำช่วยและรูปกริยา ไม่ใช่ชื่อสิ่งของ',make:(a,s)=>[`${s.en} ${phrase(a,s.singular?'third':'base')}.`,`${s.en} ${s.be} ${phrase(a,'ing')}.`,`${s.th}${a.thai}เป็นประจำ`,`${s.th}กำลัง${a.thai}`]},
  {id:'past-event',node:'past-events',skill:'route_past_events',frames:['[subject] [past verb]','[subject] [present verb]'],focus:[],explanation:'ฟังรูปกริยาเพื่อแยกเหตุการณ์ที่เกิดแล้วจากกิจวัตร คนและการกระทำยังเหมือนเดิม',make:(a,s)=>[`${s.en} ${phrase(a,'past')}.`,`${s.en} ${phrase(a,s.singular?'third':'base')}.`,`${s.th}${a.thai}ไปแล้ว`,`${s.th}${a.thai}เป็นประจำ`]},
  {id:'future',node:'future',skill:'future_ongoing',frames:['[subject] will [verb]','[subject] [be] [verb-ing]'],focus:['will','am','is','are'],explanation:'will บอกสิ่งที่จะทำ ส่วน be + -ing ในบริบทนี้บอกสิ่งที่กำลังทำ ทั้งสองตัวเลือกใช้การกระทำเดียวกัน',make:(a,s)=>[`${s.en} will ${phrase(a,'base')}.`,`${s.en} ${s.be} ${phrase(a,'ing')}.`,`${s.th}จะ${a.thai}`,`${s.th}กำลัง${a.thai}`]},
  {id:'completed',node:'completion',skill:'ongoing_finished',frames:['[subject] [have] [participle]','[subject] [be] [verb-ing]'],focus:['have','has','am','is','are'],explanation:'have / has + ช่องสามบอกสิ่งที่ทำไปแล้ว ส่วน be + -ing บอกว่ากำลังทำอยู่',make:(a,s)=>[`${s.en} ${s.have} ${phrase(a,'participle')}.`,`${s.en} ${s.be} ${phrase(a,'ing')}.`,`${s.th}ได้${a.thai}แล้ว`,`${s.th}กำลัง${a.thai}`]},
  {id:'not-now',node:'negation',skill:'negative',frames:['[subject] [be] [verb-ing]','[subject] [be] not [verb-ing]'],focus:['not'],explanation:'ฟัง not ให้ทัน ประโยคหนึ่งบอกว่ากำลังทำ อีกประโยคบอกว่าไม่ได้กำลังทำ คนและกิจกรรมเหมือนกัน',make:(a,s)=>[`${s.en} ${s.be} ${phrase(a,'ing')}.`,`${s.en} ${s.be} not ${phrase(a,'ing')}.`,`${s.th}กำลัง${a.thai}`,`${s.th}ไม่ได้กำลัง${a.thai}`]},
  {id:'ability-duty',node:'obligation',skill:'modal_meaning',frames:['[subject] can [verb]','[subject] must [verb]'],focus:['can','must'],explanation:'can บอกว่าทำได้ ส่วน must บอกว่าต้องทำ ฟังความต่างของคำช่วย ไม่ใช่กริยาหลัก',make:(a,s)=>[`${s.en} can ${phrase(a,'base')}.`,`${s.en} must ${phrase(a,'base')}.`,`${s.th}${a.thai}ได้`,`${s.th}ต้อง${a.thai}`]},
  {id:'past-sequence',node:'past-sequence',skill:'route_past_sequence',frames:['When I arrived, [subject] had [participle]','When I arrived, [subject] [was/were] [verb-ing]'],focus:['had','was','were'],explanation:'เมื่อมีจุดเวลาในอดีต had + ช่องสามคือทำไปก่อนแล้ว ส่วน was / were + -ing คือกำลังทำในตอนนั้น',make:(a)=>[`When I arrived, she had ${phrase(a,'participle')}.`,`When I arrived, she was ${phrase(a,'ing')}.`,`ตอนฉันมาถึง เธอได้${a.thai}แล้ว`,`ตอนฉันมาถึง เธอกำลัง${a.thai}`]},
  {id:'certainty',node:'possibility',skill:'route_possibility',frames:['[subject] may be [verb-ing]','[subject] must be [verb-ing]'],focus:['may','must'],explanation:'may be คืออาจกำลังทำ ส่วน must be ในประโยคนี้คือผู้พูดมั่นใจมากว่าน่าจะกำลังทำ ไม่ใช่คำสั่ง',make:(a,s)=>[`${s.en} may be ${phrase(a,'ing')}.`,`${s.en} must be ${phrase(a,'ing')}.`,`${s.th}อาจกำลัง${a.thai}อยู่`,`ผู้พูดมั่นใจมากว่า${s.th}คงกำลัง${a.thai}อยู่`]},
  {id:'reported',node:'reported',skill:'route_reported',frames:['He said [subject] would [verb]','He said [subject] had [participle]'],focus:['would','had'],explanation:'แยกสิ่งที่ยังจะทำ ณ เวลาที่เล่า กับสิ่งที่ทำไปก่อนเวลาที่เล่า ฟัง would กับ had',make:(a)=>[`He said she would ${phrase(a,'base')}.`,`He said she had ${phrase(a,'participle')}.`,`เขาบอกว่าเธอจะ${a.thai}`,`เขาบอกว่าเธอได้${a.thai}ไปก่อนหน้านั้นแล้ว`]},
  {id:'future-completion',node:'future-completion',skill:'route_future_completion',frames:['When you arrive, [subject] will have [participle]','When you arrive, [subject] will be [verb-ing]'],focus:['have','be'],explanation:'ที่จุดเวลาเดียวกันในอนาคต will have + ช่องสามบอกว่าทำไปแล้ว ส่วน will be + -ing บอกว่าจะกำลังทำอยู่',make:(a)=>[`When you arrive, we will have ${phrase(a,'participle')}.`,`When you arrive, we will be ${phrase(a,'ing')}.`,`ตอนคุณมาถึง พวกเราจะได้${a.thai}ไปแล้ว`,`ตอนคุณมาถึง พวกเราจะกำลัง${a.thai}อยู่`]},
  {id:'past-possibility',node:'nuance',skill:'route_nuance',frames:['[subject] may have [participle]','[subject] should have [participle]'],focus:['may','should'],explanation:'may have คืออาจทำไปแล้ว แต่ should have คือสิ่งที่ควรทำไปแล้ว ไม่ได้ยืนยันว่าทำจริง',make:(a,s)=>[`${s.en} may have ${phrase(a,'participle')}.`,`${s.en} should have ${phrase(a,'participle')}.`,`${s.th}อาจ${a.thai}ไปแล้ว`,`${s.th}ควร${a.thai}ไปแล้ว`]},
  {id:'available-option',node:'professional-response',skill:'route_professional_response',frames:['[subject] can [verb]','[subject] could have [participle]'],focus:['can','could','have'],explanation:'can เป็นทางเลือกที่ทำได้ ส่วน could have + ช่องสามพูดถึงทางเลือกในอดีต ทั้งคนและกิจกรรมไม่เปลี่ยน',make:(a,s)=>[`${s.en} can ${phrase(a,'base')}.`,`${s.en} could have ${phrase(a,'participle')}.`,`${s.th}${a.thai}ได้ในตอนนี้`,`ตอนนั้น${s.th}น่าจะ${a.thai}ได้`]},
]

export type GeneralPair={id:string;node:string;skill:string;domain:Situation;pair:Pair;focus:string[];frames:string[];explanation:string;stage:number}
const pairs:GeneralPair[]=listeningFamilies.flatMap((f,familyIndex)=>everydayActions.map((a,index)=>({
  id:`${f.id}-${a.id}`,node:f.node,skill:f.skill,domain:a.domain,pair:f.make(a,subjects[(index+familyIndex)%subjects.length]),
  focus:f.focus,frames:f.frames,explanation:f.explanation,stage:index%6<2?0:index%6<4?1:2,
})))

function add(id:string,node:string,skill:string,domain:Situation,pair:Pair,focus:string[],frames:string[],explanation:string,stage=0) {
  pairs.push({id,node,skill,domain,pair,focus,frames,explanation,stage})
}

// Role reversals have identical people and verbs, not man-versus-woman guessing.
const interactions:[string,string,string][]=[
  ['called','โทรหา','call'],['helped','ช่วย','help'],['thanked','ขอบคุณ','thank'],['invited','เชิญ','invite'],
  ['followed','เดินตาม','follow'],['met','พบ','meet'],['visited','ไปเยี่ยม','visit'],['welcomed','ต้อนรับ','welcome'],
  ['heard','ได้ยิน','hear'],['saw','เห็น','see'],['asked','ถาม','ask'],['trusted','ไว้ใจ','trust'],
  ['reminded','เตือน','remind'],['photographed','ถ่ายรูป','photograph'],['encouraged','ให้กำลังใจ','encourage'],['understood','เข้าใจ','understand'],
]
for(const [v,th] of interactions) {
  const roles:[string,string,string,string][]=[
    [`She ${v} me.`,`I ${v} her.`,`เธอ${th}ฉัน`,`ฉัน${th}เธอ`],
    [`He ${v} us.`,`We ${v} him.`,`เขา${th}พวกเรา`,`พวกเรา${th}เขา`],
    [`They ${v} her.`,`She ${v} them.`,`พวกเขา${th}เธอ`,`เธอ${th}พวกเขา`],
    [`We ${v} them.`,`They ${v} us.`,`พวกเรา${th}พวกเขา`,`พวกเขา${th}พวกเรา`],
  ]
  roles.forEach((p,i)=>{
    // The original bank already contains these two past-tense call pairs.
    // Use present forms here so the expansion adds different listening items.
    const row:Pair=v==='called'&&i<2
      ?[i===0?'She calls me.':'He calls us.',i===0?'I call her.':'We call him.',`${p[2]}เป็นประจำ`,`${p[3]}เป็นประจำ`]
      :p
    add(`roles-${v}-${i}`,'participants',i%2?'object_forms':'roles','Family',row,['i','me','she','her','he','him','we','us','they','them'],['[subject pronoun] [verb] [object pronoun]'],'ฟังว่าใครทำและใครรับการกระทำ I / she / he / we / they เป็นผู้ทำ ส่วน me / her / him / us / them รับการกระทำ',i>1?1:0)
  })
}

const states:[string,string,Situation][]=[
  ['hungry','หิว','Food'],['thirsty','กระหายน้ำ','Food'],['ready','พร้อม','Work'],['busy','ยุ่ง','Work'],
  ['tired','เหนื่อย','Leisure'],['happy','มีความสุข','Family'],['worried','กังวล','Family'],['late','มาสาย','Travel'],
  ['early','มาก่อนเวลา','Travel'],['at home','อยู่ที่บ้าน','Home'],['at school','อยู่ที่โรงเรียน','Study'],['at work','อยู่ที่ทำงาน','Work'],
  ['in the kitchen','อยู่ในครัว','Home'],['outside','อยู่ข้างนอก','Home'],['in the park','อยู่ในสวนสาธารณะ','Leisure'],['on the train','อยู่บนรถไฟ','Travel'],
  ['free','ว่าง','Leisure'],['asleep','หลับอยู่','Home'],['awake','ตื่นอยู่','Home'],['alone','อยู่คนเดียว','Family'],
]
states.forEach(([en,th,domain],i)=>{
  const s=subjects[i%4]
  add(`state-time-${i}`,'past-state','past_states',domain,[`${s.en} ${s.be} ${en}.`,`${s.en} ${s.was} ${en}.`,`${s.th}${th}ในตอนนี้`,`${s.th}${th}ในตอนนั้น`],['am','is','are','was','were'],['[subject] [be] [state]','[subject] [was/were] [state]'],'ฟังรูปของ be เพื่อแยกตอนนี้กับอดีต คำบอกสภาพไม่เปลี่ยน')
  const negative=/^(อยู่|หลับ|ตื่น)/.test(th)?`ไม่ได้${th}`:`ไม่${th}`
  add(`state-negative-${i}`,'negation','negative',domain,[`${s.en} ${s.be} ${en}.`,`${s.en} ${s.be} not ${en}.`,`${s.th}${th}`,`${s.th}${negative}`],['not'],['[subject] [be] not [state]'],'คำว่า not เปลี่ยนความหมายเป็นปฏิเสธ แม้คำอื่นจะเหมือนกัน')
  add(`state-future-${i}`,'future','future_ongoing',domain,[`${s.en} will be ${en}.`,`${s.en} ${s.was} ${en}.`,`${s.th}จะ${th}`,`${s.th}${th}ในตอนนั้น`],['will','be','was','were'],['[subject] will be [state]','[subject] [was/were] [state]'],'will be พูดถึงภายหน้า ส่วน was / were พูดถึงอดีต')
})

const possessions:[string,string,Situation][]=[
  ['bag','กระเป๋า','Travel'],['book','หนังสือ','Study'],['phone','โทรศัพท์','Family'],['bicycle','จักรยาน','Leisure'],
  ['ticket','ตั๋ว','Travel'],['key','กุญแจ','Home'],['shirt','เสื้อเชิ้ต','Shopping'],['cup','ถ้วย','Food'],
  ['car','รถยนต์','Travel'],['chair','เก้าอี้','Home'],['computer','คอมพิวเตอร์','Work'],['umbrella','ร่ม','Shopping'],
  ['pen','ปากกา','Study'],['coat','เสื้อคลุม','Shopping'],['camera','กล้องถ่ายรูป','Leisure'],['passport','หนังสือเดินทาง','Travel'],
]
possessions.forEach(([en,th,domain],i)=>{
  add(`owner-${en}`,'ownership','possessive_forms',domain,[`This is my ${en}.`,`This is your ${en}.`,`นี่คือ${th}ของฉัน`,`นี่คือ${th}ของคุณ`],['my','your'],['This is [possessive determiner] [noun]'],'my กับ your เปลี่ยนเจ้าของ ไม่ได้เปลี่ยนสิ่งของ')
  add(`owner-independent-${en}`,'ownership','possessive_forms',domain,[`The ${en} is hers.`,`The ${en} is theirs.`,`${th}เป็นของเธอ`,`${th}เป็นของพวกเขา`],['hers','theirs'],['[noun] is [possessive pronoun]'],'hers และ theirs ใช้บอกเจ้าของได้โดยไม่ต้องมีคำนามตามหลัง',1)
  add(`reference-${en}`,'reference','articles',domain,[`This ${en} is mine.`,`That ${en} is mine.`,`${th}อันนี้เป็นของฉัน`,`${th}อันนั้นเป็นของฉัน`],['this','that'],['This / that [noun] is mine'],'this ชี้สิ่งนี้ ส่วน that ชี้สิ่งนั้น ฟังคำชี้เฉพาะ ไม่ใช่ชื่อสิ่งของ')
  const [anchor,anchorTh]=['car','bicycle'].includes(en)?['house','บ้าน']:['table','โต๊ะ']
  add(`location-${en}`,'time-place','prepositions',domain,[`The ${en} is in front of the ${anchor}.`,`The ${en} is behind the ${anchor}.`,`${th}อยู่หน้า${anchorTh}`,`${th}อยู่หลัง${anchorTh}`],['in','front','of','behind'],['[thing] is in front of / behind [thing]'],'ชื่อสิ่งของและจุดอ้างอิงเหมือนกัน แต่ in front of กับ behind เปลี่ยนตำแหน่ง',i>7?1:0)
})

// Requests/questions use the same action and object; only the function or time changes.
everydayActions.slice(0,32).forEach((a,i)=>{
  add(`request-${a.id}`,'request-basics','route_request_basics',a.domain,[`Can I ${phrase(a,'base')}?`,`Can you ${phrase(a,'base')}?`,`ฉันขอ${a.thai}ได้ไหม`,`คุณช่วย${a.thai}ได้ไหม`],['i','you'],['Can I [verb]?','Can you [verb]?'],'Can I ขอทำเอง ส่วน Can you ขอให้อีกฝ่ายทำ',i%3)
  add(`question-time-${a.id}`,'questions','do_support',a.domain,[`Does she ${phrase(a,'base')}?`,`Did she ${phrase(a,'base')}?`,`เธอ${a.thai}เป็นประจำไหม`,`เธอ${a.thai}ไปแล้วหรือยัง`],['does','did'],['Does [subject] [verb]?','Did [subject] [verb]?'],'หลัง does กับ did กริยาหลักเป็นรูปพื้นฐานเหมือนกัน ต้องฟังคำช่วยเพื่อรู้เวลา',i%3)
  add(`sequence-${a.id}`,'sequence','route_sequence',a.domain,[`Please ${phrase(a,'base')} before I arrive.`,`Please ${phrase(a,'base')} after I arrive.`,`กรุณา${a.thai}ก่อนฉันมาถึง`,`กรุณา${a.thai}หลังฉันมาถึง`],['before','after'],['[action] before / after [event]'],'before กับ after บอกลำดับของสองเหตุการณ์ การกระทำทั้งสองเหมือนเดิม',i%3)
})

const comparisons:[string,string,string,string,string,Situation][]=[
  ['bag','กระเป๋า','bigger','ใหญ่','smaller','Shopping'],['shirt','เสื้อเชิ้ต','cheaper','ถูก','more expensive','Shopping'],
  ['train','รถไฟ','faster','เร็ว','slower','Travel'],['book','หนังสือ','longer','ยาว','shorter','Study'],
  ['chair','เก้าอี้','higher','สูง','lower','Home'],['box','กล่อง','heavier','หนัก','lighter','Home'],
  ['street','ถนน','wider','กว้าง','narrower','Travel'],['lesson','บทเรียน','easier','ง่าย','harder','Study'],
  ['room','ห้อง','warmer','อุ่น','colder','Home'],['music','ดนตรี','louder','ดัง','quieter','Leisure'],
  ['car','รถยนต์','older','เก่า','newer','Travel'],['meal','อาหารมื้อ','better','ดี','worse','Food'],
]
// Keep the adjective constant and reverse the compared referents, so both
// alternatives test the relationship rather than different adjective vocabulary.
comparisons.forEach(([noun,th,comparative,meaning],i)=>{
  add(`compare-${noun}`,'comparison','route_comparison',comparisons[i][5],[`This ${noun} is ${comparative} than that one.`,`That ${noun} is ${comparative} than this one.`,`${th}นี้${meaning}กว่า${th}นั้น`,`${th}นั้น${meaning}กว่า${th}นี้`],['this','that'],['This [noun] is [comparative] than that one'],'ฟังว่าสิ่งไหนถูกเปรียบเทียบกับสิ่งไหน คำคุณศัพท์เหมือนกันแต่ this และ that สลับบทบาท',1)
})

const clauses:[string,string,string,string,Situation][]=[
  ['I was tired','I went for a walk','ฉันเหนื่อย','ฉันออกไปเดินเล่น','Leisure'],
  ['It was raining','we stayed at home','ฝนกำลังตก','พวกเราอยู่บ้าน','Home'],
  ['The shop was busy','I waited outside','ร้านคนเยอะ','ฉันรออยู่ข้างนอก','Shopping'],
  ['She was hungry','she cooked dinner','เธอหิว','เธอทำอาหารเย็น','Food'],
  ['The train was late','we called our friends','รถไฟมาช้า','พวกเราโทรหาเพื่อน','Travel'],
  ['He was worried','he called his mother','เขากังวล','เขาโทรหาแม่','Family'],
  ['The book was difficult','I read it again','หนังสืออ่านยาก','ฉันอ่านมันอีกครั้ง','Study'],
  ['The computer was broken','we finished the work','คอมพิวเตอร์เสีย','พวกเราทำงานเสร็จ','Work'],
  ['It was cold','they opened the window','อากาศหนาว','พวกเขาเปิดหน้าต่าง','Home'],
  ['The tickets were expensive','we bought them','ตั๋วราคาแพง','พวกเราซื้อตั๋วเหล่านั้น','Travel'],
  ['The food was spicy','she ate it','อาหารเผ็ด','เธอกินอาหารนั้น','Food'],
  ['He was busy','he helped me','เขายุ่ง','เขาช่วยฉัน','Work'],
]
clauses.forEach(([a,b,ta,tb,domain],i)=>{
  add(`link-${i}`,'simple-links','route_simple_links',domain,[`${a}, and ${b}.`,`${a}, but ${b}.`,`${ta} และ${tb}`,`${ta} แต่${tb}`],['and','but'],['[clause] and / but [clause]'],'and เพิ่มข้อมูล ส่วน but ทำให้ผู้ฟังเข้าใจว่าเป็นความขัดแย้งหรือสิ่งที่ไม่คาด ทั้งสองประโยคพูดถึงเหตุการณ์เดียวกัน',1)
  const clause=a.startsWith('I ')?a:a[0].toLowerCase()+a.slice(1)
  add(`concession-${i}`,'qualification','route_qualification',domain,[`Although ${clause}, ${b}.`,`Because ${clause}, ${b}.`,`แม้ว่า${ta} แต่${tb}`,`เพราะ${ta} ${tb}`],['although','because'],['Although [clause], [clause]','Because [clause], [clause]'],'although บอกความขัดแย้ง ส่วน because บอกสาเหตุ อย่าเดาจากคำที่พูดถึงเหตุการณ์',2)
})

states.forEach(([en,th,domain],i)=>{
  add(`be-question-${i}`,'be-forms','be_agreement',domain,[`I am ${en}.`,`Am I ${en}?`,`ฉัน${th}`,`ฉัน${th}ไหม`],['am','i'],['I am [state]','Am I [state]?'],'คำเหมือนกันแต่ลำดับต่างกัน I am บอกข้อมูล ส่วน Am I ถามข้อมูล ฟังทั้งลำดับและเสียงท้ายประโยค')
  add(`clarify-${i}`,'repair','route_repair',domain,[`Could you tell me whether she is ${en}?`,`Could you tell me why she is ${en}?`,`ช่วยบอกฉันได้ไหมว่าเธอ${th}หรือเปล่า`,`ช่วยบอกฉันได้ไหมว่าทำไมเธอจึง${th}`],['whether','why'],['Could you tell me whether / why [clause]?'],'whether ถามว่าใช่หรือไม่ ส่วน why ถามเหตุผล สิ่งที่พูดถึงเหมือนกัน',2)
})

everydayActions.slice(0,24).forEach((a,i)=>{
  add(`helpers-${a.id}`,'verb-shapes','verb_forms',a.domain,[`She has ${phrase(a,'participle')}.`,`She had ${phrase(a,'participle')}.`,`เธอได้${a.thai}แล้ว โดยมองจากตอนนี้`,`เธอได้${a.thai}แล้ว ก่อนจุดเวลาหนึ่งในอดีต`],['has','had'],['[subject] has / had [participle]'],'กริยาช่องสามเหมือนกัน แต่ has เชื่อมกับปัจจุบัน ส่วน had มองย้อนจากเวลาในอดีต',1)
  add(`nested-time-${a.id}`,'complex-time','route_complex_time',a.domain,[`When you called, she had ${phrase(a,'participle')} as we had planned.`,`When you called, she was ${phrase(a,'ing')} as we had planned.`,`ตอนคุณโทร เธอได้${a.thai}แล้ว ตามที่เราวางแผนไว้`,`ตอนคุณโทร เธอกำลัง${a.thai} ตามที่เราวางแผนไว้`],['had','was',a.participle,a.ing],['When [event], [subject] had [participle] as we had planned','When [event], [subject] was [verb-ing] as we had planned'],'แม้ประโยคยาวขึ้น ต้องฟังว่าการกระทำเกิดไปก่อนแล้วหรือกำลังเกิด ณ เวลาเดียวกัน',2)
  if(i<16) {
    add(`complement-role-${a.id}`,'verb-complements','verb_patterns',a.domain,[`She asked me to ${phrase(a,'base')}.`,`I asked her to ${phrase(a,'base')}.`,`เธอขอให้ฉัน${a.thai}`,`ฉันขอให้เธอ${a.thai}`],['she','me','i','her'],['[subject] asked [person] to [verb]'],'คนหลัง asked เป็นคนที่ถูกขอให้ทำกริยาหลัง to ฟังว่าใครขอใคร',1)
    add(`real-imagined-${a.id}`,'hypothetical','route_hypothetical',a.domain,[`If I have time, I will ${phrase(a,'base')}.`,`If I had time, I would ${phrase(a,'base')}.`,`ถ้าฉันมีเวลา ฉันจะ${a.thai} โดยมองว่าเป็นไปได้จริง`,`สมมติว่าฉันมีเวลา ฉันก็คง${a.thai}`],['have','had','will','would'],['If I have time, I will [verb]','If I had time, I would [verb]'],'have / will เป็นเงื่อนไขที่มองว่าเป็นไปได้ ส่วน had / would ใช้สมมติสถานการณ์ให้ห่างจากความจริง',2)
    add(`imagined-time-${a.id}`,'counterfactual','route_counterfactual',a.domain,[`If I had time, I would ${phrase(a,'base')}.`,`If I had had time, I would have ${phrase(a,'participle')}.`,`สมมติว่าฉันมีเวลาในตอนนี้ ฉันก็คง${a.thai}`,`ถ้าตอนนั้นฉันมีเวลา ฉันก็คง${a.thai}ไปแล้ว`],['had','have','would',a.base,a.participle],['If I had time, I would [verb]','If I had had time, I would have [participle]'],'แยกการสมมติในตอนนี้ออกจากการสมมติย้อนอดีต ฟัง had had และ would have',2)
    add(`only-scope-${a.id}`,'focus','route_focus',a.domain,[`Only she asked me to ${phrase(a,'base')}.`,`She asked only me to ${phrase(a,'base')}.`,`มีแต่เธอที่ขอให้ฉัน${a.thai} ไม่มีคนอื่นขอ`,`เธอขอให้ฉันคนเดียว${a.thai} ไม่ได้ขอคนอื่น`],['only'],['Only [subject] asked [person] to [verb]','[subject] asked only [person] to [verb]'],'ตำแหน่ง only เปลี่ยนคนที่จำกัด ข้อแรกมีเธอคนเดียวที่ขอ ข้อสองมีฉันคนเดียวที่ถูกขอ',2)
  }
})

const quantities:[string,string,string][]=[
  ['books','หนังสือ','few'],['chairs','เก้าอี้','few'],['tickets','ตั๋ว','few'],['cups','ถ้วย','few'],
  ['friends','เพื่อน','few'],['questions','คำถาม','few'],['pens','ปากกา','few'],['tables','โต๊ะ','few'],
  ['bags','กระเป๋า','few'],['plates','จาน','few'],['bottles','ขวด','few'],['rooms','ห้อง','few'],
  ['water','น้ำ','little'],['milk','นม','little'],['coffee','กาแฟ','little'],['sugar','น้ำตาล','little'],['time','เวลา','little'],['money','เงิน','little'],
]
quantities.forEach(([en,th,quantifier],i)=>add(`quantity-${en}`,'quantity','route_quantity',en==='time'?'Work':en==='money'||i<12?'Shopping':'Food',[
  `We have a ${quantifier} ${en}.`,`We have ${quantifier} ${en}.`,
  `พวกเรามี${th}อยู่บ้าง แม้จะไม่มาก`,`พวกเรามี${th}น้อยมาก แทบไม่มี`,
],['a'],['a few / few [plural noun]','a little / little [uncountable noun]'],'a few / a little เน้นว่ายังมีอยู่บ้าง ส่วน few / little เน้นว่ามีน้อยจนแทบไม่มี ต้องฟังคำสั้น ๆ a',1))

interactions.forEach(([past,th],i)=>{
  const participle=past==='saw'?'seen':past
  add(`passive-role-${i}`,'passive','passive','Family',[`She was ${participle} by him.`,`He was ${participle} by her.`,`เขา${th}เธอ`,`เธอ${th}เขา`],['she','he','him','her','by'],['[receiver] was [participle] by [doer]'],'ในรูป passive คนหลังกริยา by เป็นผู้ทำ คนต้นประโยคเป็นผู้รับการกระทำ',2)
  add(`relative-role-${i}`,'relative','route_relative','Family',[`The woman who ${past} me is here.`,`The woman whom I ${past} is here.`,`ผู้หญิงที่${th}ฉันอยู่ที่นี่`,`ผู้หญิงที่ฉัน${th}อยู่ที่นี่`],['who','whom','i','me'],['The person who [verb] me …','The person whom I [verb] …'],'ในอนุประโยคก็ต้องแยกผู้ทำกับผู้รับ ฟังว่าผู้หญิงทำต่อฉัน หรือฉันทำต่อผู้หญิง',2)
})

export const generalPairs:readonly GeneralPair[]=pairs
export function generalQuestions():HotelQuestion[] {
  const questions=generalPairs.flatMap((p,index)=>p.pair.slice(0,2).map((english,side)=>{
    const id=`hotel-g3-general-${p.id}-${side+1}`
    const words=(s:string):string[]=>s.toLowerCase().match(/[a-z]+(?:'[a-z]+)*/g)??[]
    const other=words(p.pair[1-side])
    return {id,skill:p.skill,english,correct:side as 0|1,audioUrl:`/audio/hotel/${id}.wav`,
      answers:[[{text:p.pair[2],skill:p.skill}],[{text:p.pair[3],skill:p.skill}]] as HotelQuestion['answers'],
      grammar:{kind:'meaning' as const,context:`general-${p.id}`,phase:index%6===5?'transfer' as const:'practice' as const,
        targets:words(english).filter(w=>p.focus.includes(w)||!other.includes(w)),explanation:p.explanation,contrast:p.pair[1-side],domain:p.domain},
    }
  }))
  // Reused English may support a different contrast, but cannot masquerade as
  // an unseen transfer sentence if it was offered in supported practice.
  const practised=new Set(questions.filter(q=>q.grammar.phase==='practice').map(q=>q.english))
  const sharedContexts=new Set(questions.filter(q=>q.grammar.phase==='transfer'&&practised.has(q.english)).map(q=>q.grammar.context))
  return questions.map(q=>sharedContexts.has(q.grammar.context)?{...q,grammar:{...q.grammar,phase:'practice' as const}}:q)
}
