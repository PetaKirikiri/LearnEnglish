import { finalExamVocabulary, type ExamVocabulary } from '../content/finalExamVocabulary'
import { expandExamQuestions } from './examVariants'
import { readings } from '../content/readings'
import type { QuizQuestion } from './quizContent'
import { explanationContentKey, type Explainer } from './explainers/types'

export type ExamCategory = 'vocabulary' | 'dialogue' | 'grammar' | 'reading'
export type PlaceRelation = 'under' | 'behind' | 'in front of' | 'between' | 'beside' | 'above' | 'on' | 'in' | 'over' | 'next to'
type Teaching = Pick<Explainer, 'title_th' | 'rule_th' | 'clue_th' | 'contrasts' | 'examples' | 'caution_th'>
export const examTeaching = new Map<string, Teaching>()
const slug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/,'')
function teaching(title: string, rule: string, clue: string, first: string, second: string, examples: string[], caution: string | null = null): Teaching {
 return {title_th:title,rule_th:rule,clue_th:clue,contrasts:[{label_th:'รูปแบบแรก',text:first},{label_th:'อีกตัวอย่าง',text:second}],examples,caution_th:caution}
}
function vocabularyTeaching(v: ExamVocabulary): Teaching {
 const clue=`${v.word} หมายถึง ${v.thai} ในตัวอย่างนี้`
 if(v.plural) return teaching(`${v.word} · ${v.thai}`,'ดูจำนวน: one ใช้กับรูปเอกพจน์ ส่วน two / many ใช้กับรูปพหูพจน์',clue,`one ${v.word}`,`two ${v.plural}`,[v.context,`one ${v.word} → many ${v.plural}`],v.word==='bus'?'bus ลงท้ายด้วย s แต่เป็นเอกพจน์ พหูพจน์คือ buses':null)
 if(v.usage==='plural') return teaching(`${v.word} · ${v.thai}`,'คำนี้ในบริบทนี้ใช้รูปพหูพจน์ จับคู่กับ are ไม่ใช่ is',clue,`${v.word} are`,v.word==='clothes'?'an item of clothing':'one step',[v.context,v.word==='clothes'?'These clothes are clean.':'The stairs are next to the door.'])
 if(v.usage==='action') return teaching(`${v.word} · ${v.thai}`,'จำกริยาร่วมกับคำที่ตามมาเป็นกลุ่มคำ หลัง can ใช้กริยารูปเดิม ส่วน my เปลี่ยนตามเจ้าของได้',clue,v.word,`can ${v.word}`,[v.context,`I can ${v.word}.`],v.alternative==='go to sleep'?'go to bed คือเข้านอน ส่วน go to sleep คือเริ่มหลับ หนังสือจัดไว้ด้วยกัน แต่ความหมายไม่เหมือนกันทุกบริบท':null)
 if(v.usage==='time') {
  const phrase=['morning','afternoon','evening'].includes(v.word)?`in the ${v.word}`:v.word==='night'?'at night':v.word==='weekend'?'on the weekend':v.word
  return teaching(`${v.word} · ${v.thai}`,'จำคำบอกเวลาเป็นกลุ่ม: in the morning / afternoon / evening, at night, on the weekend ส่วน today / tomorrow ไม่เติม in หรือ on ข้างหน้า',clue,phrase,'today / tomorrow',[v.context,`We read ${phrase}.`])
 }
 if(v.usage==='place') return teaching(`${v.word} · ${v.thai}`,v.word==='countryside'?'เมื่อพูดถึงพื้นที่ชนบทโดยทั่วไป ใช้ the countryside และใช้ in บอกตำแหน่ง':'inside บอกข้างใน ส่วน outside บอกข้างนอก ใช้กับสถานที่เพื่อบอกตำแหน่ง',clue,v.word==='countryside'?'in the countryside':'inside the house',v.word==='countryside'?'in the city':'outside the house',[v.context,v.word==='countryside'?'There are farms in the countryside.':'The dog is outside the house.'])
 return teaching('practice · การฝึกซ้อม','practice ในข้อนี้เป็นคำนาม หมายถึงการฝึกซ้อม ใช้ go to practice เมื่อบอกว่าไปฝึกซ้อม',clue,'football practice','go to practice',[v.context,'We go to practice after school.'])
}
function makeQuestion(category: ExamCategory, key: string, page: number, prompt: string, answer: string, distractors: string[], help: Teaching, extra: Partial<QuizQuestion> = {}): QuizQuestion {
 const id=`exam-ch34-v1-${category}-${key}`
 const example=prompt.includes('_____')?prompt.replace('_____',answer):`${prompt} ${answer}`
 const q:QuizQuestion={id,mode:category==='vocabulary'?'vocabulary':'sentences',examCategory:category,examPage:page,instruction:'',prompt,answer,choices:[answer,...distractors],sourceTitle:`Practice · Chapters 3–4 · p. ${page}`,sourceKind:'practice',example,spokenText:example,audioUrl:`/audio/lessons/${id}.wav`,gapAudioUrl:category==='vocabulary'?undefined:`/audio/lessons/${prompt.includes('_____')?'gap':'prompt'}-${id}.wav`,explanationThai:help.clue_th,...extra}
 examTeaching.set(id,help)
 return q
}
const vocabulary=finalExamVocabulary.map((v,i)=>makeQuestion('vocabulary',slug(v.word),v.page,v.word,v.thai,[1,2,3].map(offset=>finalExamVocabulary[(i+offset)%finalExamVocabulary.length].thai),vocabularyTeaching(v),{example:v.context,spokenText:v.word,contextSentence:v.context,contextAudioUrl:`/audio/lessons/exam-context-${slug(v.word)}.wav`,sourceReadingId:v.chapter===3?'different-houses':'a-train-above-you'}))

