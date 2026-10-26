import { everydayActions } from './generalContent'
// Course-local senses: do not replace shared dictionary entries used by other
// products. These forms occur in more than one role in the listening bank.
export const courseMeaningOverrides:Record<string,string>={
  book:'หนังสือ / จอง (ดูความหมายจากประโยค)',books:'หนังสือหลายเล่ม / จอง',
  water:'น้ำ / รดน้ำ',free:'ว่าง / ไม่มีค่าใช้จ่าย',
  call:'โทรหา / เรียก',calls:'โทรหา / เรียก',called:'โทรหา / เรียก / เรียกว่า',
  order:'สั่ง / คำสั่ง / ลำดับ',orders:'สั่ง / คำสั่งหลายข้อ',
  return:'คืน / กลับ',returns:'คืน / กลับ',returned:'คืนแล้ว / กลับมาแล้ว',
}
const verbs:Record<string,string>={
  open:'เปิด',close:'ปิด',wash:'ล้าง / ซัก',clean:'ทำความสะอาด',repair:'ซ่อม',move:'ย้าย',call:'โทรหา / เรียก',
  visit:'ไปเยี่ยม',help:'ช่วย',photograph:'ถ่ายรูป',feed:'ให้อาหาร / ป้อนอาหาร',wrap:'ห่อ',cook:'ทำอาหาร',
  prepare:'เตรียม',bake:'อบ',order:'สั่ง',cut:'หั่น / ตัด',collect:'เก็บ / รับ',write:'เขียน',send:'ส่ง',check:'ตรวจ',
  arrange:'จัด',print:'พิมพ์',read:'อ่าน',finish:'ทำให้เสร็จ',draw:'วาด',explain:'อธิบาย',spell:'สะกด',return:'คืน / กลับ',
  buy:'ซื้อ',choose:'เลือก',carry:'ถือ / ขน',book:'จอง',pack:'จัดกระเป๋า / บรรจุ',study:'ศึกษา',play:'เล่น',watch:'ดู',
  water:'รดน้ำ',start:'เริ่ม',record:'บันทึกเสียง',
}
// Inflected forms share a contextual lexical meaning here. The sentence and
// contrast, not a misleading one-word Thai tense marker, teach time/aspect.
export const generalGlosses:Record<string,string>={
  eat:'กิน',eats:'กิน',eating:'กิน',drink:'ดื่ม',drinks:'ดื่ม',drank:'ดื่ม (อดีตของ drink)',drinking:'ดื่ม',
  talk:'พูด',talks:'พูด',talked:'พูด (อดีตของ talk)',talking:'พูด',
  go:'ไป',goes:'ไป',went:'ไป (อดีตของ go)',going:'ไป',come:'มา',coming:'มา',want:'ต้องการ',wants:'ต้องการ',
  ...Object.fromEntries(everydayActions.flatMap(a=>[a.base,a.third,a.past,a.participle,a.ing].map(w=>[w,verbs[a.base]]))),
  alone:'คนเดียว',ate:'กิน (อดีตของ eat)',baby:'ทารก',bigger:'ใหญ่กว่า',broken:'เสีย / แตก',cake:'เค้ก',camera:'กล้องถ่ายรูป',
  computer:'คอมพิวเตอร์',cups:'ถ้วยหลายใบ',difficult:'ยาก',documents:'เอกสาร',easier:'ง่ายกว่า',email:'อีเมล',
  encouraged:'ให้กำลังใจ',faster:'เร็วกว่า',followed:'เดินตาม',groceries:'ของกินของใช้ที่ซื้อมา',guitar:'กีตาร์',
  heavier:'หนักกว่า',hungry:'หิว',invited:'เชิญ',lesson:'บทเรียน',message:'ข้อความ',met:'พบ',older:'เก่ากว่า / อายุมากกว่า',
  parcel:'พัสดุ',park:'สวนสาธารณะ',present:'ของขวัญ',reminded:'เตือนให้จำ',report:'รายงาน',shop:'ร้านค้า',
  spicy:'เผ็ด',thirsty:'กระหายน้ำ',trusted:'ไว้ใจ',umbrella:'ร่ม',understood:'เข้าใจ',warmer:'อุ่นกว่า',welcomed:'ต้อนรับ',
  wider:'กว้างกว่า',worried:'กังวล',thanked:'ขอบคุณ',parents:'พ่อแม่',clothes:'เสื้อผ้า',flowers:'ดอกไม้',
  asleep:'หลับอยู่',awake:'ตื่นอยู่',cold:'หนาว / เย็น',busy:'ยุ่ง',happy:'มีความสุข',
  sugar:'น้ำตาล',whom:'ใคร / ผู้ที่ (เป็นผู้รับการกระทำ)',
}
