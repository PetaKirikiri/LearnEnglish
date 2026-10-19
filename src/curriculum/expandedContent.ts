import type { HotelQuestion } from '../hotel/course'

type Row = readonly [string, string, string, string]
type Contrast = { node: string; kind: 'meaning'|'form'; frames: string[]; focus: string[]; explanation: string; rows: Row[] }
// Independently authored teaching examples. Alternatives retain the same
// participants/actions; changed words express the target distinction only.
export const contrasts: Contrast[] = [
  {node:'simple-links',kind:'meaning',frames:['[clause] and [clause]','[clause] but [clause]'],focus:['and','but'],explanation:'and เพิ่มข้อมูล ส่วน but แสดงความขัดแย้ง คนและสิ่งของในสองตัวเลือกเหมือนกัน',rows:[
    ['The room is small and comfortable.','The room is small but comfortable.','ห้องเล็กและสะดวกสบาย','ห้องเล็กแต่สะดวกสบาย'],
    ['The pool is open and quiet.','The pool is open but quiet.','สระว่ายน้ำเปิดอยู่และเงียบ','สระว่ายน้ำเปิดอยู่แต่เงียบ'],
    ['The taxi is here and the guest is waiting.','The taxi is here but the guest is waiting.','แท็กซี่มาแล้วและแขกกำลังรอ','แท็กซี่มาแล้วแต่แขกยังรออยู่'],
    ['Breakfast is included and parking is extra.','Breakfast is included but parking is extra.','รวมอาหารเช้าและคิดค่าจอดรถเพิ่ม','รวมอาหารเช้าแต่คิดค่าจอดรถเพิ่ม'],
  ]},
  {node:'past-events',kind:'meaning',frames:['[subject] [present verb] [object]','[subject] [past verb] [object]'],focus:['checks','checked','calls','called','helps','helped','arrives','arrived'],explanation:'รูปกริยาเปลี่ยนจากงานประจำเป็นเหตุการณ์ในอดีต ไม่จำเป็นต้องมี yesterday',rows:[
    ['She checks the booking.','She checked the booking.','เธอตรวจการจองเป็นงานประจำ','เธอตรวจการจองไปแล้ว'],
    ['He calls the driver.','He called the driver.','เขาโทรหาคนขับรถเป็นประจำ','เขาโทรหาคนขับรถไปแล้ว'],
    ['The porter helps the guest.','The porter helped the guest.','พนักงานยกกระเป๋าช่วยแขกเป็นงานประจำ','พนักงานยกกระเป๋าช่วยแขกไปแล้ว'],
    ['The shuttle arrives at seven.','The shuttle arrived at seven.','รถรับส่งมาถึงตอนเจ็ดโมงเป็นประจำ','รถรับส่งมาถึงตอนเจ็ดโมงแล้ว'],
  ]},
  {node:'request-basics',kind:'meaning',frames:['Can I [base verb] [object]?','Can you [base verb] [object]?'],focus:['can','i','you'],explanation:'Can I ขอให้ฉันทำได้ไหม ส่วน Can you ขอให้อีกฝ่ายทำ ฟังว่าใครจะเป็นคนทำ',rows:[
    ['Can I open the door?','Can you open the door?','ขอให้ฉันเปิดประตูได้ไหม','คุณช่วยเปิดประตูได้ไหม'],
    ['Can I check the booking?','Can you check the booking?','ขอให้ฉันตรวจการจองได้ไหม','คุณช่วยตรวจการจองได้ไหม'],
    ['Can I call the driver?','Can you call the driver?','ขอให้ฉันโทรหาคนขับรถได้ไหม','คุณช่วยโทรหาคนขับรถได้ไหม'],
    ['Can I carry the bag?','Can you carry the bag?','ขอให้ฉันถือกระเป๋าได้ไหม','คุณช่วยถือกระเป๋าได้ไหม'],
  ]},
  {node:'quantity',kind:'form',frames:['How many [plural noun] …?','How much [uncountable noun] …?','a few [plural noun]','a little [uncountable noun]'],focus:['many','much','few','little'],explanation:'ใช้ many / few กับสิ่งที่นับเป็นชิ้นได้ และ much / little กับปริมาณ เช่น water',rows:[
    ['How _____ bags do you have?','many','much','คุณมีกระเป๋ากี่ใบ'],
    ['How _____ water would you like?','much','many','คุณต้องการน้ำเท่าไร'],
    ['We have a _____ rooms available.','few','little','เรามีห้องว่างอยู่สองสามห้อง'],
    ['There is a _____ milk in the coffee.','little','few','มีนมอยู่เล็กน้อยในกาแฟ'],
  ]},
  {node:'sequence',kind:'meaning',frames:['[action] before [event]','[action] after [event]','Before [clause], [clause]','After [clause], [clause]'],focus:['before','after'],explanation:'before กับ after สลับลำดับเหตุการณ์ ไม่ได้เปลี่ยนกิจกรรมหรือคน',rows:[
    ['Please pay before you leave.','Please pay after you leave.','กรุณาชำระเงินก่อนออกไป','กรุณาชำระเงินหลังออกไป'],
    ['We check the room before you arrive.','We check the room after you arrive.','เราตรวจห้องก่อนคุณมาถึง','เราตรวจห้องหลังคุณมาถึง'],
    ['Please call before you book.','Please call after you book.','กรุณาโทรก่อนจอง','กรุณาโทรหลังจอง'],
    ['The driver will wait before the meeting.','The driver will wait after the meeting.','คนขับรถจะรอก่อนการประชุม','คนขับรถจะรอหลังการประชุม'],
  ]},
  {node:'comparison',kind:'form',frames:['[subject] is [comparative] than [comparison]','[subject] is more [adjective] than [comparison]'],focus:['better','larger','quieter','more','than'],explanation:'เมื่อเปรียบเทียบสองสิ่ง ใช้รูปเปรียบเทียบกับ than เช่น better than หรือ more comfortable than',rows:[
    ['This room is _____ than that room.','larger','largest','ห้องนี้ใหญ่กว่าห้องนั้น'],
    ['This room is _____ comfortable than that room.','more','most','ห้องนี้สะดวกสบายกว่าห้องนั้น'],
    ['This room is _____ than the room upstairs.','quieter','quiet','ห้องนี้เงียบกว่าห้องชั้นบน'],
    ['This option is _____ than that option.','better','good','ตัวเลือกนี้ดีกว่าตัวเลือกนั้น'],
  ]},
  {node:'repair',kind:'meaning',frames:['Could you tell me whether [statement order]?','Could you tell me why [statement order]?'],focus:['whether','why'],explanation:'whether ถามว่าเป็นจริงหรือไม่ ส่วน why ถามเหตุผล คำอื่นในประโยคเหมือนกัน',rows:[
    ['Could you tell me whether the room is ready?','Could you tell me why the room is ready?','ช่วยบอกฉันได้ไหมว่าห้องพร้อมหรือยัง','ช่วยบอกเหตุผลได้ไหมว่าทำไมห้องจึงพร้อม'],
    ['Could you tell me whether the driver has left?','Could you tell me why the driver has left?','ช่วยบอกฉันได้ไหมว่าคนขับรถออกไปแล้วหรือยัง','ช่วยบอกฉันได้ไหมว่าทำไมคนขับรถจึงออกไป'],
    ['Could you tell me whether the pool is closed?','Could you tell me why the pool is closed?','ช่วยบอกฉันได้ไหมว่าสระว่ายน้ำปิดอยู่หรือไม่','ช่วยบอกฉันได้ไหมว่าทำไมสระว่ายน้ำจึงปิด'],
    ['Could you tell me whether the booking was cancelled?','Could you tell me why the booking was cancelled?','ช่วยบอกฉันได้ไหมว่าการจองถูกยกเลิกหรือไม่','ช่วยบอกฉันได้ไหมว่าทำไมการจองจึงถูกยกเลิก'],
  ]},
  {node:'past-sequence',kind:'meaning',frames:['[subject] had [participle] when [past event]','[subject] was [verb-ing] when [past event]'],focus:['had','was','left','leaving','checked','checking','sent','sending','prepared','preparing'],explanation:'had + ช่อง 3 บอกว่าเสร็จก่อนอีกเหตุการณ์ในอดีต ส่วน was + -ing บอกว่ากำลังทำในเวลานั้น',rows:[
    ['She had left when I called.','She was leaving when I called.','ตอนฉันโทร เธอออกไปแล้ว','ตอนฉันโทร เธอกำลังจะออกไป'],
    ['He had checked the booking when I arrived.','He was checking the booking when I arrived.','ตอนฉันมาถึง เขาตรวจการจองเสร็จแล้ว','ตอนฉันมาถึง เขากำลังตรวจการจอง'],
    ['She had sent the receipt when you called.','She was sending the receipt when you called.','ตอนคุณโทร เธอส่งใบเสร็จแล้ว','ตอนคุณโทร เธอกำลังส่งใบเสร็จ'],
    ['He had prepared the room when the guest arrived.','He was preparing the room when the guest arrived.','ตอนแขกมาถึง เขาเตรียมห้องเสร็จแล้ว','ตอนแขกมาถึง เขากำลังเตรียมห้อง'],
  ]},
  {node:'possibility',kind:'meaning',frames:['[subject] might be [verb-ing]','[subject] must be [verb-ing]'],focus:['might','must'],explanation:'might be บอกความเป็นไปได้ ส่วน must be ในบริบทนี้เป็นการคาดคะเนที่มั่นใจ ไม่ใช่คำสั่ง',rows:[
    ['The driver might be waiting outside.','The driver must be waiting outside.','คนขับรถอาจกำลังรออยู่ข้างนอก','คนขับรถคงกำลังรออยู่ข้างนอกแน่ ๆ'],
    ['The guest might be sleeping.','The guest must be sleeping.','แขกอาจกำลังนอนหลับ','แขกคงกำลังนอนหลับแน่ ๆ'],
    ['She might be checking the booking.','She must be checking the booking.','เธออาจกำลังตรวจการจอง','เธอคงกำลังตรวจการจองแน่ ๆ'],
    ['He might be carrying the bags.','He must be carrying the bags.','เขาอาจกำลังยกกระเป๋า','เขาคงกำลังยกกระเป๋าแน่ ๆ'],
  ]},
  {node:'reported',kind:'meaning',frames:['[speaker] said [subject] would [verb]','[speaker] said [subject] had [participle]'],focus:['said','would','had','call','called','pay','paid','leave','left','arrive','arrived'],explanation:'หลัง said ใช้ would เพื่อรายงานสิ่งที่จะทำ ส่วน had + ช่อง 3 รายงานสิ่งที่ทำไปก่อนแล้ว',rows:[
    ['She said she would call.','She said she had called.','เธอบอกว่าเธอจะโทร','เธอบอกว่าเธอโทรไปแล้ว'],
    ['He said he would pay.','He said he had paid.','เขาบอกว่าเขาจะชำระเงิน','เขาบอกว่าเขาชำระเงินแล้ว'],
    ['The guest said she would leave.','The guest said she had left.','แขกบอกว่าเธอจะออกไป','แขกบอกว่าเธอออกไปแล้ว'],
    ['The driver said he would arrive.','The driver said he had arrived.','คนขับรถบอกว่าเขาจะมาถึง','คนขับรถบอกว่าเขามาถึงแล้ว'],
  ]},
  {node:'hypothetical',kind:'form',frames:['If [subject] had [noun], [subject] would [verb]','If I were [person], I would [verb]'],focus:['would','were','had'],explanation:'สถานการณ์สมมติใช้ if + รูปอดีต และ would + รูปพื้นฐาน ไม่ได้หมายความว่าเหตุการณ์เกิดในอดีตเสมอไป',rows:[
    ['If I were you, I _____ book a taxi.','would','will','ถ้าฉันเป็นคุณ ฉันจะจองแท็กซี่'],
    ['If we had a spare room, we _____ offer it to you.','would','will','ถ้าเรามีห้องสำรอง เราก็จะเสนอให้คุณ'],
    ['If she _____ here, she would help you.','were','is','ถ้าเธออยู่ที่นี่ เธอก็จะช่วยคุณ'],
    ['If I _____ your number, I would call you.','had','have','ถ้าฉันมีหมายเลขของคุณ ฉันก็จะโทรหาคุณ'],
  ]},
  {node:'relative',kind:'form',frames:['the person who [verb]','the person whose [noun] [verb]','the place where [clause]'],focus:['who','whose','where'],explanation:'who เชื่อมคนกับการกระทำ whose เชื่อมเจ้าของกับสิ่งของ และ where เชื่อมสถานที่กับเหตุการณ์',rows:[
    ['The guest _____ called is waiting.','who','which','แขกที่โทรมากำลังรอ'],
    ['The guest _____ bag is missing is here.','whose',"who's",'แขกที่กระเป๋าหายอยู่ที่นี่'],
    ['This is the hotel _____ she works.','where','which','นี่คือโรงแรมที่เธอทำงาน'],
    ['The driver _____ car is outside will help you.','whose','who','คนขับรถที่รถจอดอยู่ข้างนอกจะช่วยคุณ'],
  ]},
  {node:'future-completion',kind:'meaning',frames:['When [present event], [subject] will have [participle]','When [present event], [subject] will be [verb-ing]'],focus:['will','have','be','prepared','preparing','checked','checking','sent','sending','finished','finishing'],explanation:'will have + ช่อง 3 บอกว่าจะเสร็จแล้ว ณ จุดหนึ่งในอนาคต ส่วน will be + -ing บอกว่าจะกำลังทำ',rows:[
    ['When you arrive, we will have prepared the room.','When you arrive, we will be preparing the room.','เมื่อคุณมาถึง เราจะเตรียมห้องเสร็จแล้ว','เมื่อคุณมาถึง เราจะกำลังเตรียมห้อง'],
    ['When you call, she will have checked the booking.','When you call, she will be checking the booking.','เมื่อคุณโทร เธอจะตรวจการจองเสร็จแล้ว','เมื่อคุณโทร เธอจะกำลังตรวจการจอง'],
    ['When you leave, we will have sent the receipt.','When you leave, we will be sending the receipt.','เมื่อคุณออกไป เราจะส่งใบเสร็จแล้ว','เมื่อคุณออกไป เราจะกำลังส่งใบเสร็จ'],
    ['When you return, he will have finished the work.','When you return, he will be finishing the work.','เมื่อคุณกลับมา เขาจะทำงานเสร็จแล้ว','เมื่อคุณกลับมา เขาจะกำลังทำงานให้เสร็จ'],
  ]},
  {node:'counterfactual',kind:'form',frames:['If [subject] had [participle], [subject] would have [participle]','If [subject] had [participle], [subject] would be [state] now'],focus:['had','would','have','be'],explanation:'สมมติย้อนอดีตใช้ had + ช่อง 3 ถ้าผลอยู่ในอดีตใช้ would have + ช่อง 3 ถ้าผลอยู่ตอนนี้ใช้ would be',rows:[
    ['If we had known, we _____ called you.','would have','will have','ถ้าเรารู้ตอนนั้น เราก็คงโทรหาคุณไปแล้ว'],
    ['If you had booked, we _____ reserved a room.','would have','will have','ถ้าคุณจองตอนนั้น เราก็คงสำรองห้องไว้แล้ว'],
    ['If she had left earlier, she _____ here now.','would be','would been','ถ้าเธอออกมาเร็วกว่านั้น ตอนนี้เธอก็คงอยู่ที่นี่'],
    ['If he _____ checked the bill, he would have noticed the error.','had','has','ถ้าเขาตรวจบิลตอนนั้น เขาก็คงสังเกตเห็นข้อผิดพลาด'],
  ]},
  {node:'qualification',kind:'meaning',frames:['[clause] despite [noun phrase]','[clause] because of [noun phrase]'],focus:['despite','because','of'],explanation:'despite คือแม้มีอุปสรรค ส่วน because of บอกสาเหตุ ทั้งสองตัวเลือกพูดถึงเหตุการณ์เดียวกัน',rows:[
    ['We changed the room despite the complaint.','We changed the room because of the complaint.','เราเปลี่ยนห้องให้แม้จะมีข้อร้องเรียน','เราเปลี่ยนห้องให้เพราะข้อร้องเรียน'],
    ['The guest stayed despite the delay.','The guest stayed because of the delay.','แขกพักต่อแม้จะเกิดความล่าช้า','แขกพักต่อเพราะเกิดความล่าช้า'],
    ['We called the manager despite the cancellation.','We called the manager because of the cancellation.','เราโทรหาผู้จัดการแม้จะมีการยกเลิก','เราโทรหาผู้จัดการเพราะมีการยกเลิก'],
    ['The driver waited despite the rain.','The driver waited because of the rain.','คนขับรถรอแม้ว่าฝนตก','คนขับรถรอเพราะฝนตก'],
  ]},
  {node:'professional-response',kind:'meaning',frames:['We can [verb] [object]','We could have [participle] [object]'],focus:['can','could','have','move','moved','arrange','arranged','offer','offered','send','sent'],explanation:'can เสนอสิ่งที่ทำให้ได้ตอนนี้ ส่วน could have บอกทางเลือกที่เคยทำได้ในอดีต ไม่ใช่สัญญาว่าจะทำตอนนี้',rows:[
    ['We can move you to another room.','We could have moved you to another room.','ตอนนี้เราย้ายคุณไปอีกห้องได้','ตอนนั้นเราน่าจะย้ายคุณไปอีกห้องได้'],
    ['We can arrange a transfer.','We could have arranged a transfer.','ตอนนี้เราจัดรถรับส่งให้ได้','ตอนนั้นเราน่าจะจัดรถรับส่งให้ได้'],
    ['We can offer a refund.','We could have offered a refund.','ตอนนี้เราเสนอคืนเงินให้ได้','ตอนนั้นเราน่าจะเสนอคืนเงินให้ได้'],
    ['We can send another driver.','We could have sent another driver.','ตอนนี้เราส่งคนขับรถอีกคนไปได้','ตอนนั้นเราน่าจะส่งคนขับรถอีกคนไปได้'],
  ]},
  {node:'nuance',kind:'meaning',frames:['[subject] may have [participle]','[subject] should have [participle]'],focus:['may','should','have'],explanation:'may have บอกว่าอาจเกิดขึ้นแล้วแต่ไม่แน่ใจ ส่วน should have บอกว่าสิ่งนั้นควรเกิดขึ้นในอดีต ไม่ได้ยืนยันว่าเกิดขึ้นจริง',rows:[
    ['She may have called the guest.','She should have called the guest.','เธออาจโทรหาแขกไปแล้ว','เธอควรโทรหาแขกไปแล้ว'],
    ['He may have checked the booking.','He should have checked the booking.','เขาอาจตรวจการจองไปแล้ว','เขาควรตรวจการจองไปแล้ว'],
    ['They may have told the driver.','They should have told the driver.','พวกเขาอาจบอกคนขับรถไปแล้ว','พวกเขาควรบอกคนขับรถไปแล้ว'],
    ['We may have offered a refund.','We should have offered a refund.','เราอาจเสนอคืนเงินไปแล้ว','เราควรเสนอคืนเงินไปแล้ว'],
  ]},
  {node:'focus',kind:'form',frames:['Only after [event] did [subject] [base verb]','Never have [subject] [participle]','Not until [event] did [subject] [base verb]'],focus:['did','have','had'],explanation:'เมื่อนำคำจำกัดหรือปฏิเสธ เช่น Only after / Never / Not until ขึ้นต้นเพื่อเน้น ต้องสลับคำช่วยไว้หน้าประธาน',rows:[
    ['Only after checking the booking _____ confirm the room.','did we','we did','หลังจากตรวจการจองแล้วเท่านั้น เราจึงยืนยันห้อง'],
    ['Never _____ seen such a long queue.','have I','I have','ฉันไม่เคยเห็นคิวยาวขนาดนี้มาก่อน'],
    ['Not until the guest arrived _____ notice the mistake.','did we','we did','เราไม่สังเกตเห็นข้อผิดพลาดจนกระทั่งแขกมาถึง'],
    ['Only after the driver called _____ know about the delay.','did she','she did','หลังคนขับรถโทรมาเท่านั้น เธอจึงรู้เรื่องความล่าช้า'],
  ]},
  {node:'complex-time',kind:'meaning',frames:['When [past event], [subject] had [participle] [relative clause]','When [past event], [subject] was [verb-ing] [relative clause]'],focus:['had','was','checked','checking','sent','sending','prepared','preparing','arranged','arranging'],explanation:'ฟังลำดับเวลาของประโยคหลัก แม้มีอนุประโยคขยายยาว had + ช่อง 3 คือเสร็จก่อนจุดอดีต ส่วน was + -ing คือกำลังทำในเวลานั้น',rows:[
    ['When you called, she had checked the booking that you had changed.','When you called, she was checking the booking that you had changed.','ตอนคุณโทร เธอตรวจการจองที่คุณแก้ไขไว้เสร็จแล้ว','ตอนคุณโทร เธอกำลังตรวจการจองที่คุณแก้ไขไว้'],
    ['When the guest arrived, he had sent the receipt that she had requested.','When the guest arrived, he was sending the receipt that she had requested.','ตอนแขกมาถึง เขาส่งใบเสร็จที่เธอขอไว้แล้ว','ตอนแขกมาถึง เขากำลังส่งใบเสร็จที่เธอขอไว้'],
    ['When you returned, she had prepared the room that you had booked.','When you returned, she was preparing the room that you had booked.','ตอนคุณกลับมา เธอเตรียมห้องที่คุณจองไว้เสร็จแล้ว','ตอนคุณกลับมา เธอกำลังเตรียมห้องที่คุณจองไว้'],
    ['When the manager arrived, he had arranged the transfer that we had discussed.','When the manager arrived, he was arranging the transfer that we had discussed.','ตอนผู้จัดการมาถึง เขาจัดรถรับส่งที่เราคุยกันไว้เสร็จแล้ว','ตอนผู้จัดการมาถึง เขากำลังจัดรถรับส่งที่เราคุยกันไว้'],
  ]},
]

