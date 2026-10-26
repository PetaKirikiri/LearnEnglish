import type { JSONContent } from '@tiptap/core'
import { holidayVocabulary, type HolidayWord } from './holidayVocabulary'

// Ka Piki Local Docs Lesson 1:2: familiar meaning -> notice -> connection ->
// explanation -> another example -> takeaway. Layout is editable document data.
const p = (text: string, level?: number): JSONContent => ({ type: level ? 'heading' : 'paragraph', ...(level ? { attrs: { level } } : {}), content: text.split('**').filter(Boolean).map((part) => ({ type: 'text', text: part })) })
const layout = (variant: string, ...content: JSONContent[]): JSONContent => ({ type: 'lessonLayout', attrs: { variant }, content })
const label = (text: string) => layout('label', p(text))
const example = (word: HolidayWord): JSONContent => {
  const item = holidayVocabulary.find(item => item.word === word)!
  return { type: 'lessonExample', attrs: {
    english: `Where is the ${word}?`, thai: `${item.thai}อยู่ที่ไหน`,
    units: [{ english: 'Where', thai: 'ที่ไหน' }, { english: 'is', thai: 'อยู่' }, { english: 'the', thai: 'ที่กำลังพูดถึง' }, { english: `${word}?`, thai: item.thai }],
  } }
}
const section = (id: string, number: string, title: string, ...content: JSONContent[]): JSONContent => ({
  type: 'lessonLayout', attrs: { variant: 'teaching', anchor: id }, content: [label(number), p(title, 2), ...content],
})
export const raceLessonSeed: JSONContent = { type: 'doc', content: [
  layout('hero', label('ก่อนเริ่มแข่ง · ถามหาสถานที่'), p('Where is the…?', 1), p('อยู่ที่ไหน?'), p('รูปแบบเดียว · ใช้ถามหาได้หลายที่')),
  section('where', '01 · เริ่มจากความหมาย', 'รู้จักโรงแรม แต่ไม่รู้ว่าอยู่ที่ไหน',
    p('เวลาเราหาโรงแรม เราถามว่า “โรงแรมอยู่ที่ไหน?”'),
    layout('soft', p('โรงแรมอยู่ที่ไหน?', 3), { type: 'lessonExample', attrs: { english: 'Where?', thai: 'ที่ไหน?', units: [{ english: 'Where?', thai: 'ที่ไหน?' }] } }),
    p('Where ใช้ถามหาตำแหน่งหรือสถานที่ ให้มองหาคำนี้ก่อน'),
    p('ภาษาไทยวาง “ที่ไหน” ไว้ท้ายประโยค รูปแบบภาษาอังกฤษที่เราจะเรียนเริ่มด้วย Where'),
    p('เปลี่ยนจากหาโรงแรมเป็นหาห้องน้ำ ก็ยังถามว่า “ที่ไหน?” เหมือนเดิม'),
    layout('star', p('Where → ถามว่า “ที่ไหน?”'))),
  section('pattern', '02 · คำเล็ก ๆ ช่วยต่อประโยค', 'ถามเรื่องเดิม เรียงคำอีกแบบ',
    p('เมื่อรู้ว่า Where ถามหาสถานที่แล้ว ลองดูคำที่ช่วยต่อประโยค'), example('hotel'),
    layout('grid', layout('soft', p('is', 3), p('ในประโยคถามสถานที่นี้ ใช้เชื่อมกับสิ่งหนึ่งที่เราถามว่า “อยู่ที่ไหน”')), layout('star', p('the', 3), p('บอกว่าหมายถึงโรงแรมที่เรากำลังพูดถึง ไม่ใช่โรงแรมไหนก็ได้'))),
    p('ถ้าจะถามหาห้องน้ำ ใช้รูปแบบเดิม แล้วเปลี่ยนแค่คำท้าย'), example('toilet'),
    layout('star', p('ในรูปแบบที่เรียนวันนี้ เก็บ Where is the ไว้ด้วยกัน แล้วต่อด้วยคำที่ต้องการถามหา'))),
  section('words', '03 · คำที่จะเจอในการแข่ง', 'คำเปลี่ยน รูปแบบยังเหมือนเดิม',
    p('รู้จักความหมายของแต่ละคำ แล้วลองวางลงในประโยค'),
    { type: 'holidayWords' },
    p('สังเกตว่า Where is the ไม่เปลี่ยน มีแค่คำที่เราถามหาเปลี่ยนไป'),
    layout('star', p('ไม่ต้องจำทุกประโยคแยกกัน จำรูปแบบหนึ่งชุด แล้วเปลี่ยนคำที่ถามหา'))),
  section('race', '04 · ใช้สิ่งที่เพิ่งเรียน', 'ในการแข่ง ดูอะไรบ้าง?',
    p('คำถามใช้รูปแบบและคำศัพท์ชุดนี้ ครูเลือกกิจกรรมได้สองแบบ'),
    layout('grid',
      layout('soft', p('✓ / ✕', 2), p('ประโยคครบไหม?', 3), p('ดูว่ามี is และ the ครบในรูปแบบที่เรียนหรือไม่'), p('Correct · ถูก     Wrong · ผิด')),
      layout('soft', p('1 / 2', 2), p('ถามหาที่ไหน?', 3), p('อ่านหรือฟังคำถามภาษาอังกฤษ แล้วเลือกความหมายภาษาไทยที่ตรงกัน'), p('เช่น โรงแรมอยู่ที่ไหน / ห้องน้ำอยู่ที่ไหน'))),
    layout('star', p('เริ่มจาก Where → ดู is the → ดูว่าถามหาอะไร'))),
] }