const vocabularyAlternatives = finalExamVocabulary.filter(v => v.alternative).map(v => {
 const word = v.alternative!
 const thai = word === 'go to sleep' ? 'เริ่มหลับ' : v.thai
 const context = word === 'go to sleep' ? 'I go to sleep at night.' : 'I ride my bike to school.'
 const alternate = { ...v, word, thai, context, alternative: undefined }
 return makeQuestion('vocabulary',slug(word),v.page,word,thai,word==='bike'?['รถโดยสาร','รถไฟ','เครื่องบิน']:['ตื่นนอน','แต่งตัว','ไปฝึกซ้อม'],vocabularyTeaching(alternate),{example:context,spokenText:word,contextSentence:context,contextAudioUrl:`/audio/lessons/exam-context-${slug(word)}.wav`})
})

// Newly authored practice based on the photographed dialogue patterns, not missing audio transcripts.
const dialogueRows: [string,number,string,string,string[],string][] = [
 ['where-bedroom',36,'Where is your bedroom?','On the second floor.',['There are two beds.','It is a shower.','I get up at six.'],'Where ถามสถานที่ จึงตอบตำแหน่ง เช่น on the second floor ไม่ใช่จำนวนสิ่งของหรือเวลา'],
 ['what-bedroom',34,'What is that in your bedroom?','That is a desk.',['On the second floor.','At nine at night.','I am fine.'],'What is that ถามว่าสิ่งนั้นคืออะไร ตอบชื่อสิ่งของด้วย That is a ...'],
 ['bathroom',36,'What is in the bathroom?','There is a shower.',['It is beside the bedroom.','At seven in the morning.','I go to school by bus.'],'What is in ... ถามว่ามีอะไรอยู่ข้างใน ใช้ There is / There are แล้วตามด้วยสิ่งของ'],
 ['living-room',37,'What’s in the living room?','There is a couch.',['On the second floor.','In the afternoon.','I ride a bicycle.'],'What’s ย่อมาจาก What is คำถามนี้ถามสิ่งที่มีในห้อง จึงตอบ There is a couch'],
 ['plural-sinks',37,'What is in the bathroom? There _____ two sinks.','are',['is','am','be'],'two sinks คืออ่างสองใบ เป็นพหูพจน์ จึงใช้ There are ไม่ใช่ There is'],
 ['singular-tv',37,'What’s in your room? There _____ a television.','is',['are','am','be'],'a television คือโทรทัศน์หนึ่งเครื่อง จึงใช้ There is'],
 ['where-question',36,'_____ is your bedroom? It is next to the bathroom.','Where',['When','Who','How many'],'คำตอบบอกตำแหน่ง next to the bathroom คำถามจึงต้องใช้ Where'],
 ['what-question',37,'_____ is in the living room? There is a couch.','What',['When','Who','How many'],'คำตอบบอกสิ่งของที่มีอยู่ ใช้ What is in ... ถามว่ามีอะไรในสถานที่นั้น'],
 ['singular-desk',34,'What is that? That _____ a desk.','is',['are','am','be'],'that และ a desk หมายถึงสิ่งเดียว จับคู่กับ is'],
 ['plural-chairs',37,'What’s in the room? There are three _____.','chairs',['chair','a chair','a chairs'],'three ต้องตามด้วยคำนามพหูพจน์ จึงใช้ chairs ไม่เติม a หน้า three chairs'],
 ['plural-identify',34,'What are those next to the couch?','Those are my rainboots.',['That is my desk.','It is on the second floor.','There is a bed.'],'What are those ถามชื่อสิ่งของหลายชิ้น จึงตอบ Those are ตามด้วยคำนามพหูพจน์'],
 ['these-plural',34,'What _____ these next to the couch?','are',['is','am','be'],'these หมายถึงหลายสิ่ง ใช้ What are these? ไม่ใช้ is'],
 ['those-response',34,'What are those? _____ are my rainboots.','Those',['That','This','It'],'คำถามใช้ those หมายถึงหลายสิ่ง คำตอบจึงใช้ Those are ไม่ใช่ That is'],
 ['where-response',36,'Where is the bedroom?','It is next to the bathroom.',['There is a dresser.','Those are my clothes.','It is a stove.'],'Where ถามตำแหน่ง จึงตอบว่าห้องอยู่ตรงไหน ไม่ตอบชื่อสิ่งของในห้อง'],
 ['two-items',36,'Is there only a bed? No, there is both a bed _____ a dresser.','and',['but','or','because'],'โจทย์บอกว่ามีของสองอย่างร่วมกัน ใช้ and เชื่อม bed กับ dresser'],
 ['contracted-whats',37,'_____ in your bedroom? There is a television.','What’s',['Where’s','When’s','Who’s'],'What’s in ... ย่อมาจาก What is in ... ใช้ถามว่ามีอะไรอยู่ในสถานที่นั้น'],

]
const dialogue=dialogueRows.map(([key,page,prompt,answer,distractors,clue])=>makeQuestion('dialogue',key,page,prompt,answer,distractors,teaching('ฟังคำถาม แล้วจับรูปแบบคำตอบ','Where ถามตำแหน่ง ส่วน What is in ... ถามว่ามีอะไร ใช้ There is กับหนึ่งสิ่ง และ There are กับหลายสิ่ง',clue,'Where? → On the second floor.','What is in the room? → There is a bed.',['There is a lamp. → There are two lamps.','Where is the kitchen? → Next to the dining room.']),{sourceReadingId:'different-houses'}))

