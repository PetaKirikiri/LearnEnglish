import type { QuizQuestion } from './quizContent'
import { examVocabularyVariants } from '../content/examVocabularyVariants'
import { readings } from '../content/readings'

type Row = [string, string, string, string, string, string, string]
// target suffix, prompt, answer, three distractors, Thai clue.
const dialoguePractice: Row[] = [
 ['where-bedroom','Where is the kitchen?','Next to the dining room.','There are two sinks.','It is a lamp.','At seven.','Where ถามตำแหน่ง ตอบ Next to ตามด้วยสถานที่'],
 ['what-bedroom','What is this on the table?','This is a lamp.','On the first floor.','At night.','I am ten.','What is this ถามชื่อสิ่งของหนึ่งชิ้น ตอบ This is a ...'],
 ['bathroom','What is in the kitchen?','There is a stove.','It is next to my room.','At noon.','I ride a bike.','What is in ถามสิ่งที่มีในห้อง ไม่ใช่ตำแหน่งของห้อง'],
 ['living-room','What’s in the dining room?','There is a table.','On the ground floor.','In the morning.','I drive a car.','What’s in ถามสิ่งที่อยู่ข้างใน ตอบ There is กับหนึ่งสิ่ง'],
 ['plural-sinks','What is in the room? There _____ three lamps.','are','is','am','be','three lamps มีสามชิ้น ใช้ There are'],
 ['singular-tv','What is in the kitchen? There _____ a refrigerator.','is','are','am','be','a refrigerator เป็นหนึ่งเครื่อง ใช้ There is'],
 ['where-question','_____ is the dining room? Beside the kitchen.','Where','When','Who','How many','Beside the kitchen บอกตำแหน่ง คำถามใช้ Where'],
 ['what-question','_____ is in the kitchen? There is a stove.','What','When','Who','How many','คำตอบบอกสิ่งของที่มีอยู่ คำถามใช้ What is in'],
 ['singular-desk','What is this? This _____ a mirror.','is','are','am','be','This และ a mirror เป็นเอกพจน์ ใช้ is'],
 ['plural-chairs','What is in the room? There are two _____.','lamps','lamp','a lamp','a lamps','two ต้องตามด้วยนามพหูพจน์ lamps ไม่เติม a'],
 ['plural-identify','What are these by the door?','These are my shoes.','This is my lamp.','On the second floor.','At six.','What are these ถามชื่อของหลายชิ้น ตอบ These are'],
 ['these-plural','What _____ those beside the table?','are','is','am','be','those เป็นหลายสิ่ง จับคู่กับ are'],
 ['those-response','What are these? _____ are my shoes.','These','This','That','It','these เป็นพหูพจน์ คำตอบใช้ These are'],
 ['where-response','Where is the bathroom?','It is beside the bedroom.','There is a sink.','These are my shoes.','It is a couch.','Where ถามตำแหน่ง ต้องตอบว่าห้องอยู่ที่ไหน'],
 ['two-items','There is both a stove _____ a sink in the kitchen.','and','or','but','because','both ... and ... เชื่อมสิ่งสองอย่างที่มีร่วมกัน'],
 ['contracted-whats','_____ in the bathroom? There is a bathtub.','What’s','Where’s','When’s','Who’s','What’s ย่อมาจาก What is ถามว่ามีอะไรอยู่ในห้อง'],
]
const dialogueAssessment: Row[] = [
 ['where-bedroom','Where is your living room?','On the first floor.','There is a couch.','It is a window.','Tomorrow.','Where ถามสถานที่ On the first floor บอกตำแหน่ง'],
 ['what-bedroom','What is that beside the bed?','That is a dresser.','Next to the bathroom.','In the evening.','I am fine.','What is that ถามชื่อสิ่งของ ตอบ That is a ...'],
 ['bathroom','What is in the bedroom?','There is a bed.','It is on the second floor.','At midnight.','I go by train.','What is in ถามสิ่งที่มีในห้อง ตอบ There is a bed'],
 ['living-room','What’s in your bathroom?','There is a toilet.','On the top floor.','On Saturday.','I get dressed.','What’s in ถามสิ่งที่อยู่ข้างใน ไม่ใช่ที่ตั้งหรือเวลา'],
 ['plural-sinks','What is in the bedroom? There _____ four beds.','are','is','am','be','four beds มีหลายเตียง ใช้ There are'],
 ['singular-tv','What is in the dining room? There _____ a table.','is','are','am','be','a table เป็นเอกพจน์ ใช้ There is'],
 ['where-question','_____ is your bathroom? On the first floor.','Where','When','Who','How many','On the first floor เป็นตำแหน่ง จึงถาม Where'],
 ['what-question','_____ is in your room? There is a mirror.','What','When','Who','How many','คำตอบบอกสิ่งของ ใช้ What is in เพื่อถามสิ่งที่มี'],
 ['singular-desk','What is that? That _____ a refrigerator.','is','are','am','be','That และ a refrigerator หมายถึงหนึ่งสิ่ง ใช้ is'],
 ['plural-chairs','What is in the house? There are four _____.','bedrooms','bedroom','a bedroom','a bedrooms','four ตามด้วยนามพหูพจน์ bedrooms'],
 ['plural-identify','What are those on the wall?','Those are mirrors.','That is a lamp.','It is downstairs.','At noon.','What are those ถามชื่อหลายสิ่ง ต้องตอบ Those are'],
 ['these-plural','What _____ these on the table?','are','is','am','be','these เป็นพหูพจน์ ใช้ are'],
 ['those-response','What are those? _____ are lamps.','Those','This','That','It','Those are ใช้กับหลายสิ่ง ตรงกับคำถาม What are those'],
 ['where-response','Where is the dining room?','It is next to the kitchen.','There is a table.','Those are my clothes.','It is a mirror.','คำถาม Where ถามตำแหน่ง ตอบ next to the kitchen'],
 ['two-items','The room has both a couch _____ an armchair.','and','or','but','because','both ... and ... หมายถึงมีทั้งสองอย่าง'],
 ['contracted-whats','_____ in the living room? There are two armchairs.','What’s','Where’s','When’s','Who’s','What’s in ถามว่ามีอะไร แม้คำตอบมีหลายชิ้นก็ถามแบบนี้ได้'],
]
// Ask about the source directly. Question wording must not add abstract
// academic vocabulary on top of the reading skill being tested.
const readingPractice: Row[] = [
 ["houses-main", "Which title fits this part?", "Places people call home.", "How to catch a train.", "Cooking at home.", "A school timetable.", "ดูใจความที่ครอบคลุมบ้านและที่อยู่อาศัยหลายรูปแบบ"],
 ['houses-suburbs','What are the smaller towns around cities called?','Suburbs.','Platforms.','Caves.','Treehouses.','called suburbs บอกชื่อเมืองเล็กรอบเมืองใหญ่'],
 ["houses-serbia", "Which country is the Drina River house in?", "Serbia.", "Indonesia.", "Turkey.", "Japan.", "This house ย้อนถึงบ้านเหนือแม่น้ำที่กล่าวก่อนหน้า อยู่ใน Serbia"],
 ['houses-treehouses','What is near the three treehouses?','Diamond Beach.','The city center of Chicago.','The Drina River.','A subway platform.','They อ้างถึงบ้านต้นไม้ ส่วน near Diamond Beach บอกว่าอยู่ใกล้ชายหาด'],
 ["houses-rocks", "Where did people build the cave houses?", "Inside large rocks.", "On train platforms.", "Under the sea.", "Inside buses.", "People made them inside large rocks บอกตำแหน่งที่สร้างบ้านถ้ำ"],
 ["train-name", "What is the L?", "An overhead train.", "A taxi company.", "A cave house.", "A beach.", "the overhead train is called the L บอกชื่อรถไฟ"],
 ["train-support", "What are the columns made of?", "Steel.", "Wood.", "Glass.", "Paper.", "steel ขยาย columns บอกวัสดุของเสาที่รองรับราง"],
 ["train-platform", "Where do the stairs and elevator take riders?", "The platform.", "Inside a taxi.", "Diamond Beach.", "A treehouse.", "from ... to ... บอกจุดเริ่มต้นและปลายทาง ปลายทางคือ platform"],
 ["train-price", "Which costs more: a taxi ride or a train ride?", "A taxi ride.", "A train ride.", "Both cost the same.", "Both are free.", "รถไฟ costs less than taxi แปลว่ารถแท็กซี่แพงกว่า"],
 ["train-frequency", "When do trains come more often?", "At busy times.", "At night.", "On weekends.", "They always come just as often.", "not as often ตอนกลางคืนและสุดสัปดาห์แปลว่าช่วงคนมากรถไฟถี่กว่า"],
 ["houses-percent", "Where do many people in cities live?", "In apartments.", "Only in caves.", "On train tracks.", "Only on farms.", "Many people in the city live in apartments เป็นหลักฐานตรง"],
 ["houses-space", "Where is there space for big houses and farms?", "The countryside.", "A train platform.", "Inside a taxi.", "A small elevator.", "The countryside has a lot of space บอกเหตุที่มีบ้านใหญ่และฟาร์ม"],
 ["houses-water", "Is the Drina River house beside the water?", "No. It is over the water.", "Yes. It is beside the water.", "No. It is under the water.", "No. It is in the water.", "อ่าน not beside แล้วอ่านประโยคถัดไป: บ้านอยู่ over the water จึงตอบ No และบอกตำแหน่งที่ถูกต้อง"],
 ["houses-bali", "Which country is Bali in?", "Indonesia.", "Serbia.", "Turkey.", "Japan.", "Bali, Indonesia ใช้ชื่อประเทศขยายชื่อสถานที่"],
 ["houses-soft", "What are the rocks in Cappadocia like?", "They are kind of soft.", "They are made of steel.", "They are all underwater.", "They are train tracks.", "The rocks ... are kind of soft บอกลักษณะหิน"],
 ["houses-years", "Did people start living in these caves yesterday?", "No. They have lived there for thousands of years.", "Yes. They moved in yesterday.", "No. They moved in this morning.", "No one lives in the caves.", "for thousands of years หมายถึงอาศัยมานานหลายพันปี ไม่ใช่เพิ่งย้ายเข้าเมื่อวาน"],
 ["train-noise", "Why should you look up?", "A train is passing overhead.", "A taxi is underground.", "It is raining heavily.", "A bus is in a cave.", "Look up ตามด้วยรถไฟผ่านเหนือหัว เป็นเหตุให้มองขึ้น"],
 ['train-traffic','What happens to cars and buses on the ground?','They start and stop in traffic.','They fly over the trains.','They use the train tracks.','They never stop.','On the ground บอกจุดเปรียบเทียบกับรถไฟด้านบน'],
 ['train-loop','What shape do the tracks make around the city center?','A loop.','A staircase.','A wall.','A roof.','make a loop around บอกรูปร่างเส้นทางวนรอบ'],
 ["train-sequence", "What do riders do first?", "Buy a ticket.", "Wait for the next train.", "Go through the gate.", "Reach their stop.", "รายการการกระทำเรียง buy a ticket ก่อน go through a gate และ wait"],
 ["train-busy", "At busy times, how many minutes can there be between trains?", "Ten minutes.", "Ten days.", "One month.", "Fifty-six hours.", "every ten minutes คือช่วงห่างสิบนาที"],
 ['train-students','What can students use their phones for on the train?','Playing a game.','Driving the train.','Cooking a meal.','Building tracks.','play a game on their phone เป็นกิจกรรมที่ระบุในเรื่อง'],
 ["train-some", "Do all trains run all day and night?", "The text only says some trains.", "Yes, every train does.", "No trains run at night.", "Only taxis run at night.", "Some ไม่ได้แปลว่า all ห้ามขยายคำกล่าวเกินหลักฐาน"],
 ["train-main", "Cars are stuck in traffic. What are the train riders doing?", "They are still travelling.", "They are all driving cars.", "They are waiting behind buses.", "They are building a road.", "While บอกสองเหตุการณ์ในเวลาเดียวกัน: คนขับรถติดอยู่บนถนน แต่ผู้โดยสารรถไฟยังเดินทางต่อได้"],
]
const readingAssessment: Row[] = [
 ["houses-main", "What do we learn about homes?", "People live in different kinds of homes.", "Everyone lives on a farm.", "Nobody lives in apartments.", "All houses are in cities.", "ดูภาพรวม บ้านมีหลายชนิด ไม่เลือกคำกล่าวที่ใช้ everyone หรือ all เกินข้อความ"],
 ["houses-suburbs", "What do we call a small town around a city?", "A suburb.", "A platform.", "A treehouse.", "A railway.", "ใช้คำอธิบาย smaller towns around cities กับตัวอย่างใหม่ คือ suburb"],
 ["houses-serbia", "You want to see the Drina River house. Where should you go?", "Serbia.", "Indonesia.", "Turkey.", "Japan.", "ตามชื่อบ้าน Drina River house ไปยัง This house is in Serbia"],
 ['houses-treehouses','In “They are near the beautiful Diamond Beach”, what does “They” mean?','The treehouses.','The beaches.','The cities.','The trains.','They ย้อนถึง three treehouses ในประโยคก่อนหน้า'],
 ["houses-rocks", "How did people build the cave houses?", "People built homes inside rocks.", "People built rocks inside trains.", "People built homes above the sea.", "The houses were made from trees.", "made them inside large rocks: them คือบ้านถ้ำ ไม่ใช่ต้นไม้"],
 ["train-name", "Where can you ride the train called the L?", "Chicago.", "Bali.", "Cappadocia.", "Tokyo.", "In Chicago ระบุเมืองที่รถไฟเหนือถนนมีชื่อ the L"],
 ["train-support", "What do the steel columns do?", "They hold up the tracks.", "They sell train tickets.", "They drive the taxis.", "They form the river.", "supported by บอกหน้าที่รองรับราง ไม่ใช่หน้าที่ขายตั๋ว"],
 ["train-platform", "You cannot use the stairs. How can you get to the platform?", "Take an elevator.", "Take a plane.", "Swim there.", "There is no other way.", "stairs or an elevator มีอีกทางเลือกคือลิฟต์"],
 ["train-price", "You want to spend less money. Should you take a train or a taxi?", "The train.", "The taxi.", "Both are free.", "Both have the same price.", "less than หมายถึงน้อยกว่า รถไฟจึงถูกกว่าแท็กซี่ตามข้อความ"],
 ["train-frequency", "Do trains come as often on weekends as at busy times?", "No. They come less often.", "Yes. They come just as often.", "They come every ten seconds.", "There are no trains on weekends.", "not ... as often แปลว่ามาน้อยครั้งกว่า เปรียบเทียบ weekends กับ busy times ไม่ได้แปลว่าไม่มีรถไฟเลย"],
 ["houses-percent", "Do all people in cities live in apartments?", "The text only says many people do.", "Yes, everyone does.", "No one lives in apartments.", "Everyone lives on a farm.", "Many หมายถึงจำนวนมาก ไม่ใช่ทุกคน"],
 ["houses-space", "There is a lot of space in the countryside. What can people have there?", "Big houses and farms.", "Only small houses.", "Only train tracks.", "Only small rooms.", "so เชื่อมเหตุมีพื้นที่มากกับผลคือบ้านใหญ่และฟาร์ม"],
 ["houses-water", "What is below the Drina River house?", "Water.", "A road.", "A train.", "A farm.", "บ้านอยู่ over the water ดังนั้นสิ่งที่อยู่ข้างล่างบ้านคือ water"],
 ["houses-bali", "What kind of home can visitors stay in near Diamond Beach?", "A treehouse.", "A cave house.", "A home on a train.", "A home under the sea.", "อ่านข้อความเกี่ยวกับ Bali: บ้านที่อยู่ใกล้ Diamond Beach คือ treehouses"],
 ["houses-soft", "What is soft in Cappadocia?", "Rocks.", "Train tickets.", "Passengers.", "Steel columns.", "หา soft ขยายประธาน The rocks ไม่ใช่คนหรือรถไฟ"],
 ["houses-years", "How many years have people lived in these cave homes?", "Thousands of years.", "A single night.", "A few minutes.", "One school day.", "for thousands of years ระบุระยะเวลาอย่างชัดเจน"],
 ["train-noise", "You hear a sound like thunder. What is passing over your head?", "A train.", "A taxi.", "A bus.", "A plane.", "ตอนแรกคิดว่าเป็นเสียงฟ้าร้อง แต่ประโยคถัดไปบอกว่ามีรถไฟผ่านเหนือหัว"],
 ["train-traffic", "Where are the trains compared with the cars?", "Above the cars.", "Behind every car.", "Inside the buses.", "On the same road.", "Above them บอกระดับของรางแยกจากรถที่ติดบนพื้นถนน"],
 ["train-loop", "Do the tracks go to other parts of the city?", "Yes. They go beyond the city center.", "No. They only go around the center.", "No. They only go to the river.", "No. They only go inside houses.", "and then run out in all directions แสดงว่าไปส่วนอื่นต่อจากวงรอบ"],
 ["train-sequence", "Which order is right?", "Ticket → gate → wait.", "Wait → ticket → gate.", "Gate → wait → ticket.", "Gate → ticket → wait.", "อ่านลำดับ buy a ticket, go through a gate, and wait"],
 ["train-busy", "At busy times, how often can a train arrive?", "Every ten minutes.", "Once a year.", "Every ten days.", "Once a month.", "as often as every ten minutes บอกความถี่ที่มีได้ ไม่ใช่รับรองทุกเที่ยว"],
 ["train-students", "Which two things can students do on the train?", "Homework and phone games.", "Cooking and driving the train.", "Building tracks and farming.", "Selling cars and cleaning caves.", "Students can do their homework or play a game on their phone กล่าวทั้งสองกิจกรรม"],
 ["train-some", "Some trains run all the time. When do these trains run?", "In the day and at night.", "Only in the morning.", "Only at night.", "Only on weekends.", "all the time, day or night บอกว่าขบวนเหล่านี้วิ่งทั้งกลางวันและกลางคืน ข้อความพูดถึงบางขบวน ไม่ใช่ทุกขบวน"],
 ["train-main", "Why can riding the train be better than driving in traffic?", "You can keep moving and read or rest.", "You must stop at every car.", "You must drive the train.", "You cannot do homework.", "สรุปทั้งการเดินทางขณะถนนติดและกิจกรรมของผู้โดยสาร"],
]

