// Each pair holds the event/participants steady. No now/already/yesterday cues
// in English. Thai expresses the distinction that English grammar carries.
export const grammarSkills = [
  ['roles','Who did what to whom'], ['object_forms','I / me · she / her'],
  ['ongoing_finished','Doing / done'], ['be_agreement','Am / is / are'],
  ['future_ongoing','Will do / doing'], ['possessive_forms','Her / hers · their / theirs'],
  ['past_states','Is / was · are / were'], ['verb_forms','Base / past / participle'],
  ['habit_ongoing','Routine / in progress'], ['do_support','Do / does / did'],
  ['negative','Positive / negative'], ['modal_meaning','Can / must'],
  ['prepositions','Before / after · to / from'], ['verb_patterns','Verb patterns'],
  ['passive','Who acts / who receives'], ['articles','A / an · this / these'],
] as const
export type GrammarSkill = typeof grammarSkills[number][0]
export type MeaningPair = { skill: GrammarSkill; english: readonly [string,string]; thai: readonly [string,string]; target: readonly [string,string]; explanation: string }
const meaning = (skill: GrammarSkill, target: readonly [string,string], explanation: string, rows: readonly (readonly [string,string,string,string])[]): MeaningPair[] => rows.map(([a,b,ta,tb]) => ({skill,english:[a,b],thai:[ta,tb],target,explanation}))
export const meaningPairs: MeaningPair[] = [
  ...meaning('roles',['she he they we i her him them us me','she he they we i her him them us me'],'ดูว่าใครเป็นผู้ทำและใครเป็นผู้รับ ไม่ใช่แค่จำว่าเป็นผู้หญิงหรือผู้ชาย',[
    ['She called me.','I called her.','เธอโทรหาฉัน','ฉันโทรหาเธอ'],
    ['He called us.','We called him.','เขาโทรหาพวกเรา','พวกเราโทรหาเขา'],
    ['They help me.','I help them.','พวกเขาช่วยฉัน','ฉันช่วยพวกเขา'],
    ['She gave him the key.','He gave her the key.','เธอให้กุญแจแก่เขา','เขาให้กุญแจแก่เธอ'],
    ['I sent them the receipt.','They sent me the receipt.','ฉันส่งใบเสร็จให้พวกเขา','พวกเขาส่งใบเสร็จให้ฉัน'],
    ['We asked her to wait.','She asked us to wait.','พวกเราขอให้เธอรอ','เธอขอให้พวกเรารอ'],
  ]),
  ...meaning('ongoing_finished',['am is are ing','have has ed'],'is / are + -ing บอกว่ากำลังทำ ส่วน have / has + กริยาช่อง 3 บอกว่าทำแล้วในบริบทนี้',[
    ['I am checking your booking.','I have checked your booking.','ฉันกำลังตรวจสอบการจองของคุณ','ฉันตรวจสอบการจองของคุณแล้ว'],
    ['We are arranging your transfer.','We have arranged your transfer.','เรากำลังจัดรถรับส่งให้คุณ','เราจัดรถรับส่งให้คุณแล้ว'],
    ['She is preparing your room.','She has prepared your room.','เธอกำลังเตรียมห้องของคุณ','เธอเตรียมห้องของคุณแล้ว'],
    ['They are sending the receipt.','They have sent the receipt.','พวกเขากำลังส่งใบเสร็จ','พวกเขาส่งใบเสร็จแล้ว'],
    ['He is bringing your bags.','He has brought your bags.','เขากำลังนำกระเป๋าของคุณมา','เขานำกระเป๋าของคุณมาแล้ว'],
    ['I am calling the driver.','I have called the driver.','ฉันกำลังโทรหาคนขับรถ','ฉันโทรหาคนขับรถแล้ว'],
  ]),
  ...meaning('future_ongoing',['will','am is are ing'],'will + กริยารูปพื้นฐาน บอกสิ่งที่จะทำ ส่วน am / is / are + -ing บอกว่ากำลังทำในบริบทนี้',[
    ['I will check your booking.','I am checking your booking.','ฉันจะตรวจสอบการจองของคุณ','ฉันกำลังตรวจสอบการจองของคุณ'],
    ['We will arrange your transfer.','We are arranging your transfer.','เราจะจัดรถรับส่งให้คุณ','เรากำลังจัดรถรับส่งให้คุณ'],
    ['She will prepare your room.','She is preparing your room.','เธอจะเตรียมห้องของคุณ','เธอกำลังเตรียมห้องของคุณ'],
    ['They will send the receipt.','They are sending the receipt.','พวกเขาจะส่งใบเสร็จ','พวกเขากำลังส่งใบเสร็จ'],
    ['We will send your confirmation.','We are sending your confirmation.','เราจะส่งการยืนยันให้คุณ','เรากำลังส่งการยืนยันให้คุณ'],
    ['I will bring your key.','I am bringing your key.','ฉันจะนำกุญแจของคุณมา','ฉันกำลังนำกุญแจของคุณมา'],
  ]),
  ...meaning('habit_ongoing',['serve check help arrange carry prepare','am is are ing'],'รูปปัจจุบันทั่วไปบอกงานที่ทำเป็นปกติ ส่วน be + -ing บอกงานที่กำลังทำในบริบทนี้',[
    ['We serve breakfast.','We are serving breakfast.','เราให้บริการอาหารเช้าเป็นปกติ','เรากำลังให้บริการอาหารเช้า'],
    ['I check bookings.','I am checking bookings.','ฉันตรวจการจองเป็นงานประจำ','ฉันกำลังตรวจการจอง'],
    ['She helps guests.','She is helping guests.','เธอช่วยเหลือแขกเป็นงานประจำ','เธอกำลังช่วยเหลือแขก'],
    ['They arrange transfers.','They are arranging transfers.','พวกเขาจัดรถรับส่งเป็นงานประจำ','พวกเขากำลังจัดรถรับส่ง'],
    ['He carries bags.','He is carrying bags.','เขายกกระเป๋าเป็นงานประจำ','เขากำลังยกกระเป๋า'],
    ['We prepare rooms.','We are preparing rooms.','เราเตรียมห้องเป็นงานประจำ','เรากำลังเตรียมห้อง'],
  ]),
  ...meaning('past_states',['is are am','was were'],'is / are / am บอกสภาพปัจจุบัน ส่วน was / were บอกสภาพในอดีต',[
    ['The room is ready.','The room was ready.','ตอนนี้ห้องพร้อม','ก่อนหน้านี้ห้องพร้อม'],
    ['The guests are here.','The guests were here.','ตอนนี้แขกอยู่ที่นี่','ก่อนหน้านี้แขกอยู่ที่นี่'],
    ['I am at reception.','I was at reception.','ตอนนี้ฉันอยู่ที่แผนกต้อนรับ','ก่อนหน้านี้ฉันอยู่ที่แผนกต้อนรับ'],
    ['The pool is open.','The pool was open.','ตอนนี้สระว่ายน้ำเปิดอยู่','ก่อนหน้านี้สระว่ายน้ำเปิดอยู่'],
    ['Your bags are in the lobby.','Your bags were in the lobby.','ตอนนี้กระเป๋าของคุณอยู่ในล็อบบี้','ก่อนหน้านี้กระเป๋าของคุณอยู่ในล็อบบี้'],
    ['The driver is outside.','The driver was outside.','ตอนนี้คนขับรถอยู่ข้างนอก','ก่อนหน้านี้คนขับรถอยู่ข้างนอก'],
  ]),
  ...meaning('negative',['is are can do have has','not cannot'],'ฟังคำปฏิเสธให้ครบ การตัด not หรือเปลี่ยน can เป็น cannot ทำให้ความหมายกลับกัน',[
    ['The room is ready.','The room is not ready.','ห้องพร้อมแล้ว','ห้องยังไม่พร้อม'],
    ['You can check in.','You cannot check in.','คุณเช็กอินได้','คุณเช็กอินไม่ได้'],
    ['We have a room available.','We do not have a room available.','เรามีห้องว่าง','เราไม่มีห้องว่าง'],
    ['Breakfast is included.','Breakfast is not included.','รวมอาหารเช้า','ไม่รวมอาหารเช้า'],
    ['The driver has arrived.','The driver has not arrived.','คนขับรถมาถึงแล้ว','คนขับรถยังมาไม่ถึง'],
    ['You need to book the sauna.','You do not need to book the sauna.','คุณต้องจองห้องซาวน่า','คุณไม่ต้องจองห้องซาวน่า'],
  ]),
  ...meaning('modal_meaning',['can','must'],'can บอกว่าทำได้ ส่วน must บอกว่าจำเป็นต้องทำ ไม่ใช่แค่ทำได้',[
    ['You can pay at reception.','You must pay at reception.','คุณชำระเงินที่แผนกต้อนรับได้','คุณต้องชำระเงินที่แผนกต้อนรับ'],
    ['You can book the sauna.','You must book the sauna.','คุณจองห้องซาวน่าได้','คุณต้องจองห้องซาวน่า'],
    ['You can leave your key here.','You must leave your key here.','คุณฝากกุญแจไว้ที่นี่ได้','คุณต้องฝากกุญแจไว้ที่นี่'],
    ['You can call reception.','You must call reception.','คุณโทรหาแผนกต้อนรับได้','คุณต้องโทรหาแผนกต้อนรับ'],
    ['You can wait in the lobby.','You must wait in the lobby.','คุณรอในล็อบบี้ได้','คุณต้องรอในล็อบบี้'],
    ['You can show your passport.','You must show your passport.','คุณแสดงหนังสือเดินทางได้','คุณต้องแสดงหนังสือเดินทาง'],
  ]),
  ...meaning('prepositions',['before to in front of beside','after from behind opposite'],'คำเชื่อมสั้น ๆ เปลี่ยนเวลา ทิศทาง หรือตำแหน่ง โดยคนและสิ่งของยังเหมือนเดิม',[
    ['Please call before breakfast.','Please call after breakfast.','กรุณาโทรก่อนอาหารเช้า','กรุณาโทรหลังอาหารเช้า'],
    ['The shuttle is going to the airport.','The shuttle is going from the airport.','รถรับส่งกำลังไปสนามบิน','รถรับส่งกำลังออกจากสนามบิน'],
    ['The taxi is in front of the hotel.','The taxi is behind the hotel.','แท็กซี่อยู่หน้าโรงแรม','แท็กซี่อยู่หลังโรงแรม'],
    ['The sauna is beside the pool.','The sauna is opposite the pool.','ห้องซาวน่าอยู่ข้างสระว่ายน้ำ','ห้องซาวน่าอยู่ตรงข้ามสระว่ายน้ำ'],
    ['Your room will be ready before two.','Your room will be ready after two.','ห้องของคุณจะพร้อมก่อนบ่ายสองโมง','ห้องของคุณจะพร้อมหลังบ่ายสองโมง'],
    ['Please shower before using the pool.','Please shower after using the pool.','กรุณาอาบน้ำก่อนใช้สระว่ายน้ำ','กรุณาอาบน้ำหลังใช้สระว่ายน้ำ'],
  ]),
  ...meaning('passive',['called helped met asked','was were by'],'was / were + กริยาช่อง 3 + by สลับมุมมองไปที่ผู้รับการกระทำ ต้องดูว่าใครทำกับใคร',[
    ['The guest called the driver.','The guest was called by the driver.','แขกโทรหาคนขับรถ','คนขับรถโทรหาแขก'],
    ['The receptionist helped the guest.','The receptionist was helped by the guest.','พนักงานต้อนรับช่วยแขก','แขกช่วยพนักงานต้อนรับ'],
    ['The manager called the receptionist.','The manager was called by the receptionist.','ผู้จัดการโทรหาพนักงานต้อนรับ','พนักงานต้อนรับโทรหาผู้จัดการ'],
    ['The driver called the porter.','The driver was called by the porter.','คนขับรถโทรหาพนักงานยกกระเป๋า','พนักงานยกกระเป๋าโทรหาคนขับรถ'],
    ['The guide helped the driver.','The guide was helped by the driver.','ไกด์ช่วยคนขับรถ','คนขับรถช่วยไกด์'],
    ['The guest called the manager.','The guest was called by the manager.','แขกโทรหาผู้จัดการ','ผู้จัดการโทรหาแขก'],
  ]),
]