const places: [PlaceRelation,string,string[],string][] = [
 ['under','อยู่ใต้',['on','in','above'],'ลูกบอลอยู่ต่ำกว่ากล่องและตรงกับกล่องในแนวดิ่ง ใช้ under'],
 ['behind','อยู่ด้านหลัง',['in front of','on','in'],'กล่องบังลูกบอลไว้ แสดงว่าลูกบอลอยู่ด้านหลัง ใช้ behind'],
 ['in front of','อยู่ด้านหน้า',['behind','under','between'],'ลูกบอลบังส่วนหน้าของกล่อง แสดงว่าลูกบอลอยู่ด้านหน้า ใช้ in front of'],
 ['between','อยู่ระหว่าง',['on','under','behind'],'มีหนึ่งกล่องทางซ้ายและอีกกล่องทางขวา ลูกบอลอยู่ตรงกลาง ใช้ between'],
 ['beside','อยู่ข้าง ๆ',['in','on','under'],'ลูกบอลอยู่ข้างกล่องในระดับเดียวกัน ใช้ beside ซึ่งมีความหมายใกล้เคียง next to'],
 ['above','อยู่สูงกว่า',['under','in','beside'],'ลูกบอลอยู่สูงกว่ากล่องและไม่สัมผัสกล่อง ใช้ above ในตัวเลือกนี้'],
 ['on','อยู่บนและสัมผัสพื้นผิว',['under','in','behind'],'ลูกบอลวางสัมผัสด้านบนของกล่อง ใช้ on'],
 ['in','อยู่ข้างใน',['on','under','beside'],'ลูกบอลอยู่ภายในขอบกล่อง ใช้ in'],
 ['over','ข้ามผ่านด้านบน',['under','in','beside'],'ข้อความบอกว่าลูกบอลเคลื่อนข้ามด้านบนของกล่องจากด้านหนึ่งไปอีกด้าน ใช้ over'],
 ['next to','อยู่ติดกับหรือข้าง ๆ',['in','on','under'],'ลูกบอลอยู่ติดกับกล่อง ใช้ next to ซึ่งมีความหมายใกล้เคียง beside'],
]
const grammar=places.map(([relation,meaning,distractors,clue])=>makeQuestion('grammar',slug(relation),40,`The ball ${relation==='over'?'moves':'is'} _____ the ${relation==='between'?'boxes':'box'}.`,relation,distractors,teaching('ดูตำแหน่งเทียบกับสิ่งอ้างอิง','หาสิ่งที่กำลังพูดถึงก่อน แล้วดูว่ามันอยู่ตรงไหนเมื่อเทียบกับกล่อง ไม่เลือกจากชื่อสิ่งของเพียงอย่างเดียว',clue,`${relation} the ${relation==='between'?'boxes':'box'}`,relation==='under'?'on the box':'under the box',[`The ball ${relation==='over'?'moves':'is'} ${relation} the ${relation==='between'?'boxes':'box'}.`,`The cat ${relation==='over'?'jumps':'is'} ${relation} the ${relation==='between'?'chairs':'chair'}.`],relation==='above'||relation==='over'?'above และ over มีความหมายทับซ้อนกันเมื่อบอกตำแหน่งด้านบน จึงไม่ใช้เป็นตัวลวงแข่งกันในข้อนี้':null),{placeRelation:relation,grammarFocus:`Place: ${relation}`,sourceReadingId:'different-houses',explanation:meaning}))