const tokens=(text:string)=>text.toLowerCase().match(/[a-z]+(?:'[a-z]+)*/g)??[]
export function expandedQuestions(): HotelQuestion[] {
  return contrasts.flatMap(c=>c.rows.flatMap((row,index):HotelQuestion[]=>{
    const skill=`route_${c.node.replaceAll('-','_')}`
    const context=`${skill}-${index+1}`, phase=index<2?'practice' as const:'transfer' as const
    if(c.kind==='form') {
      const [prompt,right,wrong,thai]=row, correct=(index%2) as 0|1
      const id=`hotel-g3-${c.node}-${index+1}`
      return [{id,skill,english:prompt.replace('_____',right),correct,audioUrl:`/audio/hotel/${id}.wav`,
        answers:(correct?[wrong,right]:[right,wrong]).map(text=>[{text,skill}]) as HotelQuestion['answers'],
        grammar:{kind:'form',context,phase,targets:tokens(right),explanation:c.explanation,contrast:prompt.replace('_____',wrong),thai,prompt,promptAudioUrl:`/audio/hotel/${id}-prompt.wav`}}]
    }
    const [a,b,ta,tb]=row
    return [a,b].map((english,side)=>{
      const id=`hotel-g3-${c.node}-${index+1}-${side+1}`
      return {id,skill,english,correct:side as 0|1,audioUrl:`/audio/hotel/${id}.wav`,answers:[[{text:ta,skill}],[{text:tb,skill}]],
        grammar:{kind:'meaning',context,phase,targets:tokens(english).filter(w=>c.focus.includes(w)),explanation:c.explanation,contrast:side?a:b}}
    })
  }))
}
