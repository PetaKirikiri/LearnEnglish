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
// New questions require a different operation on the same source evidence.
const readingPractice: Row[] = [
 ['houses-main','Which title best fits this paragraph?','Places people call home.','How to catch a train.','Cooking at home.','A school timetable.','ดูใจความที่ครอบคลุมบ้านและที่อยู่อาศัยหลายรูปแบบ'],
 ['houses-suburbs','What are the smaller towns around cities called?','Suburbs.','Platforms.','Caves.','Treehouses.','called suburbs บอกชื่อเมืองเล็กรอบเมืองใหญ่'],
 ['houses-serbia','Which country has the house over the Drina River?','Serbia.','Indonesia.','Turkey.','Japan.','This house ย้อนถึงบ้านเหนือแม่น้ำที่กล่าวก่อนหน้า อยู่ใน Serbia'],
 ['houses-treehouses','What is near the three treehouses?','Diamond Beach.','The city center of Chicago.','The Drina River.','A subway platform.','They อ้างถึงบ้านต้นไม้ ส่วน near Diamond Beach บอกว่าอยู่ใกล้ชายหาด'],
 ['houses-rocks','Where did people make the cave houses?','Inside large rocks.','On train platforms.','Under the sea.','Inside buses.','People made them inside large rocks บอกตำแหน่งที่สร้างบ้านถ้ำ'],
 ['train-name','In this passage, what does “the L” name?','An overhead train.','A taxi company.','A cave house.','A beach.','the overhead train is called the L บอกชื่อรถไฟ'],
 ['train-support','What material are the supporting columns made of?','Steel.','Wood.','Glass.','Paper.','steel ขยาย columns บอกวัสดุของเสาที่รองรับราง'],
 ['train-platform','Where do riders go using stairs or an elevator?','The platform.','Inside a taxi.','Diamond Beach.','A treehouse.','from ... to ... บอกจุดเริ่มต้นและปลายทาง ปลายทางคือ platform'],
 ['train-price','Which journey is more expensive in the passage?','A taxi ride.','A train ride.','Both cost the same.','Both are free.','รถไฟ costs less than taxi แปลว่ารถแท็กซี่แพงกว่า'],
 ['train-frequency','Which period has more frequent trains?','Busy times.','Nighttime.','Weekends.','All periods are equally frequent.','not as often ตอนกลางคืนและสุดสัปดาห์แปลว่าช่วงคนมากรถไฟถี่กว่า'],
 ['houses-percent','Where do many city residents live?','In apartments.','Only in caves.','On train tracks.','Only on farms.','Many people in the city live in apartments เป็นหลักฐานตรง'],
 ['houses-space','Which place has enough space for big houses and farms?','The countryside.','A train platform.','Inside a taxi.','A small elevator.','The countryside has a lot of space บอกเหตุที่มีบ้านใหญ่และฟาร์ม'],
 ['houses-water','Which description does the passage explicitly reject?','The house is beside the water.','The house is over the water.','The house exists.','It is a house.','not a house beside the water ปฏิเสธตำแหน่ง beside'],
 ['houses-bali','In which country is Bali in this passage?','Indonesia.','Serbia.','Turkey.','Japan.','Bali, Indonesia ใช้ชื่อประเทศขยายชื่อสถานที่'],
 ['houses-soft','Which description matches the rocks in Cappadocia?','They are kind of soft.','They are made of steel.','They are all underwater.','They are train tracks.','The rocks ... are kind of soft บอกลักษณะหิน'],
 ['houses-years','Have people used these cave homes only recently?','No, for thousands of years.','Yes, since yesterday.','Yes, for ten minutes.','No one has lived there.','for thousands of years หมายถึงระยะเวลายาวนาน ไม่ใช่เพิ่งเริ่ม'],
 ['train-noise','Why does the writer tell the reader to look up?','A train is passing overhead.','A taxi is underground.','It is raining heavily.','A bus is in a cave.','Look up ตามด้วยรถไฟผ่านเหนือหัว เป็นเหตุให้มองขึ้น'],
 ['train-traffic','What happens to cars and buses on the ground?','They start and stop in traffic.','They fly over the trains.','They use the train tracks.','They never stop.','On the ground บอกจุดเปรียบเทียบกับรถไฟด้านบน'],
 ['train-loop','What shape do the tracks make around the city center?','A loop.','A staircase.','A wall.','A roof.','make a loop around บอกรูปร่างเส้นทางวนรอบ'],
 ['train-sequence','What do riders do first in this sequence?','Buy a ticket.','Wait for the next train.','Go through the gate.','Reach their stop.','รายการการกระทำเรียง buy a ticket ก่อน go through a gate และ wait'],
 ['train-busy','Which interval is stated for busy times?','Ten minutes.','Ten days.','One month.','Fifty-six hours.','every ten minutes คือช่วงห่างสิบนาที'],
 ['train-students','What can students use their phones for on the train?','Playing a game.','Driving the train.','Cooking a meal.','Building tracks.','play a game on their phone เป็นกิจกรรมที่ระบุในเรื่อง'],
 ['train-some','Does the passage say every train runs all day and night?','No, it says some trains.','Yes, every train.','It says no trains.','It says only taxis.','Some ไม่ได้แปลว่า all ห้ามขยายคำกล่าวเกินหลักฐาน'],
 ['train-main','Which contrast is central to this paragraph?','Road traffic stops drivers while train riders keep travelling.','All passengers drive cars.','Trains are always stuck behind buses.','Students cannot use trains.','While เชื่อมสถานการณ์ต่างกัน: รถติดด้านล่างแต่ผู้โดยสารรถไฟยังเดินทาง'],
]
const readingAssessment: Row[] = [
 ['houses-main','Which idea is supported by the paragraph as a whole?','People live in several kinds of places.','Everyone lives on a farm.','Nobody lives in apartments.','All houses are in cities.','ดูภาพรวม บ้านมีหลายชนิด ไม่เลือกคำกล่าวที่ใช้ everyone หรือ all เกินข้อความ'],
 ['houses-suburbs','A family lives in a small town around a city. Which term fits the passage?','A suburb.','A platform.','A treehouse.','A railway.','ใช้คำอธิบาย smaller towns around cities กับตัวอย่างใหม่ คือ suburb'],
 ['houses-serbia','A visitor wants to photograph the Drina River house. Which country should they visit?','Serbia.','Indonesia.','Turkey.','Japan.','ตามชื่อบ้าน Drina River house ไปยัง This house is in Serbia'],
 ['houses-treehouses','In “They are near the beautiful Diamond Beach”, what does “They” mean?','The treehouses.','The beaches.','The cities.','The trains.','They ย้อนถึง three treehouses ในประโยคก่อนหน้า'],
 ['houses-rocks','Which statement matches how the cave houses were made?','People built homes inside rocks.','People built rocks inside trains.','People built homes above the sea.','The houses were made from trees.','made them inside large rocks: them คือบ้านถ้ำ ไม่ใช่ต้นไม้'],
 ['train-name','Which city calls its overhead train the L?','Chicago.','Bali.','Cappadocia.','Tokyo.','In Chicago ระบุเมืองที่รถไฟเหนือถนนมีชื่อ the L'],
 ['train-support','Why are the steel columns mentioned?','They hold up the tracks.','They sell train tickets.','They drive the taxis.','They form the river.','supported by บอกหน้าที่รองรับราง ไม่ใช่หน้าที่ขายตั๋ว'],
 ['train-platform','A rider cannot climb stairs. What alternative does the passage give?','Take an elevator.','Take a plane to the platform.','Swim to the platform.','There is no other way.','stairs or an elevator มีอีกทางเลือกคือลิฟต์'],
 ['train-price','A rider chooses the cheaper of the two journeys described. Which should they choose?','The train.','The taxi.','Both are free.','Both have the same price.','less than หมายถึงน้อยกว่า รถไฟจึงถูกกว่าแท็กซี่ตามข้อความ'],
 ['train-frequency','Compared with busy times, what should a weekend rider expect?','Less frequent trains.','Trains every ten seconds.','Exactly the same frequency.','No trains anywhere.','do not come as often แปลว่าถี่น้อยลง ไม่ได้แปลว่าไม่มีรถไฟ'],
 ['houses-percent','Does the passage claim all city residents live in apartments?','No, it says many people.','Yes, it says everyone.','No, it says nobody.','It only discusses trains.','Many หมายถึงจำนวนมาก ไม่ใช่ทุกคน'],
 ['houses-space','What connects open space with farms in this paragraph?','More space allows big houses and farms.','Farms make all houses small.','Cities have no people.','Cave rocks stop all farming.','so เชื่อมเหตุมีพื้นที่มากกับผลคือบ้านใหญ่และฟาร์ม'],
 ['houses-water','Which position should a drawing of the Drina River house show?','Over the water.','Beside the water.','Under the water.','Inside a cave.','ข้อความแก้จาก not beside เป็น over ต้องอ่านคำปฏิเสธด้วย'],
 ['houses-bali','Which pair of place and accommodation matches the passage?','Bali — treehouses.','Chicago — cave houses.','Serbia — subway homes.','Turkey — train platforms.','Rumah Pohon Treehouse อยู่ใน Bali, Indonesia'],
 ['houses-soft','In “The rocks in Cappadocia are kind of soft”, which thing has this quality?','Rocks.','Train tickets.','Passengers.','Steel columns.','หา soft ขยายประธาน The rocks ไม่ใช่คนหรือรถไฟ'],
 ['houses-years','Which time scale describes living in these cave homes?','Thousands of years.','A single night.','A few minutes.','One school day.','for thousands of years ระบุระยะเวลาอย่างชัดเจน'],
 ['train-noise','What corrects the reader’s first impression of thunder?','The next sentence identifies a passing train.','The passage says it is a rainstorm.','The sun has disappeared.','A taxi is making a phone call.','อ่านประโยคต่อไปเพื่อแก้ความเข้าใจแรก เสียงมาจากรถไฟ'],
 ['train-traffic','How is the trains’ route different from the cars’ route?','It is above the street traffic.','It is behind every car.','It is inside the buses.','It is on the same road lane.','Above them บอกระดับของรางแยกจากรถที่ติดบนพื้นถนน'],
 ['train-loop','Do the tracks stay only around the city center?','No, they also reach other parts of the city.','Yes, they never leave the center.','They go only to the river.','They go only inside houses.','and then run out in all directions แสดงว่าไปส่วนอื่นต่อจากวงรอบ'],
 ['train-sequence','Which order matches the passage?','Ticket → gate → wait.','Wait → ticket → gate.','Gate → wait → ticket.','Gate → ticket → wait.','อ่านลำดับ buy a ticket, go through a gate, and wait'],
 ['train-busy','A train has just left at a busy time. Which stated interval describes frequent service?','Every ten minutes.','Once a year.','Every ten days.','Once a month.','as often as every ten minutes บอกความถี่ที่มีได้ ไม่ใช่รับรองทุกเที่ยว'],
 ['train-students','Which pair contains activities the passage gives for students?','Homework and phone games.','Cooking and driving the train.','Building tracks and farming.','Selling cars and cleaning caves.','Students can do their homework or play a game on their phone กล่าวทั้งสองกิจกรรม'],
 ['train-some','Which claim goes beyond “Some trains run all the time”?','Every train runs all night.','Some trains run day or night.','At least some trains run at night.','Some trains run in the daytime.','Some ใช้กับบางขบวน จึงสรุปเป็น every train ไม่ได้'],
 ['train-main','Which summary best combines travel and passenger activity?','Passengers keep moving and can read, work or rest.','Passengers must stop at every car.','Passengers must drive the train.','Passengers cannot do homework.','สรุปทั้งการเดินทางขณะถนนติดและกิจกรรมของผู้โดยสาร'],
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