// Thai gives the intended message, not an alternative noun. Only the grammatical
// form differs between the two English buttons. The full sentence is heard AFTER
// answering; before answering the recording contains silence at the blank.
export type FormItem = { skill: GrammarSkill; prompt: string; right: string; wrong: string; thai: string; explanation: string }
const forms = (skill: GrammarSkill, explanation: string, rows: readonly (readonly [string,string,string,string])[]): FormItem[] => rows.map(([prompt,right,wrong,thai]) => ({skill,prompt,right,wrong,thai,explanation}))
export const formItems: FormItem[] = [
  ...forms('object_forms','ผู้ทำใช้ I / he / she / we / they ส่วนผู้รับหรือหลังบุพบทใช้ me / him / her / us / them',[
    ['I called _____.','her','she','ฉันโทรหาเธอ'], ['_____ called me.','She','Her','เธอโทรหาฉัน'],
    ['Please wait for _____.','him','he','กรุณารอเขา'], ['_____ will help you.','He','Him','เขาจะช่วยคุณ'],
    ['Please call _____.','us','we','กรุณาโทรหาพวกเรา'], ['_____ will call you.','We','Us','พวกเราจะโทรหาคุณ'],
    ['Please follow _____.','me','I','กรุณาตามฉันมา'], ['_____ will show you the room.','I','Me','ฉันจะพาคุณไปดูห้อง'],
    ['I will meet _____.','them','they','ฉันจะไปพบพวกเขา'], ['_____ will meet you.','They','Them','พวกเขาจะไปพบคุณ'],
  ]),
  ...forms('possessive_forms','หน้าคำนามใช้ my / your / her / their ถ้าไม่มีคำนามตามหลังใช้ mine / yours / hers / theirs',[
    ['This is _____ key.','her','hers','นี่คือกุญแจของเธอ'], ['This key is _____.','hers','her','กุญแจนี้เป็นของเธอ'],
    ['This is _____ bag.','my','mine','นี่คือกระเป๋าของฉัน'], ['This bag is _____.','mine','my','กระเป๋านี้เป็นของฉัน'],
    ['Is this _____ room?','your','yours','นี่คือห้องของคุณใช่ไหม'], ['Is this room _____?','yours','your','ห้องนี้เป็นของคุณใช่ไหม'],
    ['These are _____ bags.','their','theirs','นี่คือกระเป๋าของพวกเขา'], ['These bags are _____.','theirs','their','กระเป๋าเหล่านี้เป็นของพวกเขา'],
  ]),
  ...forms('be_agreement','ใช้ I am; he / she / it is; you / we / they are อดีตใช้ was กับ I / he / she / it และ were กับ you / we / they',[
    ['I _____ checking your booking.','am','is','ฉันกำลังตรวจสอบการจองของคุณ'], ['She _____ checking your booking.','is','are','เธอกำลังตรวจสอบการจองของคุณ'],
    ['They _____ waiting in the lobby.','are','is','พวกเขากำลังรอในล็อบบี้'], ['The room _____ ready.','is','are','ห้องพร้อมแล้ว'],
    ['The rooms _____ ready.','are','is','ห้องหลายห้องพร้อมแล้ว'], ['I _____ at reception.','was','were','ก่อนหน้านี้ฉันอยู่ที่แผนกต้อนรับ'],
    ['The guests _____ at the pool.','were','was','ก่อนหน้านี้แขกอยู่ที่สระว่ายน้ำ'], ['You _____ waiting outside.','are','am','คุณกำลังรอข้างนอก'],
  ]),
  ...forms('do_support','คำถามใช้ do / does / did นำหน้าประธาน แล้วใช้กริยารูปพื้นฐาน ไม่เติม -s หรือรูปอดีตซ้ำ',[
    ['_____ she need a taxi?','Does','Do','เธอต้องการแท็กซี่ไหม'], ['_____ they need a taxi?','Do','Does','พวกเขาต้องการแท็กซี่ไหม'],
    ['Does he _____ a reservation?','have','has','เขามีการจองไหม'], ['Did you _____ by card?','pay','paid','คุณชำระด้วยบัตรไปแล้วใช่ไหม'],
    ['Where _____ she want to go?','does','do','เธอต้องการไปที่ไหน'], ['What time did they _____?','arrive','arrived','พวกเขามาถึงกี่โมง'],
    ['Does the room _____ a balcony?','have','has','ห้องมีระเบียงไหม'], ['Did she _____ her key?','return','returned','เธอคืนกุญแจแล้วใช่ไหม'],
  ]),
  ...forms('verb_forms','ดูคำช่วยด้วย: will / can + รูปพื้นฐาน; have / has + ช่อง 3; be + -ing เมื่อกำลังทำ; อดีตทั่วไปใช้ช่อง 2',[
    ['I will _____ the driver.','call','called','ฉันจะโทรหาคนขับรถ'], ['She has _____ your bags.','brought','bring','เธอนำกระเป๋าของคุณมาแล้ว'],
    ['We are _____ your transfer.','arranging','arranged','เรากำลังจัดรถรับส่งให้คุณ'], ['He has _____ the receipt.','sent','send','เขาส่งใบเสร็จแล้ว'],
    ['The guest _____ by card yesterday.','paid','pay','แขกชำระด้วยบัตรเมื่อวาน'], ['You can _____ your bags here.','leave','left','คุณฝากกระเป๋าที่นี่ได้'],
    ['She _____ bookings every day.','checks','check','เธอตรวจการจองทุกวัน'], ['They have _____ the driver.','seen','saw','พวกเขาพบคนขับรถแล้ว'],
  ]),
  ...forms('articles','a / an ใช้กับสิ่งหนึ่งสิ่ง ดูเสียงต้น: an extra towel แต่ a towel; this + เอกพจน์ และ these + พหูพจน์',[
    ['Would you like _____ towel?','a','an','คุณต้องการผ้าขนหนูหนึ่งผืนไหม'], ['Would you like _____ extra towel?','an','a','คุณต้องการผ้าขนหนูเพิ่มหนึ่งผืนไหม'],
    ['Please wait for _____ hour.','an','a','กรุณารอหนึ่งชั่วโมง'], ['You need _____ passport.','a','an','คุณต้องใช้หนังสือเดินทาง'],
    ['_____ room is ready.','This','These','ห้องนี้พร้อมแล้ว'], ['_____ rooms are ready.','These','This','ห้องเหล่านี้พร้อมแล้ว'],
    ['Is _____ your key?','this','these','นี่คือกุญแจของคุณใช่ไหม'], ['Are _____ your bags?','these','this','นี่คือกระเป๋าหลายใบของคุณใช่ไหม'],
  ]),
  ...forms('verb_patterns','กริยาต่างกันใช้รูปตามหลังต่างกัน: ask someone to do; let someone do; explain something to someone; wait for someone',[
    ['I asked her _____ wait.','to','for','ฉันขอให้เธอรอ'], ['Please let me _____ your booking.','check','to check','ขอให้ฉันตรวจสอบการจองของคุณ'],
    ['I will _____.','explain the bill to you','explain you the bill','ฉันจะอธิบายใบเรียกเก็บเงินให้คุณเข้าใจ'], ['Please wait _____ the driver.','for','to','กรุณารอคนขับรถ'],
    ['Would you like me _____ call a taxi?','to','for','คุณต้องการให้ฉันเรียกแท็กซี่ไหม'], ['Please tell her _____ call reception.','to','for','กรุณาบอกให้เธอโทรหาแผนกต้อนรับ'],
    ['We look forward to _____ you.','seeing','see','เรารอคอยที่จะได้พบคุณ'], ['Please let us _____ you.','help','to help','ขอให้พวกเราช่วยคุณ'],
  ]),
]
