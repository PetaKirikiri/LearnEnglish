import type { JSONContent } from '@tiptap/core'
const p = (text: string, level?: number): JSONContent => ({ type: level ? 'heading' : 'paragraph', ...(level ? { attrs: { level } } : {}), content: [{ type: 'text', text }] })
const box = (variant: string, ...content: JSONContent[]): JSONContent => ({ type: 'lessonLayout', attrs: { variant }, content })
const example = (verb: 'is' | 'are', owner: 'the' | 'my' | 'your', noun: string, thai: string): JSONContent => ({ type: 'lessonExample', attrs: {
  english: `Where ${verb} ${owner} ${noun}?`, thai: `${thai}${owner === 'my' ? 'ของฉัน' : owner === 'your' ? 'ของคุณ' : ''}อยู่ที่ไหน`,
  units: [{ english: 'Where', thai: 'ที่ไหน' }, { english: verb, thai: 'อยู่' }, { english: owner, thai: owner === 'the' ? 'ที่กำลังพูดถึง' : owner === 'my' ? 'ของฉัน' : 'ของคุณ' }, { english: `${noun}?`, thai }],
} })
const word = (english: string, thai: string): JSONContent => ({ type: 'lessonExample', attrs: { english, thai, units: [{ english, thai }] } })
const section = (number: string, title: string, ...content: JSONContent[]) => box('teaching', box('label', p(number)), p(title, 2), ...content)
export const pluralLessonSeed: JSONContent = { type: 'doc', content: [
  box('hero', box('label', p('27 ตุลาคม 2026 · บทเรียน 2')), p('Where are my…?', 1), p('ของฉันอยู่ที่ไหน?'), p('จากสิ่งเดียว → หลายสิ่ง · ของฉัน → ของคุณ')),
  section('01 · ทบทวน', 'ยังถามว่า “อยู่ที่ไหน?”',
    example('is', 'the', 'shop', 'ร้านค้า'), p('เริ่มจากคำที่รู้แล้ว: shop หมายถึงร้านค้า ถ้าถามหาร้านเดียว ใช้ is')),
  section('02 · หนึ่ง → หลาย', 'เปลี่ยนจำนวน จึงเปลี่ยน is เป็น are',
    box('grid', box('soft', p('●', 2), example('is', 'the', 'shop', 'ร้านค้า')), box('star', p('● ● ●', 2), example('are', 'the', 'shops', 'ร้านค้าหลายร้าน'))),
    p('shop → shops เติม s เพื่อบอกว่ามีหลายร้าน ในคำถามนี้จึงใช้ are แทน is ส่วน Where และ the ยังเหมือนเดิม'),
    box('star', p('สิ่งเดียว: is · หลายสิ่ง: are'))),
  section('03 · ลองกับของใกล้ตัว', 'รองเท้าหนึ่งข้าง → หลายข้าง',
    word('shoe', 'รองเท้าหนึ่งข้าง'), word('shoes', 'รองเท้าหลายข้าง'),
    box('grid', box('soft', p('●', 2), example('is', 'the', 'shoe', 'รองเท้าข้างนั้น')), box('star', p('● ●', 2), example('are', 'the', 'shoes', 'รองเท้าเหล่านั้น'))),
    p('รองเท้าสองข้างก็มีมากกว่าหนึ่งข้างแล้ว จึงใช้ shoes กับ are')),
  section('04 · ของฉัน', 'ถามหารองเท้าของตัวเอง',
    word('my', 'ของฉัน'), p('my บอกว่าของนั้นเป็นของผู้พูด วางแทน the หน้าคำนาม'),
    example('are', 'my', 'shoes', 'รองเท้า'),
    p('เปลี่ยนเฉพาะช่องเจ้าของ ส่วนคำถามและจำนวนยังเหมือนเดิม'),
    box('star', p('ใช้คำบอกเจ้าของแทนคำชี้เฉพาะ ไม่ใส่ทั้งสองคำในช่องเดียวกัน'))),
  section('05 · ของคุณ', 'ถามเพื่อนว่ารองเท้าของเขาอยู่ที่ไหน',
    word('your', 'ของคุณ'), example('are', 'your', 'shoes', 'รองเท้า'),
    p('my = ของผู้พูด · your = ของคนที่เรากำลังพูดด้วย ไม่ได้บอกจำนวนสิ่งของ'),
    box('grid', box('soft', p('●', 2), example('is', 'my', 'shoe', 'รองเท้าข้างหนึ่ง')), box('star', p('● ●', 2), example('are', 'my', 'shoes', 'รองเท้า'))),
    p('my และ your ใช้ได้ทั้งสิ่งเดียวและหลายสิ่ง ให้ดูคำนามเพื่อเลือก is หรือ are')),
  section('06 · เปลี่ยนคำท้าย', 'รูปแบบเดิม ใช้กับของที่เรามักหา',
    p('ลองทีละคำ เริ่มจาก shoes แล้วเปลี่ยน my เป็น your'), { type: 'pluralWords' },
    box('star', p('เรียงสี่ช่องเดิม แล้วเลือกเจ้าของกับสิ่งของที่ต้องการถามหา'))),
  section('07 · สองคำที่ใช้เป็นพหูพจน์', 'แว่นตาและกางเกงก็ใช้ are',
    word('glasses', 'แว่นตา'), example('are', 'my', 'glasses', 'แว่นตา'),
    word('trousers', 'กางเกงขายาว'), example('are', 'your', 'trousers', 'กางเกงขายาว'),
    p('ภาษาอังกฤษใช้ glasses และ trousers เป็นพหูพจน์ แม้หมายถึงแว่นตาหนึ่งอันหรือกางเกงหนึ่งตัว จึงใช้ are ในคำถามแบบนี้'),
    p('อย่าตัด s ออกเพื่อพูดถึงแว่นตาหนึ่งอัน: glass หมายถึงแก้วหรือกระจก ไม่ใช่แว่นตาหนึ่งอัน')),
  section('08 · ลองพูด', 'เปลี่ยนทีละอย่าง',
    p('เริ่มจากตัวอย่างร้านค้า เปลี่ยนจากหนึ่งร้านเป็นหลายร้านตามตารางด้านบน'),
    p('ใช้ตารางรองเท้าด้านบน แล้วเปลี่ยนช่องเจ้าของจากของฉันเป็นของคุณ'),
    p('จากนั้นชี้คำศัพท์ทีละคำ ให้ผู้เรียนถามด้วย my แล้วถามเพื่อนด้วย your เมื่อคล่องแล้วค่อยสลับสิ่งเดียวกับหลายสิ่ง'),
    box('star', p('ดูจำนวน → เลือก is / are · ดูเจ้าของ → เลือก my / your'))),
] }