const readingRows: [string,string,number,string,string,string,string[],string][] = [
 ['houses-main','different-houses',39,'Houses, apartments, and farms are not the only places where people live. Some people live in really different houses!','What is this passage about?','Different kinds of homes.',['Ways to get to school.','A daily timetable.','How to cook dinner.'],'ข้อความพูดถึงสถานที่อยู่อาศัยหลายแบบ หาใจความที่ครอบคลุมตัวอย่างทั้งหมด ไม่เลือกเพียงรายละเอียดเดียว'],
 ['houses-suburbs','different-houses',39,'Others live around cities, in smaller towns called suburbs. There are many houses in the suburbs.','Where are the suburbs?','Around cities.',['Inside large rocks.','Above train tracks.','Under rivers.'],'around cities เป็นคำบอกตำแหน่งของ suburbs อ่านคำอธิบายที่อยู่ติดกับคำใหม่'],
 ['houses-serbia','different-houses',39,'The Drina River house is not a house beside the water. It’s a house over the water! This house is in Serbia.','Where is the Drina River house?','In Serbia.',['In Indonesia.','In Turkey.','In Chicago.'],'This house หมายถึง Drina River house จากประโยคก่อนหน้า ตามคำอ้างอิงกลับไปหาสิ่งที่ถูกกล่าวถึง'],
 ['houses-treehouses','different-houses',39,'There are three treehouses there that you can stay in. They are near the beautiful Diamond Beach.','How many treehouses can visitors stay in?','Three.',['One.','Two.','Six.'],'How many ถามจำนวน มองหาตัวเลขหรือคำบอกจำนวนที่ขยาย treehouses'],
 ['houses-rocks','different-houses',39,'Cappadocia has many cave houses. People made them inside large rocks. The rocks in Cappadocia are kind of soft.','What does “them” refer to?','Cave houses.',['People.','Treehouses.','Photographs.'],'them เป็นกรรมพหูพจน์ ย้อนดูสิ่งที่คนสร้างในประโยคก่อนหน้า คือ cave houses'],
 ['train-name','a-train-above-you',51,'In Chicago, the overhead train is called the L.','What is Chicago’s overhead train called?','The L.',['The M.','The River.','The Loop Bus.'],'is called ใช้บอกชื่อ สิ่งที่ตามมาคือชื่อของรถไฟ'],
 ['train-support','a-train-above-you',51,'The tracks are supported by massive steel columns.','What supports the tracks?','Steel columns.',['Wooden doors.','Cave walls.','Tree branches.'],'are supported by บอกว่าสิ่งใดรองรับราง คำหลัง by เป็นผู้ทำหน้าที่รองรับ'],
 ['train-platform','a-train-above-you',51,'Riders climb stairs or take an elevator from the sidewalk to the platform.','How do riders reach the platform?','By stairs or elevator.',['By plane or taxi.','By swimming.','By bicycle only.'],'How ถามวิธี ข้อความให้สองวิธีเชื่อมด้วย or คือขึ้นบันไดหรือใช้ลิฟต์'],
 ['train-price','a-train-above-you',51,'A train ticket costs less than a taxi ride.','Which costs less?','A train ticket.',['A taxi ride.','They cost the same.','The passage does not say.'],'less than หมายถึงน้อยกว่า สิ่งที่อยู่ก่อน costs less มีราคาถูกกว่าสิ่งหลัง than'],
 ['train-frequency','a-train-above-you',51,'At busy times, trains come as often as every ten minutes. At night and on weekends, they do not come as often.','When do trains come less often?','At night and on weekends.',['At busy times.','Every ten seconds.','Only in the morning.'],'not ... as often หมายถึงถี่น้อยลง ต้องอ่านประโยคที่สองร่วมกับประโยคแรกเพื่อเปรียบเทียบ'],
 ['houses-percent','different-houses',39,'Fifty-six percent of the world’s people live in cities. Many people in the city live in apartments.','According to the passage, what percentage of people live in cities?','Fifty-six percent.',['Six percent.','Fifty percent.','Sixty-five percent.'],'what percentage ถามร้อยละ อ่านจำนวน fifty-six percent ที่อยู่หน้าคำว่า people'],
 ['houses-space','different-houses',39,'The countryside has a lot of space, so there are big houses and even farms.','Why are there big houses and farms in the countryside?','There is a lot of space.',['There are many train tracks.','The rocks are soft.','It is above the water.'],'so เชื่อมเหตุและผล เหตุคือมีพื้นที่มาก ผลคือมีบ้านใหญ่และฟาร์ม'],
 ['houses-water','different-houses',39,'The Drina River house is not a house beside the water. It’s a house over the water!','Which statement matches the passage?','The house is over the water.',['The house is beside the water.','The house is under the water.','The house is inside a cave.'],'อ่าน not ให้ครบ ข้อความปฏิเสธ beside แล้วแก้เป็น over อย่าเลือกเพียงคำที่พบในเรื่อง'],
 ['houses-bali','different-houses',39,'In Bali, Indonesia, you can try living in the famous Rumah Pohon Treehouse. There are three treehouses there that you can stay in. They are near the beautiful Diamond Beach.','Where can visitors stay in these treehouses?','In Bali, Indonesia.',['In Serbia.','In Cappadocia, Turkey.','In Chicago.'],'these treehouses อ้างถึงบ้านต้นไม้ที่กล่าวถึงใน Bali, Indonesia'],
 ['houses-soft','different-houses',39,'The rocks in Cappadocia are kind of soft. People have lived in these cave homes for thousands of years.','What does “soft” describe?','The rocks.',['The people.','The trains.','The water.'],'หาเจ้าของลักษณะ soft จากประธานในประโยค คือ The rocks'],
 ['houses-years','different-houses',39,'People have lived in these cave homes for thousands of years.','How long have people lived in these cave homes?','For thousands of years.',['For ten minutes.','For three days.','For one weekend.'],'How long ถามระยะเวลา มองหา for ตามด้วยช่วงเวลา'],
 ['train-noise','a-train-above-you',51,'The sun is shining, but you think you hear thunder. Look up! A train is passing over your head!','What is making the sound like thunder?','A passing train.',['A heavy rainstorm.','A taxi driver.','A cave falling down.'],'อ่านประโยคต่อจากคำว่า thunder เสียงที่คิดว่าเป็นฟ้าร้องมาจากรถไฟที่กำลังผ่านด้านบน'],
 ['train-traffic','a-train-above-you',51,'On the ground, cars and buses start and stop in traffic. Above them, trains are moving from station to station with no traffic jams.','Why can the trains keep moving while cars stop?','They run above the street traffic.',['They drive on the same road.','They wait behind the buses.','They stop at every car.'],'เปรียบเทียบ On the ground กับ Above them รถไฟอยู่ด้านบนและไม่มีรถติดเหมือนถนน'],
 ['train-loop','a-train-above-you',51,'The tracks make a loop around the city center and then run out in all directions to the different parts of the city.','Where do the tracks go after the loop around the city center?','To different parts of the city.',['Only to one house.','Into the river.','Only under the sidewalk.'],'and then บอกลำดับต่อมา รางแยกออกไปยังส่วนต่าง ๆ ของเมือง'],
 ['train-sequence','a-train-above-you',51,'They buy a ticket, go through a gate, and wait for the next train to take them where they want to go.','What do riders do after buying a ticket and before waiting?','Go through a gate.',['Buy another ticket.','Drive a taxi.','Go to sleep.'],'เรียงลำดับจากข้อความ: buy a ticket → go through a gate → wait'],
 ['train-busy','a-train-above-you',51,'At busy times, trains come as often as every ten minutes. At night and on weekends, they do not come as often.','How often can trains come at busy times?','Every ten minutes.',['Every ten hours.','Only once a week.','Every fifty-six minutes.'],'How often ถามความถี่ ดูข้อความ every ten minutes ที่ใช้กับ busy times'],
 ['train-students','a-train-above-you',51,'Students can do their homework or play a game on their phone. People read or talk. Some even go to sleep and wake up when they reach their stop.','Which activity is mentioned for students on the train?','Doing homework.',['Driving the train.','Cooking dinner.','Cleaning the tracks.'],'คำถามถามสิ่งที่ข้อความกล่าวถึงจริง เลือก do their homework ไม่ใช้กิจกรรมที่เพียงแต่เป็นไปได้'],
 ['train-some','a-train-above-you',51,'Some trains run all the time, day or night.','Which statement is supported?','Some trains run day and night.',['All trains stop at night.','All trains run every ten minutes all night.','No trains run on weekends.'],'Some หมายถึงบางขบวน ไม่ใช่ทุกขบวน อย่าขยายความเป็น all หรือ no'],
 ['train-main','a-train-above-you',51,'While drivers on the ground are stuck in traffic, riders on the L are on their way. Students can do their homework or play a game on their phone. People read or talk. Some even go to sleep and wake up when they reach their stop.','What advantage of riding the L does this paragraph describe?','Riders can travel and do other things while roads are busy.',['Riders must drive the train themselves.','Riders always pay more than a taxi.','Riders cannot read on the train.'],'ใจความรวมคือผู้โดยสารยังเดินทางได้เมื่อถนนรถติดและทำกิจกรรมอื่นได้ ไม่ใช่เลือกแค่คำเดียวจากเรื่อง'],

]
const reading=readingRows.map(([key,readingId,page,passage,prompt,answer,distractors,clue])=>{
 const source=readings.find(r=>r.id===readingId)!
 if(!source.paragraphs.some(p=>p.includes(passage))) throw new Error(`Exam excerpt differs from source: ${key}`)
 return makeQuestion('reading',key,page,prompt,answer,distractors,teaching('หาหลักฐานในข้อความ','อ่านคำถามว่าถามใคร ที่ไหน จำนวน วิธี หรือความหมาย แล้วหาใจความที่ตอบเรื่องเดียวกันในข้อความ',clue,'Where? → a place','How many? → a number',['Where is the house? → In Serbia.','How many houses? → Three houses.']),{passage,contextSentence:passage,spokenText:prompt,sourceReadingId:readingId,sourceTitle:`Practice · ${source.title} · p. ${page}`})
})
const baseQuestions = [...vocabulary,...vocabularyAlternatives,...dialogue,...grammar,...reading].map(q => ({...q, examTarget:q.id, examUse:'practice' as const, examFormat:q.examCategory==='vocabulary'?'meaning':q.examCategory==='grammar'?'picture':'comprehension'}))
export const examPracticeQuestions: readonly QuizQuestion[] = expandExamQuestions(baseQuestions)
for (const q of examPracticeQuestions) {
 if (examTeaching.has(q.id)) continue
 const original = examTeaching.get(q.examTarget!)!
 // The new clue is specific to this question; avoid copying a clue about a different object.
 examTeaching.set(q.id, {...original, clue_th:q.explanationThai!, examples:[q.example, original.examples[0]]})
}
export function buildExamExplainers(): Explainer[] {
 return examPracticeQuestions.map(q=>({question_id:q.id,content_key:explanationContentKey(q),pattern_key:`exam-${q.examCategory}`,...examTeaching.get(q.id)!}))
}
