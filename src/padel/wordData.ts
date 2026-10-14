import { thaiTranslations } from '../content/thaiTranslations.generated'
import { hotelWordGlosses } from '../hotel/wordGlosses'
import { hotelWordProfiles } from '../hotel/wordProfiles'
import { nouns, verbs, nounMatches, verbMatches } from '../../scripts/wordGrammar'
import { countNeighbours, rankedNeighbours } from '../learning/wordInfo/corpus'
import type { WordProfile, VerbForms, NounForms } from '../learning/wordInfo/types'
import { normalizeHelpWord } from '../learning/helpPoints'
import { padelQuestions } from './course'

export const padelWordGlosses: Record<string,string> = { ...thaiTranslations, ...hotelWordGlosses,
  player:'ผู้เล่น', players:'ผู้เล่นหลายคน', coach:'โค้ช; ผู้ฝึกสอน', racket:'ไม้พาเดล', rackets:'ไม้พาเดลหลายอัน', ball:'ลูกบอล',
  guest:'ลูกค้า; ผู้มาใช้บริการ', court:'สนามพาเดล', changing:'กำลังเปลี่ยน; changing room = ห้องเปลี่ยนเสื้อผ้า', room:'ห้อง', bottle:'ขวด', showers:'ห้องอาบน้ำ',
  cafe:'คาเฟ่; ร้านกาแฟ', inside:'ข้างใน', our:'ของเรา', play:'เล่น', playing:'กำลังเล่น', clean:'ทำความสะอาด', cleaning:'กำลังทำความสะอาด', cleaned:'ทำความสะอาดแล้ว',
  lesson:'บทเรียน; ในที่นี้คือการเรียนกับโค้ช', match:'การแข่งขัน', beginner:'ผู้เล่นมือใหม่', experienced:'มีประสบการณ์', session:'รอบเล่น; ช่วงเวลาที่จอง',
  cash:'เงินสด', costs:'มีราคา; ต้องจ่าย', game:'เกม; การเล่น', turn:'หมุน; turn on / off = เปิด / ปิด', lights:'ไฟหลายดวง', off:'ปิด; turn off = ปิด', gate:'ประตูรั้ว', wet:'เปียก', dry:'แห้ง',
  tell:'บอก; แจ้ง', close:'ปิด', cancel:'ยกเลิก; cancel a court = ยกเลิกการจองสนาม', has:'มี; ใช้กับกริยาช่อง 3 เพื่อบอกสิ่งที่เกิดแล้ว',
  have:'มี; ใช้กับกริยาช่อง 3 เพื่อบอกสิ่งที่เกิดแล้ว', will:'จะ; ตามด้วยกริยารูปพื้นฐาน',
  hours:'ชั่วโมง (มากกว่าหนึ่ง)', confirm:'ยืนยัน',
  pilates:'พิลาทิส', customer:'ลูกค้า', customers:'ลูกค้าหลายคน', instructor:'ผู้สอน', mat:'เสื่อออกกำลังกาย', mats:'เสื่อออกกำลังกายหลายผืน',
  reformer:'เครื่องรีฟอร์เมอร์สำหรับพิลาทิส', grip:'การยึดเกาะ; grip socks = ถุงเท้ากันลื่น', socks:'ถุงเท้า', studio:'ห้องฝึก', locker:'ตู้ล็อกเกอร์', garden:'สวน',
  upstairs:'ชั้นบน', downstairs:'ชั้นล่าง', prepare:'เตรียม', place:'ที่; สถานที่; ที่ว่างหนึ่งที่', places:'สถานที่หลายแห่ง; ที่ว่างหลายที่',
  left:'ซ้าย; เหลืออยู่ เช่น one place left', class:'คลาส; ชั้นเรียน', full:'เต็ม', join:'เข้าร่วม; ลงชื่อเข้าร่วม',
  teaching:'กำลังสอน', equipment:'อุปกรณ์', started:'เริ่มแล้ว', changed:'เปลี่ยนแล้ว', private:'ส่วนตัว', group:'กลุ่ม', list:'รายชื่อ; รายการ',
  package:'แพ็กเกจ; ชุดคลาส', break:'ช่วงพัก; หยุดพัก', feel:'รู้สึก', pain:'ความเจ็บปวด', dizzy:'เวียนหัว', straps:'สายรัด', springs:'สปริง',
  leave:'ออกไป; กลับ; ฝากหรือทิ้งไว้ เช่น leave your bag',
  booked:'จองไว้แล้ว', move:'ย้าย; เลื่อนการจอง', number:'จำนวน; หมายเลข', coming:'กำลังมา; ที่จะมา', balls:'ลูกบอลหลายลูก',
  hundred:'ร้อย', baht:'บาท', per:'ต่อ; ต่อหนึ่งหน่วย', price:'ราคา', person:'คนหนึ่งคน', total:'ยอดรวม; ทั้งหมด', thousand:'พัน',
  hire:'เช่า; การเช่า', together:'ด้วยกัน; รวมกัน', separately:'แยกกัน; แยกต่างหาก', deposit:'เงินมัดจำ', amount:'จำนวน; จำนวนเงิน', own:'ของตัวเอง',
  replace:'เปลี่ยนให้; เปลี่ยนแทน', replaced:'เปลี่ยนให้แล้ว', damaged:'ชำรุด; เสียหาย', new:'ใหม่', used:'ใช้แล้ว', tube:'หลอด; กระบอกใส่ลูกบอล',
  tape:'เทป; grip tape = เทปพันด้ามไม้', wrist:'ข้อมือ', strap:'สายรัด; สายคล้อง', slippery:'ลื่น', stock:'สินค้าคงเหลือ; in stock = มีสินค้า',
  classes:'คลาสหลายคลาส', sold:'ขาย; จำหน่าย (รูปช่อง 2 และ 3 ของ sell)', expires:'หมดอายุ', month:'เดือน', raining:'ฝนกำลังตก', stopped:'หยุดแล้ว',
  refund:'การคืนเงิน', credit:'เครดิตสำหรับใช้บริการครั้งหน้า', explain:'อธิบาย', rules:'กติกา; ข้อกำหนด', score:'คะแนน',
  bounce:'เด้ง; ทำให้ลูกเด้ง', bounced:'เด้งแล้ว', once:'หนึ่งครั้ง', twice:'สองครั้ง', hit:'ตี; ชน', point:'แต้ม; จุด', enter:'เข้า',
  serve:'เสิร์ฟ; ลูกเสิร์ฟ (ในกีฬาพาเดล)', return:'คืน; ตีกลับ เช่น return the serve = รับลูกเสิร์ฟ',
  service:'การบริการ; service box = ช่องเสิร์ฟ', box:'กล่อง; service box = ช่องเสิร์ฟ', glass:'กระจก (ขอบสนาม); แก้ว',
  waist:'เอว', height:'ความสูง; ระดับความสูง', lower:'ต่ำกว่า', diagonally:'ในแนวทแยง', opposite:'ตรงข้าม',
}
const extraVerbs: VerbForms[] = [
  ['clean','cleans','cleaned','cleaned','cleaning'], ['cost','costs','cost','cost','costing'], ['turn','turns','turned','turned','turning'],
  ['prepare','prepares','prepared','prepared','preparing'], ['teach','teaches','taught','taught','teaching'],
  ['join','joins','joined','joined','joining'], ['feel','feels','felt','felt','feeling'],
  ['hire','hires','hired','hired','hiring'], ['replace','replaces','replaced','replaced','replacing'],
  ['bounce','bounces','bounced','bounced','bouncing'], ['serve','serves','served','served','serving'],
  ['rain','rains','rained','rained','raining'], ['expire','expires','expired','expired','expiring'],
  ['explain','explains','explained','explained','explaining'], ['delay','delays','delayed','delayed','delaying'],
  ['refund','refunds','refunded','refunded','refunding'], ['enter','enters','entered','entered','entering'],
].map(([base,third,past,participle,ing]) => ({base,third,past,participle,ing}))
const extraNouns: NounForms[] = ['player','coach','racket','ball','court','bottle','shower','cafe','lesson','match','beginner','session','game','light','gate','customer','instructor','mat','reformer','sock','studio','locker','garden','class','place','group','list','package','break','strap','spring'].map(singular => ({singular,plural:['coach','match','class'].includes(singular) ? `${singular}es` : `${singular}s`,countability:'countable'}))
extraNouns.push({singular:'equipment',plural:null,countability:'uncountable'},{singular:'pain',plural:null,countability:'uncountable'})
extraNouns.push(...['price','deposit','amount','tube','wrist','refund','rule','score','point','month','number'].map(singular => ({singular,plural:`${singular}s`,countability:'countable' as const})))
const notes: Record<string,string> = {
  court:'court ในที่นี้คือสนามพาเดล ไม่ใช่ศาล; the court หมายถึงสนามที่กำลังพูดถึง',
  coach:'the coach คือผู้ฝึกสอน; ในประโยคเหล่านี้เป็นคน ไม่ใช่รถโดยสาร',
  guest:'guest ในบทเรียนนี้หมายถึงลูกค้าที่มาใช้บริการสนาม',
  racket:'a racket = ไม้พาเดลหนึ่งอัน; two rackets ต้องเติม -s',
  changing:'changing room เป็นกลุ่มคำ หมายถึงห้องเปลี่ยนเสื้อผ้า ไม่ได้บอกว่าห้องกำลังเปลี่ยน',
  room:'changing room = ห้องเปลี่ยนเสื้อผ้า ไม่ใช่ห้องพักโรงแรม',
  lesson:'a lesson คือการเรียนกับโค้ช; a match คือการแข่งขัน',
  match:'a match คือการแข่งขัน ไม่ใช่การเรียนกับโค้ช',
  session:'your session คือช่วงเวลาที่คุณจองเล่น; starts บอกเวลาเริ่ม finishes บอกเวลาจบ',
  turn:'turn on the lights = เปิดไฟ; turn off the lights = ปิดไฟ ต้องฟัง on / off ด้วย',
  on:'turn on = เปิด; on your left = ทางซ้ายของคุณ ต้องฟังเป็นกลุ่มคำ',
  off:'turn off = ปิด; เปลี่ยน off เป็น on แล้วความหมายตรงข้ามกัน',
  has:'The guest has paid = ลูกค้าจ่ายแล้ว; has + กริยาช่อง 3 ไม่ได้แปลว่ามีในกลุ่มคำนี้',
  have:'We have cleaned = เราทำความสะอาดแล้ว; we are cleaning = เรากำลังทำ ต้องฟังกริยาทั้งกลุ่ม',
  will:'I will check = ฉันจะตรวจสอบ; I am checking = ฉันกำลังตรวจสอบ; I have checked = ฉันตรวจสอบแล้ว',
  check:'I check the court ใช้บอกสิ่งที่ทำเป็นประจำ; I am checking the court บอกว่ากำลังตรวจสอบ',
  clean:'We clean the court บอกสิ่งที่ทำเป็นประจำ; We are cleaning the court บอกว่ากำลังทำ',
  pilates:'Pilates เป็นชื่อการออกกำลังกาย ไม่ใช่รูปพหูพจน์ แม้คำจะลงท้ายด้วย s',
  instructor:'the instructor คือผู้สอน; ในคลาสพิลาทิสใช้เรียกคนที่สอนและดูแลการฝึก',
  reformer:'a reformer คือเครื่องฝึกพิลาทิส; mat class ฝึกบนเสื่อ ส่วน reformer class ใช้เครื่อง',
  socks:'socks เป็นพหูพจน์ของ sock; grip socks = ถุงเท้ากันลื่น',
  class:'a class = คลาสหนึ่งคลาส; หลายคลาสใช้ classes; private class เป็นคลาสส่วนตัว group class เป็นคลาสกลุ่ม',
  place:'one place left in the class = คลาสเหลือที่ว่างหนึ่งที่; place ตรงนี้ไม่ใช่ชื่อสถานที่',
  places:'two places left = เหลือที่ว่างสองที่; จำนวนมากกว่าหนึ่งใช้ places',
  left:'on your left = ทางซ้ายของคุณ; one place left = เหลือที่ว่างหนึ่งที่ ความหมายเปลี่ยนตามกลุ่มคำ',
  equipment:'equipment นับไม่ได้: the equipment ไม่ใช้ an equipment หรือ equipments; ถ้าต้องการนับ ใช้ a piece of equipment',
  private:'a private class = คลาสส่วนตัว ต่างจาก a group class ที่เรียนร่วมกับคนอื่น',
  waiting:'is waiting = กำลังรอ; waiting list เป็นกลุ่มคำนาม หมายถึงรายชื่อรอคิว',
  break:'a break ใน Do you need a break? คือช่วงพัก ไม่ใช่การทำให้สิ่งของแตก',
  leave:'leave your bag = ฝากกระเป๋าไว้; leave the waiting list = ถอนชื่อออกจากรายชื่อรอ; before you leave = ก่อนกลับ',
  springs:'springs ในเครื่องรีฟอร์เมอร์หมายถึงสปริง ไม่ใช่ฤดูใบไม้ผลิ',
  last:'your last class = คลาสสุดท้ายของคุณ; your first class = คลาสแรกของคุณ',
  first:'your first class = คลาสแรกของคุณ; first บอกลำดับ ไม่ใช่จำนวนหนึ่ง',
  hire:'hire a racket = เช่าไม้ ไม่ใช่ซื้อ; buy a racket = ซื้อไม้; racket hire เป็นคำนามหมายถึงการเช่าไม้',
  per:'per court = ต่อสนาม; per person = ต่อคน; per hour = ต่อชั่วโมง ฟังหน่วยหลัง per เพื่อเข้าใจราคา',
  deposit:'deposit คือเงินมัดจำ ไม่ใช่ยอดเต็ม; full amount คือเต็มจำนวน',
  grip:'grip tape = เทปพันด้ามไม้; grip socks = ถุงเท้ากันลื่น ต้องฟังคำที่ตามหลัง grip',
  credit:'a credit ในบริบทการจองคือยอดที่เก็บไว้ใช้บริการครั้งหน้า ต่างจาก refund ที่คืนเงิน',
  return:'return the racket = คืนไม้; return the serve = รับลูกเสิร์ฟ ต้องดูคำที่ตามหลัง',
  serve:'serve ในบทเรียนสนามคือเสิร์ฟลูก ไม่ใช่เสิร์ฟอาหาร; the serve เป็นคำนามหมายถึงลูกเสิร์ฟ',
  point:'the point is over = จบแต้มแล้ว ไม่จำเป็นต้องจบเกมหรือการแข่งขัน',
  glass:'the glass ในสนามหมายถึงกระจก ไม่ใช่แก้วน้ำ; after / before it bounced บอกลำดับเหตุการณ์',
  fifteen:'fifteen = 15; fifty = 50 เสียงและจำนวนต่างกัน',
  fifty:'fifty = 50; fifteen = 15 ฟังตอนท้ายของคำให้ดี',
  score:'fifteen thirty = 15 ต่อ 30; thirty fifteen = 30 ต่อ 15 ลำดับคะแนนสำคัญ',
}
const corpus = countNeighbours(padelQuestions.map(q => q.english))
const uniqueBy = <T,>(items: T[], key: (item: T) => string): T[] => [...new Map(items.map(item => [key(item),item])).values()]
const lexicalNouns = uniqueBy([...nouns,...Object.values(hotelWordProfiles).flatMap(p => p.nouns),...extraNouns],n => n.singular)
const lexicalVerbs = uniqueBy([...verbs,...Object.values(hotelWordProfiles).flatMap(p => p.verbs),...extraVerbs],v => v.base)
export const padelWordProfiles: Record<string,WordProfile> = Object.fromEntries([...corpus].map(([word,row]) => [word,{
  nouns: lexicalNouns.filter(n => nounMatches(n,word)),
  verbs: lexicalVerbs.filter(v => verbMatches(v,word)),
  grammar_note_th: notes[word] ?? hotelWordProfiles[word]?.grammar_note_th,
  before: rankedNeighbours(row.before), after: rankedNeighbours(row.after), occurrences: row.occurrences, corpus_version:'padel-pilates-staff-v1',
}]))
export function padelWordExamples(word: string, context: string) {
  return [...new Set([context,...padelQuestions.map(q => q.english)])].filter(sentence =>
    (sentence.match(/[\p{L}]+(?:[’'][\p{L}]+)*/gu) ?? []).some(token => normalizeHelpWord(token) === normalizeHelpWord(word))).slice(0,2)
}