export function expandExamQuestions(base: readonly QuizQuestion[]): QuizQuestion[] {
 const result = [...base]
 const byId = new Map(base.map(q=>[q.id,q]))
 function add(q: QuizQuestion, suffix:string, changes:Partial<QuizQuestion>) {
  const id=`${q.id}-${suffix}`
  const next={...q,...changes,id,audioUrl:`/audio/lessons/${id}.wav`,contextAudioUrl:undefined,gapAudioUrl:`/audio/lessons/prompt-${id}.wav`}
  next.example=next.prompt.includes('_____')?next.prompt.replace('_____',next.answer):`${next.prompt} ${next.answer}`
  if(next.mode==='sentences') next.spokenText=next.example
  result.push(next)
 }
 const vocab=base.filter(q=>q.examCategory==='vocabulary')
 const equivalent=[['car','taxi'],['train','subway'],['bike','bicycle'],['garden','yard'],['go to bed','go to sleep'],['bed','couch'],['bathtub','sink']]
 for(const q of vocab) {
  const word=q.spokenText, row=examVocabularyVariants.get(word)
  if(!row) throw new Error(`Missing vocabulary variants: ${word}`)
  // Reviewed sense exclusions plus same-page neighbours keep choices relevant and unambiguous.
  const options=vocab.filter(other=>other.spokenText!==word && !equivalent.some(pair=>pair.includes(word)&&pair.includes(other.spokenText)))
   .sort((a,b)=>Number(b.examPage===q.examPage)-Number(a.examPage===q.examPage))
   .slice(0,3).map(other=>other.spokenText)
  for(const [format,prompt] of [['definition',row.definition],['context',row.context],['assessment',row.assessment]]) {
   add(q,format,{prompt,answer:word,choices:[word,...options],contextSentence:undefined,examUse:format==='assessment'?'assessment':'practice',examFormat:format==='assessment'?'context':format,explanationThai:`${word} หมายถึง ${q.answer} ดูคำบอกลักษณะหรือหน้าที่ในประโยค แล้วเลือกคำที่ตรงกับความหมายนั้น`})
  }
 }
 for(const [use,rows] of [['practice',dialoguePractice],['assessment',dialogueAssessment],['practice',readingPractice],['assessment',readingAssessment]] as const) {
  const category=rows===readingPractice||rows===readingAssessment?'reading':'dialogue'
  for(const [key,prompt,answer,a,b,c,clue] of rows) {
   const q=byId.get(`exam-ch34-v1-${category}-${key}`)!
   const passage=category==='reading'?readings.find(r=>r.id===q.sourceReadingId)!.paragraphs.find(p=>p.includes(q.passage!)):undefined
   add(q,`${use}-transfer`,{prompt,answer,choices:[answer,a,b,c],contextSentence:passage,passage,examUse:use,examFormat:use==='assessment'?'transfer':'application',explanationThai:clue})
  }
 }
 for(const q of base.filter(q=>q.examCategory==='grammar')) {
  for(const [object,use] of [['apple','practice'],['book','practice'],['cube','assessment']] as const) {
   const prompt=q.prompt.replace('ball',object)
   add(q,object,{prompt,sceneObject:object,sceneMirror:object==='book',examUse:use,examFormat:'picture',explanationThai:q.explanationThai!.replaceAll('ลูกบอล',object==='apple'?'แอปเปิล':object==='book'?'หนังสือ':'ลูกบาศก์เล็ก')})
  }
 }
 return result
}
