import { useSyncExternalStore } from 'react'
export type Language = 'th' | 'en'
let language: Language = localStorage.getItem('classroom-language') === 'en' ? 'en' : 'th'
const listeners = new Set<() => void>()
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener) } }
export const getLanguage = () => language
export function useLanguage() { return useSyncExternalStore(subscribe, getLanguage) }
const english: Record<string,string> = {
'รูปปัจจุบันของ be ใช้กับคำนามพหูพจน์ในรูปแบบนี้':'The present form of be used with plural nouns in this pattern.',
'หลายสิ่ง เช่น shoes หรือ keys จึงใช้ are':'Use are for several things, such as shoes or keys.',
'my และ your ไม่ได้บอกจำนวน ให้ดูคำนามเพื่อเลือก is หรือ are':'my and your do not tell us the number. Look at the noun to choose is or are.',
'แว่นตา glasses และกางเกง trousers ใช้ are แม้มีหนึ่งคู่':'glasses and trousers take are, even for one pair.',
'คำนี้ใช้เป็นพหูพจน์ แม้หมายถึงหนึ่งคู่ จึงใช้ are':'This word is plural, even for one pair, so it takes are.',
'ไม่ตัด s ออกเพื่อบอกว่ามีหนึ่งคู่':'Do not remove s to mean one pair.',
'หลายสิ่ง ใช้ are ในคำถามนี้':'Several things: use are in this question.',
'หนึ่งสิ่ง ใช้ is ในคำถามนี้':'One thing: use is in this question.',

'ทบทวน':'Recall','เรียนรู้':'Learn','ฝึกฝน':'Practise','สรุป':'Review','หลักการ':'The idea','ตัวอย่าง':'Worked example','ข้อผิดพลาดที่พบบ่อย':'Common mistakes',
'ทบทวนรูปประโยค':'Recall the pattern','ถามหาสถานที่':'Ask about a place','เปลี่ยนคำ รูปแบบเดิม':'New words, same pattern','คำเล็ก ๆ ก็สำคัญ':'Small words matter','แข่งม้า':'Horse race','หนึ่งรูปแบบ ใช้ได้หลายที่':'One pattern, many places',
'บทเรียนที่ 1':'Lesson 1','ขั้นตอนการเรียน':'Class stages','Lesson 01':'Lesson 01','กลับไปที่ประโยค':'Back to the sentence','ฟังประโยค':'Play sentence','เล่นเสียงไม่ได้ ลองกดอีกครั้ง':'Could not play audio. Try again.',
'คำถาม':'Question words','กริยา be':'The verb be','คำกำหนดนาม':'Determiners','คำนาม':'Nouns','การทำงานของช่องนี้':'How this slot works','ข้อควรรู้ในการใช้':'Using this word','เลือกคำ':'Choose a word',
'หน้าที่':'Role','ความสัมพันธ์':'Connection','รูปคำ':'Form','ลำดับ':'Word order','ตำแหน่ง':'Position','จำนวน':'Number','ความหมาย':'Meaning','การใช้':'Usage','คำตอบที่คาดหวัง':'Expected answer','ใช้กับ':'Used with','เวลาและประธาน':'Time and subject','ความหมายภาษาไทย':'Thai meaning','รู้ได้จาก':'How we identify it','คำแปล':'Translation','ผู้ฟัง':'Listener',
'กำหนดว่าผู้ฟังควรตอบด้วยข้อมูลประเภทไหน':'Tells the listener what kind of information to answer with.',
'ระบุข้อมูลที่ผู้ถามยังไม่รู้':'Identifies the information the speaker wants to find out.',
'ทำงานร่วมกับส่วนที่เหลือของคำถาม เพื่อบอกว่าต้องการรู้อะไรเกี่ยวกับสิ่งนั้น':'Works with the rest of the question to show what we want to know.',
'เชื่อมประธานกับข้อมูล เช่น ตัวตน ลักษณะ หรือสถานที่ และแสดงเวลา':'Connects the subject to an identity, quality or location, and expresses time.',
'เลือกตามประธานและเวลา ไม่ได้เลือกจากเวลาอย่างเดียว':'The form depends on both the subject and time—not time alone.',
'ในคำถามตรง be มักอยู่หน้าประธาน ส่วนในประโยคบอกเล่าอยู่หลังประธาน':'In direct questions, be usually comes before the subject; in statements, it follows the subject.',
'ช่วยระบุว่าคำนามหมายถึงสิ่งไหน ของใคร หรือจำนวนเท่าใด':'Helps identify which one, whose, or how many the noun refers to.',
'อยู่หน้าคำนาม และอาจมีคำขยายคั่นกลาง':'Comes before the noun, with describing words sometimes in between.',
'ทำงานร่วมกับคำนามเป็นกลุ่มเดียวกัน ต้องเลือกให้เหมาะกับจำนวนและชนิดของคำนาม':'Forms a group with the noun. Choose a determiner that suits its number and type.',
'ระบุคน สถานที่ สิ่งของ หรือแนวคิดที่เราพูดถึง':'Names the person, place, thing or idea we are talking about.',
'คำนามนับได้มีรูปเอกพจน์และพหูพจน์ ส่วนคำนามนับไม่ได้ใช้ต่างออกไป':'Countable nouns have singular and plural forms. Uncountable nouns work differently.',
'จำนวนและชนิดของคำนามมีผลต่อคำกำหนดนาม และอาจมีผลต่อรูปกริยา':'The noun’s number and type affect its determiner and can affect the verb form.',
'ถามหาสถานที่หรือตำแหน่ง':'Asks about a place or location.',
'สถานที่หรือตำแหน่ง ไม่ใช่ชื่อคนหรือเวลา':'A place or location, rather than a person’s name or a time.',
'ใช้ถามทั้งตำแหน่ง ที่มา หรือจุดหมาย โดยดูร่วมกับคำอื่นในคำถาม':'Can ask about location, origin or destination, depending on the other words in the question.',
'รูปปัจจุบันของกริยา be สำหรับประธานบุรุษที่สามเอกพจน์':'The present form of be for a third-person singular subject.',
'he, she, it หรือคำนามเอกพจน์':'he, she, it or a singular noun',
'is เป็นปัจจุบัน แต่ประธาน I ใช้ am และ you ใช้ are แม้หมายถึงคนเดียว':'is is present tense, but I takes am and you takes are—even for one person.',
'คำแปลขึ้นอยู่กับการใช้ บางครั้งภาษาไทยไม่ต้องมีคำแปลแยก':'The Thai translation depends on the use. Sometimes there is no separate Thai word.',
'สิ่งที่ผู้พูดและผู้ฟังระบุได้':'Something the speaker and listener can identify',
'ชี้ว่าหมายถึงคนหรือสิ่งที่รู้กันว่าอันไหน':'Points to an identifiable person or thing.',
'สิ่งที่พูดถึงก่อนหน้า สถานการณ์ร่วมกัน หรือคำขยายที่ระบุชัด':'An earlier mention, a shared situation, or words that identify it clearly.',
'ใช้ได้กับคำนามเอกพจน์ พหูพจน์ และคำนามนับไม่ได้':'Works with singular, plural and uncountable nouns.',
'ภาษาไทยมักไม่แปล the เป็นคำแยก และไม่ได้หมายถึง “นี้” เสมอไป':'Thai often has no separate translation for the. It does not always mean “this”.',
'บอกความเป็นเจ้าของหรือความสัมพันธ์กับผู้พูด':'Shows ownership or a relationship to the speaker.',
'ใช้หน้าคำนาม ไม่ใช้เดี่ยวแทนคำนาม':'Used before a noun, not alone in place of one.',
'รูป my ไม่เปลี่ยนตามจำนวนของสิ่งที่พูดถึง':'my stays the same whether we refer to one thing or several.',
'ใช้กับครอบครัวและความสัมพันธ์ได้ ไม่จำเป็นต้องเป็นสิ่งของที่เป็นเจ้าของ':'Also describes family and relationships, not only things we own.',
'บอกความเป็นเจ้าของหรือความสัมพันธ์กับผู้ฟัง':'Shows ownership or a relationship to the listener.',
'ใช้ได้ทั้งกับผู้ฟังคนเดียวและหลายคน':'Can refer to one listener or several listeners.',
'รูป your ไม่เปลี่ยนตามจำนวนของสิ่งที่พูดถึง':'your stays the same whether we refer to one thing or several.',
'คำนามนับได้ ใช้เรียกสถานที่หรือสิ่งของ':'A countable noun naming a place or thing.',
'รูปที่แสดงเป็นเอกพจน์ หมายถึงหนึ่งหน่วย':'This is the singular form: one unit.',
'เมื่อใช้คำนามนับได้เอกพจน์ในประโยค โดยทั่วไปต้องมีคำกำหนดนามอยู่ข้างหน้า':'A singular countable noun in a sentence generally needs a determiner before it.',
'ในรูปแบบนี้ ต้องมีทั้ง':'This pattern needs both','และ':'and','✓ ครบทั้งสี่ส่วน':'✓ All four parts are present','ยังขาด':'Missing','เปรียบเทียบรูปแบบ':'Compare patterns','ครบทุกคำ':'All words','ไม่มี':'Without',
'จำรูปแบบ แล้วเปลี่ยนแค่คำท้าย':'Keep the pattern and change the last word.','ถามว่าที่ไหน':'Asks where','เก็บสองคำนี้ไว้':'Keep these two words','เปลี่ยนสิ่งที่ถามหา':'Change what you ask about','เข้าห้องแข่ง':'Join the race',
'ฟังคำถาม แล้วเลือกคำตอบบนมือถือ':'Listen to the question and answer on your phone.','ตอบถูกและเร็ว ม้าจะวิ่งเร็วขึ้น':'Answer correctly and quickly to make your horse run faster.','สแกนเพื่อเข้าร่วม':'Scan to join','ใส่ชื่อ แล้วรอเริ่มแข่ง':'Enter your name, then wait for the race.','ก่อนแข่ง · ดูหน้าจอและตัวอย่างคำถาม':'Before the race · See the controls and sample questions',
'สถานที่':'Location','เวลา':'Time','สิ่งไหนหรือของใคร':'Which one or whose','คนหรือสิ่งที่พูดถึง':'Person or thing',
}
Object.assign(english, {
'ก่อนแข่ง ดูหน้าจอและตัวอย่างคำถาม':'Before the race: controls and sample questions',
'ก่อนแข่ง':'Before the race','ดูจอใหญ่ → ตอบบนมือถือ':'Watch the big screen → Answer on your phone','วินาที / ข้อ':'seconds per question','รูปแบบที่ครูเลือก':'Teacher’s question mode',
'บนมือถือของนักเรียน':'On the student’s phone','หน้าจอจริง มีม้า แถบเวลา และปุ่มไม่ถูกต้องกับถูกต้อง':'Game screen with a horse, timer and incorrect/correct buttons','หน้าจอจริง มีม้า แถบเวลา และคำตอบภาษาไทยสองตัวเลือก':'Game screen with a horse, timer and two Thai answer choices',
'ภาพจากเกมจริง · คำตอบเปลี่ยนตามข้อ':'Actual game screen · Answers change with each question','คำถามอยู่บนจอห้องเรียน':'The question is on the classroom screen','ดูประโยคและฟังเสียง แล้วตอบบนมือถือ':'Look at the sentence, listen, then answer on your phone.','อ่านประโยคบนจอ แล้วเลือกความหมายบนมือถือ':'Read the sentence on screen, then choose its meaning on your phone.',
'ตัวอย่างจากชุดคำถาม':'Examples from the question set','ตัวอย่างสอนก่อนแข่ง มีคำแปลช่วย · ในเกมดูภาษาอังกฤษบนจอใหญ่':'These examples include translations. During the race, watch the English on the big screen.',
'ลองเลือกคำตอบ':'Try an answer','✓ ถูกต้อง':'✓ Correct','ลองอีกครั้ง':'Try again','ถูกต้อง':'Correct','ไม่ถูกต้อง':'Incorrect',
'✓ ตอบถูกและเร็ว → ม้าวิ่งเร็วขึ้น':'✓ Correct and fast → Your horse speeds up','✦ ถูกติดกัน 5 ข้อ → ม้าสีทอง':'✦ Five correct in a row → Golden horse','← ปัดซ้าย = ผิด · ปัดขวา = ถูก →':'← Swipe left = Incorrect · Swipe right = Correct →',
'สแกน QR → ใส่ชื่อ → รอครูเริ่ม':'Scan QR → Enter your name → Wait for the teacher','ตรวจรูปประโยค':'Check the sentence','เลือกความหมาย':'Choose the meaning','คำถามในชุด':'questions in this set',' · ครูเลือกคำที่จะใช้ได้':' · The teacher can choose the words',
'เลือกความหมาย · ของฉัน / ของคุณ':'Choose the meaning · my / your','เลือกความหมาย · สถานที่':'Choose the meaning · places','ประโยคถูกหรือผิด':'Correct or incorrect sentence',
'ครบทุกส่วน':'All parts present','ขาดคำเชื่อม':'Missing the linking verb','ขาดคำหน้าคำนาม':'Missing the determiner','เลือกความหมายให้ตรงกัน':'Match the meaning','ประโยคครบทั้งสี่ส่วน':'The sentence has all four parts.','ช่องที่สองหายไป ต้องมีคำเชื่อมก่อนคำหน้าคำนาม':'Slot two is missing: this pattern needs the linking verb before the determiner.','ช่องที่สามหายไป ต้องมีคำหน้าคำนามในรูปแบบนี้':'Slot three is missing: this pattern needs a determiner before the noun.',
'สิ่งเดียวกัน แต่เป็นของใคร?':'The same thing—but whose?','ถามที่ไหน หรือถามอย่างอื่น?':'Asking where, or asking something else?','ของฉัน = ของคนพูด อย่าสลับกับของคนที่เราพูดด้วย':'my refers to the speaker, not the listener.','ของคุณ = ของคนที่เราพูดด้วย อย่าสลับกับของคนพูด':'your refers to the listener, not the speaker.','คำถามนี้ถามตำแหน่ง ไม่ได้ถามราคา หรือถามว่าอยู่ที่นี่ใช่ไหม':'This asks about location—not price, or whether something is here.'
})
Object.assign(english, {'เลือก is / are ให้ตรงกับจำนวน':'Match is / are to the number','จำนวนตรงกัน':'Matching number','จำนวนไม่ตรงกัน':'Number mismatch','สิ่งเดียวใช้ is · หลายสิ่งใช้ are · my / your ไม่ได้บอกจำนวน':'One takes is; more than one takes are. my / your do not tell us the number.'})
const thai: Record<string,string> = {'Lesson 02':'บทเรียน 02','Lesson 01':'บทเรียน 01','Race together':'แข่งไปด้วยกัน','Correct or wrong':'ถูกหรือผิด','Choose the meaning':'เลือกความหมาย','Listen for the complete sentence.':'ฟังว่าประโยคครบหรือไม่','Listen carefully to which person or thing the question means.':'ฟังให้ดีว่าคำถามหมายถึงคนไหนหรือสิ่งไหน','Scan to join the class race':'สแกนเพื่อเข้าร่วมการแข่งขัน','Race unavailable':'เปิดการแข่งขันไม่ได้','Opening the room…':'กำลังเปิดห้อง…','Open on phone ↗':'เปิดบนมือถือ ↗','Starting…':'กำลังเริ่ม…','Go →':'เริ่ม →','joined':'เข้าร่วมแล้ว','Reconnect':'เชื่อมต่อใหม่','Back to lobby':'กลับห้องรอ','Race finished':'จบการแข่งขัน','It’s a tie!':'เสมอกัน!','wins!':'ชนะ!','Class race':'การแข่งขันในชั้นเรียน','Could not open the race.':'เปิดการแข่งขันไม่ได้','Could not show the QR code. Please retry.':'แสดงคิวอาร์โค้ดไม่ได้ กรุณาลองอีกครั้ง','Could not update the race.':'อัปเดตการแข่งขันไม่ได้','Could not prepare the race.':'เตรียมการแข่งขันไม่ได้'}
Object.assign(thai, {'The public race server is unavailable. Please retry.':'เชื่อมต่อเซิร์ฟเวอร์การแข่งขันไม่ได้ กรุณาลองอีกครั้ง','Could not connect. Please try again.':'เชื่อมต่อไม่ได้ กรุณาลองอีกครั้ง','Connection lost. Reconnecting…':'การเชื่อมต่อขัดข้อง กำลังเชื่อมต่อใหม่…','Race lobby':'ห้องรอการแข่งขัน','End race':'จบการแข่งขัน','Join the race':'เข้าร่วมการแข่งขัน','Scan to join this race':'สแกนเพื่อเข้าร่วมการแข่งขัน','Connect the laptop to Wi-Fi to show the QR code.':'เชื่อมต่อคอมพิวเตอร์กับไวไฟเพื่อแสดงคิวอาร์โค้ด','Open player screen ↗':'เปิดหน้าจอผู้เล่น ↗','ready':'พร้อมแล้ว','Start race →':'เริ่มแข่ง →','Admin':'ตั้งค่า','Race track screen':'หน้าจอสนามแข่ง','Sound on':'เปิดเสียง','Sound off':'ปิดเสียง','Retry audio':'เล่นเสียงอีกครั้ง','answered':'ตอบแล้ว','Next race →':'การแข่งขันถัดไป →'})
Object.assign(thai, {'Lesson races':'การแข่งขันของบทเรียน','Race':'รอบที่','Previous race':'รอบก่อนหน้า','Next race':'รอบถัดไป','Add race':'เพิ่มรอบ'})
Object.assign(thai, {
'Race ahead':'แข่งให้เร็วขึ้น','How to play':'วิธีเล่น','Listen. Is the English sentence correct?':'ฟัง แล้วตัดสินว่าประโยคภาษาอังกฤษถูกต้องหรือไม่',
'Listen. Which Thai meaning matches?':'ฟัง แล้วเลือกความหมายภาษาไทยให้ตรงกัน',
'Listen to the question. Answer on your phone.':'ฟังคำถาม แล้วตอบบนมือถือ',
'Listen':'ฟัง','English on the main screen':'ฟังภาษาอังกฤษจากหน้าจอหลัก','Choose':'เลือก',
'Swipe left for wrong. Right for correct.':'ปัดซ้ายเมื่อผิด ปัดขวาเมื่อถูก',
'Tap one of the two Thai answers.':'แตะเลือกคำตอบภาษาไทยหนึ่งในสองข้อ',
'Follow the answer controls on your phone.':'ตอบด้วยปุ่มบนหน้าจอมือถือ',
'Fast, correct answers build speed.':'ตอบถูกและเร็ว ม้าจะวิ่งเร็วขึ้น',
'Answer controls':'วิธีตอบ','Your phone':'หน้าจอมือถือ','Your answer':'คำตอบของคุณ',
'Wrong':'ผิด','Correct':'ถูก','Meaning 1':'ความหมายที่ 1','Meaning 2':'ความหมายที่ 2',
'seconds per question':'วินาทีต่อคำถาม','Join · QR':'เข้าร่วม · QR'
})
export function t(text:string):string { if(language === 'en' && text.startsWith('คำตอบต้องหมายถึง')) return text.replace('คำตอบต้องหมายถึง', 'The answer must mean'); return (language === 'en' ? english[text] : thai[text]) ?? text }
export function syncClassroomLanguage() {
 document.documentElement.lang=language
 const number=new URLSearchParams(location.search).get('lesson')==='2'?'2':'1'
 document.title=language==='th'?`บทเรียนที่ ${number} · English Success`:`Lesson ${number} · English Success`
 document.querySelectorAll<HTMLElement>('[data-ui-label]').forEach(el=>{el.textContent=t(el.dataset.uiLabel!)})
 document.querySelector('.phases')?.setAttribute('lang',language)
 document.querySelector('.phases')?.setAttribute('aria-label',t('ขั้นตอนการเรียน'))
 document.querySelector('.index')?.setAttribute('aria-label',language==='th'?`บทเรียนที่ ${number}`:`Lesson ${number}`)
}
export function setLanguage(next:Language) {language=next;localStorage.setItem('classroom-language',next);syncClassroomLanguage();listeners.forEach(listener=>listener())}
