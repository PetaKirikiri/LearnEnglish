import type { GrammarLesson } from './grammarLessons'

// Human-readable, individually authored examples. Exact matches use the original
// story source; other examples are explicitly labelled practice by quizContent.
// Options must be wrong from the visible English, without a hidden Thai clue.
type Group = {
  target: string
  choices: readonly string[]
  focus: string
  why: string
  whyThai: string
  readingId: string
  examples: readonly (readonly [sentence: string, thai: string, readingId?: string])[]
}
const groups: readonly Group[] = [
  { target: 'is', choices: ['is','are','am'], focus: 'Singular subject agreement', why: 'This singular third-person subject takes is, not are or am.', whyThai: 'ประธานบุรุษที่สามเอกพจน์นี้ใช้ is ไม่ใช่ are หรือ am', readingId: 'a-big-family', examples: [
    ['My mother is a doctor, and my father is a police officer.','แม่ของฉันเป็นหมอ และพ่อของฉันเป็นตำรวจ'],
    ['The sun is already warm.','ดวงอาทิตย์ให้ความอบอุ่นแล้ว','around-the-world-right-now'],
    ['The average temperature is about fifteen degrees Celsius.','อุณหภูมิเฉลี่ยอยู่ที่ประมาณสิบห้าองศาเซลเซียส','climate-around-the-world'],
  ]},
  { target: 'a', choices: ['a','an'], focus: 'A before a consonant sound', why: 'The following singular countable noun phrase begins with a consonant sound, so use a rather than an.', whyThai: 'กลุ่มคำนามนับได้เอกพจน์ที่ตามมาเริ่มด้วยเสียงพยัญชนะ จึงใช้ a ไม่ใช่ an', readingId: 'a-big-family', examples: [
    ['My grandfather is a pilot.','ปู่หรือตาของฉันเป็นนักบิน'],
    ['We are a big family!','พวกเราเป็นครอบครัวใหญ่!'],
    ['Birdwatching can be a fun hobby for anyone.','การดูนกเป็นงานอดิเรกที่สนุกสำหรับทุกคนได้','birdwatching'],
    ['A train ticket costs less than a taxi ride.','ตั๋วรถไฟราคาถูกกว่าการนั่งแท็กซี่','a-train-above-you'],
  ]},
  { target: 'are', choices: ['are','is','am'], focus: 'Plural subject agreement', why: 'The subject is plural, so use are, not is or am.', whyThai: 'ประธานเป็นพหูพจน์ จึงใช้ are ไม่ใช่ is หรือ am', readingId: 'different-houses', examples: [
    ['There are many houses in the suburbs.','มีบ้านหลายหลังในเขตชานเมือง'],
    ['The tracks are supported by massive steel columns.','รางรถไฟมีเสาเหล็กขนาดใหญ่รองรับ','a-train-above-you'],
    ['The cats of Rome are wild!','แมวของกรุงโรมเป็นแมวป่า!','around-the-world-right-now'],
  ]},
  { target: 'we', choices: ['we','us','our'], focus: 'Subject pronoun we', why: 'We is the subject doing the action. Us is an object; our introduces a noun.', whyThai: 'we เป็นประธานที่ทำกริยา ส่วน us เป็นกรรม และ our ใช้นำหน้าคำนาม', readingId: 'ronas-diary', examples: [
    ['We sat at the table and talked for a long time.','พวกเรานั่งที่โต๊ะและคุยกันเป็นเวลานาน'],
    ['We said goodbye, and then I ran to the gate.','พวกเราบอกลากัน แล้วฉันก็วิ่งไปที่ประตูขึ้นเครื่อง'],
    ['We don’t care who wins or who loses.','พวกเราไม่สนใจว่าใครชนะหรือแพ้','around-the-world-right-now'],
    ['Here in the Arctic Circle, we have very cold winters.','ที่นี่ในเขตอาร์กติกเซอร์เคิล พวกเรามีฤดูหนาวที่หนาวจัด','climate-around-the-world'],
  ]},
  { target: 'us', choices: ['us','we','our'], focus: 'Object pronoun us', why: 'This position needs the object form us. We is a subject, and our must introduce a noun.', whyThai: 'ตำแหน่งนี้ต้องใช้รูปกรรม us ส่วน we เป็นประธาน และ our ต้องนำหน้าคำนาม', readingId: 'a-big-family', examples: [
    ['My aunt lives with us, too.','ป้าหรือน้าหรืออาของฉันก็อยู่กับพวกเราด้วย'],
    ['Our grandmother cooks for us.','ย่าหรือยายของเราทำอาหารให้พวกเรา'],
    ['The teacher asked us about school.','ครูถามพวกเราเกี่ยวกับโรงเรียน','getting-to-know-your-child'],
    ['Please tell us about your family.','กรุณาเล่าเรื่องครอบครัวของคุณให้พวกเราฟัง'],
  ]},
  { target: 'do', choices: ['do','does'], focus: 'Questions with do', why: 'Use do with the subject you before a base verb in this present-simple question.', whyThai: 'คำถามปัจจุบันที่มีประธาน you และกริยารูปพื้นฐานใช้ do', readingId: 'birdwatching', examples: [
    ['How do you know what kind of bird you see?','คุณรู้ได้อย่างไรว่านกที่เห็นเป็นนกชนิดใด'],
    ['Treehouses are a lot of fun, but do you want to live in one?','บ้านต้นไม้สนุกมาก แต่คุณอยากอยู่ในบ้านแบบนั้นไหม?','different-houses'],
    ['Do you take photographs of birds?','คุณถ่ายรูปนกไหม?'],
    ['Where do you keep your notebooks?','คุณเก็บสมุดไว้ที่ไหน?','getting-to-know-your-child'],
  ]},
  { target: 'for', choices: ['for','of','on'], focus: 'Thanks for', why: 'Thanks for and thank you for introduce the thing being thanked for; of and on do not fit this expression.', whyThai: 'thanks for และ thank you for ใช้บอกสิ่งที่ขอบคุณ ส่วน of และ on ใช้ในสำนวนนี้ไม่ได้', readingId: 'a-big-family', examples: [
    ['Thank you for your letter.','ขอบคุณสำหรับจดหมายของคุณ'],
    ['Thanks for the food.','ขอบคุณสำหรับอาหาร'],
    ['Thank you for the notebooks.','ขอบคุณสำหรับสมุด','getting-to-know-your-child'],
    ['Thanks for a wonderful trip.','ขอบคุณสำหรับการเดินทางที่แสนวิเศษ','ronas-diary'],
  ]},
  { target: 'your', choices: ['your','you','yours'], focus: 'Possessive your before a noun', why: 'Your introduces a noun belonging to you. You is a pronoun; yours stands without that noun.', whyThai: 'your นำหน้าคำนามเพื่อบอกว่าเป็นของคุณ ส่วน you เป็นสรรพนาม และ yours ใช้แทนคำนาม', readingId: 'getting-to-know-your-child', examples: [
    ['Please get your child a pen and pencils.','กรุณาหาปากกาและดินสอให้ลูกของคุณ'],
    ['What does your child do for fun?','ลูกของคุณทำอะไรเพื่อความสนุก?'],
    ['Thanks a lot for your last letter.','ขอบคุณมากสำหรับจดหมายฉบับล่าสุดของคุณ','a-big-family'],
  ]},
  { target: 'to', choices: ['to','of','at'], focus: 'Infinitive to', why: 'Love is followed here by to and a base verb: love to visit.', whyThai: 'ในประโยคนี้หลัง love ใช้ to ตามด้วยกริยารูปพื้นฐาน คือ love to visit', readingId: 'different-houses', examples: [
    ['People love to visit and take photographs of it.','ผู้คนชอบไปเยี่ยมชมและถ่ายรูปมัน'],
  ]},
  { target: 'will', choices: ['will','is','are'], focus: 'Will followed by a base verb', why: 'Will can directly precede this base verb. Is and are cannot.', whyThai: 'will ใช้หน้ากริยารูปพื้นฐานนี้ได้โดยตรง ส่วน is และ are ใช้แบบนี้ไม่ได้', readingId: 'climate-around-the-world', examples: [
    ['The temperature will drop below freezing.','อุณหภูมิจะลดลงต่ำกว่าจุดเยือกแข็ง'],
    ['Sometimes it will go up to about twenty-five degrees.','บางครั้งอุณหภูมิจะสูงขึ้นถึงประมาณยี่สิบห้าองศา'],
    ['But we will come back as soon as it is safe.','แต่พวกเราจะกลับมาทันทีที่ปลอดภัย'],
    ['When it gets cold, we will dress in layers, starting with warm long underwear!','เมื่ออากาศหนาว พวกเราจะใส่เสื้อผ้าหลายชั้น เริ่มจากชุดชั้นในขายาวที่อบอุ่น!'],
  ]},
  { target: 'does', choices: ['does','do','is'], focus: 'Does with a singular subject', why: 'The singular third-person subject takes does before this base verb in a present-simple question.', whyThai: 'คำถามปัจจุบันนี้มีประธานบุรุษที่สามเอกพจน์ จึงใช้ does หน้ากริยารูปพื้นฐาน', readingId: 'getting-to-know-your-child', examples: [
    ['Where does your child go after school?','ลูกของคุณไปที่ไหนหลังเลิกเรียน?'],
    ['What does your child need for school?','ลูกของคุณต้องการอะไรสำหรับโรงเรียน?'],
    ['Where does the bird build its nest?','นกสร้างรังของมันที่ไหน?','birdwatching'],
    ['How does your father go to work?','พ่อของคุณไปทำงานอย่างไร?','a-big-family'],
  ]},
  { target: 'these', choices: ['these','this','that'], focus: 'These before plural nouns', why: 'The noun is plural, so these fits. This and that require a singular noun here.', whyThai: 'คำนามเป็นพหูพจน์จึงใช้ these ส่วน this และ that ต้องใช้กับคำนามเอกพจน์ในตำแหน่งนี้', readingId: 'different-houses', examples: [
    ['People have lived in these cave homes for thousands of years.','ผู้คนอาศัยอยู่ในบ้านถ้ำเหล่านี้มาหลายพันปี'],
    ['Please put these pencils in your bag.','กรุณาใส่ดินสอเหล่านี้ในกระเป๋าของคุณ','getting-to-know-your-child'],
  ]},
  { target: 'before', choices: ['before','beforehand','ago'], focus: 'Before introducing a time or action', why: 'Before can introduce the following time or action. Beforehand stands on its own; ago follows a time duration.', whyThai: 'before ใช้นำหน้าเวลาหรือการกระทำที่ตามมาได้ ส่วน beforehand ใช้เดี่ยว ๆ และ ago อยู่หลังระยะเวลา', readingId: 'climate-around-the-world', examples: [
    ['Before I go outside, I put on my boblejakker.','ก่อนออกไปข้างนอก ฉันใส่เสื้อแจ็กเก็ตกันหนาว'],
    ['Put on your jacket before you go outside.','ใส่เสื้อแจ็กเก็ตก่อนออกไปข้างนอก'],
    ['We bought tickets before the trip.','พวกเราซื้อตั๋วก่อนการเดินทาง','ronas-diary'],
    ['Please get your notebooks before school starts.','กรุณาเตรียมสมุดให้พร้อมก่อนโรงเรียนเปิด','getting-to-know-your-child'],
  ]},
  { target: 'this', choices: ['this','these','those'], focus: 'This before a singular noun', why: 'The following noun is singular. This fits, while these and those require plural nouns.', whyThai: 'คำนามที่ตามมาเป็นเอกพจน์ จึงใช้ this ส่วน these และ those ต้องใช้กับคำนามพหูพจน์', readingId: 'street-food', examples: [
    ['Eat this vegetable treat on a stick.','กินอาหารผักแสนอร่อยที่เสียบไม้นี้'],
    ['On this island, most people’s jobs are fishing or farming.','บนเกาะนี้ คนส่วนใหญ่ทำงานประมงหรือเกษตรกรรม','climate-around-the-world'],
    ['This morning, my sister got up and made pancakes for breakfast.','เช้านี้ พี่สาวหรือน้องสาวของฉันตื่นขึ้นมาทำแพนเค้กเป็นอาหารเช้า','ronas-diary'],
    ['This house has three rooms.','บ้านหลังนี้มีสามห้อง','different-houses'],
  ]},
  { target: 'in', choices: ['in','into','of'], focus: 'In for a location', why: 'In locates something within a place. Into expresses movement and does not fit this location; of does not fit either.', whyThai: 'in บอกตำแหน่งที่อยู่ภายในสถานที่ ส่วน into บอกการเคลื่อนเข้าไปจึงไม่เข้ากับตำแหน่งนี้ และ of ก็ใช้ไม่ได้', readingId: 'different-houses', examples: [
    ['There are many houses in the suburbs.','มีบ้านหลายหลังในเขตชานเมือง'],
    ['Many people in the city live in apartments.','คนจำนวนมากในเมืองอาศัยอยู่ในอพาร์ตเมนต์'],
    ['Tristan da Cunha is a small island in the Atlantic Ocean.','ทริสตันดาคูนยาเป็นเกาะเล็ก ๆ ในมหาสมุทรแอตแลนติก','climate-around-the-world'],
    ['Our house is in Italy.','บ้านของพวกเราอยู่ในอิตาลี','a-big-family'],
  ]},
  { target: 'them', choices: ['them','they','their'], focus: 'Object pronoun them', why: 'The verb needs the object form them. They is a subject; their needs a following noun.', whyThai: 'หลังกริยานี้ต้องใช้รูปกรรม them ส่วน they เป็นประธาน และ their ต้องตามด้วยคำนาม', readingId: 'around-the-world-right-now', examples: [
    ['I can’t see them in the bright city.','ฉันมองไม่เห็นดาวตกเหล่านั้นในเมืองที่สว่างไสว'],
    ['But I can go outside the city to see them.','แต่ฉันออกไปนอกเมืองเพื่อดูดาวตกเหล่านั้นได้'],
  ]},
  { target: 'they', choices: ['they','them','their'], focus: 'Subject pronoun they', why: 'They is the subject performing this action. Them is an object, and their must introduce a noun.', whyThai: 'they เป็นประธานที่ทำกริยานี้ ส่วน them เป็นกรรม และ their ต้องนำหน้าคำนาม', readingId: 'birdwatching', examples: [
    ['They love to go on bird walks as a group.','พวกเขาชอบไปเดินดูนกเป็นกลุ่ม'],
    ['They often take a photo or a video of the bird.','พวกเขามักถ่ายรูปหรือวิดีโอของนก'],
    ['They want to remember each bird.','พวกเขาต้องการจดจำนกแต่ละตัว'],
  ]},
  { target: 'at', choices: ['at','that','because'], focus: 'At in look at', why: 'Look at introduces the thing being looked at. That and because cannot introduce this noun phrase after look.', whyThai: 'look at ใช้นำหน้าสิ่งที่มอง ส่วน that และ because ใช้นำหน้ากลุ่มคำนามนี้หลัง look ไม่ได้', readingId: 'birdwatching', examples: [
    ['Then look at its color patterns.','จากนั้นให้มองรูปแบบสีของมัน'],
    ['Then I looked at the clock.','แล้วฉันก็มองนาฬิกา','ronas-diary'],
    ['Look at the bird’s wings.','มองปีกของนก'],
    ['Look at the train’s wheels.','มองล้อของรถไฟ','a-train-above-you'],
  ]},
  { target: 'by', choices: ['by','of','because'], focus: 'By: alone, method or agent', why: 'By yourself means alone; by plus an -ing form gives a method; made by names the maker. Of and because cannot replace by in these patterns.', whyThai: 'by yourself หมายถึงคนเดียว ส่วน by ตามด้วยรูป ing บอกวิธี และ made by บอกผู้ทำ ใช้ of หรือ because แทน by ในรูปแบบเหล่านี้ไม่ได้', readingId: 'birdwatching', examples: [
    ['You can go birdwatching by yourself or with friends.','คุณไปดูนกคนเดียวหรือกับเพื่อนก็ได้'],
    ['Birders remember birds by drawing pictures.','นักดูนกจดจำนกด้วยการวาดรูป'],
    ['The pancakes were made by my sister.','แพนเค้กทำโดยพี่สาวหรือน้องสาวของฉัน','ronas-diary'],
  ]},
  { target: 'my', choices: ['my','me','I'], focus: 'My before a noun', why: 'My introduces a noun belonging to the speaker. Me and I cannot introduce that noun.', whyThai: 'my นำหน้าคำนามที่เป็นของผู้พูด ส่วน me และ I ใช้นำหน้าคำนามนั้นไม่ได้', readingId: 'a-big-family', examples: [
    ['You asked about my family.','คุณถามเกี่ยวกับครอบครัวของฉัน'],
    ['My grandfather is a pilot.','ปู่หรือตาของฉันเป็นนักบิน'],
    ['I got on the plane and sat in my seat.','ฉันขึ้นเครื่องบินและนั่งในที่นั่งของฉัน','ronas-diary'],
  ]},
  { target: 'with', choices: ['with','of','because'], focus: 'With before a companion or accompanying thing', why: 'With introduces the companion or accompanying thing. Of does not fit this pattern; because would need a clause.', whyThai: 'with นำหน้าคนที่อยู่ด้วยหรือสิ่งที่มาพร้อมกัน ส่วน of ไม่เข้ากับรูปแบบนี้ และ because ต้องตามด้วยประโยคย่อย', readingId: 'a-big-family', examples: [
    ['My grandmother and grandfather also live with us.','ย่าหรือยายและปู่หรือตาของฉันก็อยู่กับพวกเราด้วย'],
    ['My aunt lives with us, too.','ป้าหรือน้าหรืออาของฉันก็อยู่กับพวกเราด้วย'],
    ['It is good with salt and vinegar on it.','อาหารนี้อร่อยเมื่อใส่เกลือและน้ำส้มสายชู','street-food'],
  ]},
  { target: 'its', choices: ['its',"it's",'it'], focus: 'Possessive its', why: 'Its introduces something belonging to the animal. It’s means it is or it has; it cannot introduce this noun.', whyThai: 'its นำหน้าสิ่งที่เป็นของสัตว์ตัวนั้น ส่วน it’s ย่อจาก it is หรือ it has และ it ใช้นำหน้าคำนามนี้ไม่ได้', readingId: 'birdwatching', examples: [
    ['First, look for its size and shape.','ก่อนอื่นให้สังเกตขนาดและรูปร่างของมัน'],
    ['The bird builds its nest in a tree.','นกสร้างรังของมันบนต้นไม้'],
    ['The bird spreads its wings.','นกกางปีกของมัน'],
    ['The cat is eating its food.','แมวกำลังกินอาหารของมัน','around-the-world-right-now'],
  ]},
  { target: 'of', choices: ['of','than','because'], focus: 'Of linking a noun to its complement', why: 'Of links these noun phrases. Than needs a comparison, and because needs a clause; neither fits this position.', whyThai: 'of เชื่อมกลุ่มคำนามเหล่านี้ ส่วน than ใช้ในการเปรียบเทียบ และ because ต้องตามด้วยประโยคย่อย จึงใช้ตรงนี้ไม่ได้', readingId: 'different-houses', examples: [
    ['The countryside has a lot of space, so there are big houses and even farms.','ชนบทมีพื้นที่มาก จึงมีบ้านหลังใหญ่และแม้กระทั่งฟาร์ม'],
    ['One of these cities is Chicago.','หนึ่งในเมืองเหล่านี้คือชิคาโก','a-train-above-you'],
    ['The cats of Rome are wild!','แมวของกรุงโรมเป็นแมวป่า!','around-the-world-right-now'],
    ['The dish is traditionally served in a cone of newspaper.','ตามธรรมเนียม อาหารนี้เสิร์ฟในกระดาษหนังสือพิมพ์ที่ม้วนเป็นกรวย','street-food'],
  ]},
  { target: 'me', choices: ['me','I','my'], focus: 'Object pronoun me', why: 'This position takes the object form me. I is a subject; my introduces a noun.', whyThai: 'ตำแหน่งนี้ใช้รูปกรรม me ส่วน I เป็นประธาน และ my ใช้นำหน้าคำนาม', readingId: 'ronas-diary', examples: [
    ['My sister drove me to the airport.','พี่สาวหรือน้องสาวของฉันขับรถไปส่งฉันที่สนามบิน'],
    ['Please give me a ticket.','กรุณาให้ตั๋วฉันหนึ่งใบ','a-train-above-you'],
    ['The teacher asked me a question.','ครูถามคำถามฉันหนึ่งข้อ','getting-to-know-your-child'],
  ]},
  { target: 'her', choices: ['her','she'], focus: 'Object pronoun her', why: 'The woman receives the action, so use object-form her, not subject-form she.', whyThai: 'ผู้หญิงเป็นผู้รับการกระทำ จึงใช้รูปกรรม her ไม่ใช่รูปประธาน she', readingId: 'ronas-diary', examples: [
    ['I thanked her at the airport.','ฉันขอบคุณเธอที่สนามบิน'],
    ['I gave her my suitcase.','ฉันให้กระเป๋าเดินทางของฉันแก่เธอ'],
    ['We saw her at the gate.','พวกเราเห็นเธอที่ประตูขึ้นเครื่อง'],
    ['My sister called, and I answered her.','พี่สาวหรือน้องสาวของฉันโทรมา แล้วฉันก็ตอบเธอ'],
  ]},
  { target: 'was', choices: ['was','were'], focus: 'Past singular be', why: 'This singular subject takes was rather than were in an ordinary past-tense statement.', whyThai: 'ในประโยคบอกเล่าอดีตทั่วไป ประธานเอกพจน์นี้ใช้ was ไม่ใช่ were', readingId: 'ronas-diary', examples: [
    ['I was on my way home.','ฉันกำลังเดินทางกลับบ้าน'],
    ['My sister was at the airport.','พี่สาวหรือน้องสาวของฉันอยู่ที่สนามบินในตอนนั้น'],
    ['The plane was late yesterday.','เมื่อวานเครื่องบินมาช้า'],
    ['The door was open.','ตอนนั้นประตูเปิดอยู่'],
  ]},
  { target: 'our', choices: ['our','we','us'], focus: 'Our before a noun', why: 'Our introduces a noun belonging to the speaker and others. We and us are pronouns, not determiners.', whyThai: 'our นำหน้าคำนามที่เป็นของผู้พูดและคนอื่น ๆ ส่วน we และ us เป็นสรรพนาม ไม่ใช่คำนำหน้านาม', readingId: 'climate-around-the-world', examples: [
    ['Our summers are chilly, with a few warm days.','ฤดูร้อนของพวกเราค่อนข้างเย็น มีวันที่อุ่นอยู่ไม่กี่วัน'],
    ['Life can be hard here, but we love our home.','ชีวิตที่นี่อาจยากลำบาก แต่พวกเรารักบ้านของพวกเรา'],
    ['It’s a good way to spend our free time.','เป็นวิธีที่ดีในการใช้เวลาว่างของพวกเรา','around-the-world-right-now'],
    ['Our teacher needs five notebooks.','ครูของพวกเราต้องการสมุดห้าเล่ม','getting-to-know-your-child'],
  ]},
  { target: 'from', choices: ['from','of','on'], focus: 'Far from', why: 'Far from is the expression for distance away from a place. Far of and far on do not fit.', whyThai: 'far from ใช้บอกระยะห่างจากสถานที่ ส่วน far of และ far on ใช้แบบนี้ไม่ได้', readingId: 'climate-around-the-world', examples: [
    ['Our home is far from the city.','บ้านของพวกเราอยู่ไกลจากเมือง'],
    ['The island is far from Norway.','เกาะอยู่ไกลจากนอร์เวย์'],
    ['The airport is far from my house.','สนามบินอยู่ไกลจากบ้านของฉัน','ronas-diary'],
    ['The station is far from school.','สถานีอยู่ไกลจากโรงเรียน','a-train-above-you'],
  ]},
  { target: 'because', choices: ['because','because of'], focus: 'Because before a clause', why: 'A full clause with a subject and verb follows. Use because; because of must introduce a noun phrase instead.', whyThai: 'สิ่งที่ตามมาเป็นประโยคย่อยที่มีประธานและกริยา จึงใช้ because ส่วน because of ต้องตามด้วยกลุ่มคำนาม', readingId: 'climate-around-the-world', examples: [
    ['We wear sweaters because it is cold.','พวกเราใส่เสื้อกันหนาวเพราะอากาศหนาว'],
    ['I cannot see the stars because the city is bright.','ฉันมองไม่เห็นดวงดาวเพราะเมืองสว่างไสว','around-the-world-right-now'],
    ['I ran because my plane was ready to leave.','ฉันวิ่งเพราะเครื่องบินพร้อมจะออกเดินทางแล้ว','ronas-diary'],
    ['We went away because the volcano erupted.','พวกเราออกไปเพราะภูเขาไฟระเบิด'],
  ]},
  { target: 'but', choices: ['but','despite'], focus: 'But joining contrasting clauses', why: 'But can join these complete clauses. Despite must be followed by a noun phrase or an -ing form, not this complete clause.', whyThai: 'but เชื่อมประโยคย่อยที่สมบูรณ์เหล่านี้ได้ ส่วน despite ต้องตามด้วยกลุ่มคำนามหรือรูป ing ไม่ใช่ประโยคย่อยนี้', readingId: 'around-the-world-right-now', examples: [
    ['It’s cold, but I don’t mind.','อากาศหนาว แต่ฉันไม่สนใจ'],
    ['The sun is shining, but you think you hear thunder.','ดวงอาทิตย์กำลังส่องแสง แต่คุณคิดว่าได้ยินเสียงฟ้าร้อง','a-train-above-you'],
    ['Our island is small, but we love it.','เกาะของพวกเราเล็ก แต่พวกเรารักมัน','climate-around-the-world'],
    ['I wanted to stay, but my plane was ready to leave.','ฉันอยากอยู่ต่อ แต่เครื่องบินพร้อมจะออกเดินทางแล้ว','ronas-diary'],
  ]},
  { target: 'and', choices: ['and','also','too'], focus: 'Both … and …', why: 'Both pairs with and to join two things. Also and too cannot replace and between these two noun phrases.', whyThai: 'both ใช้คู่กับ and เพื่อเชื่อมสองสิ่ง ใช้ also หรือ too แทน and ระหว่างกลุ่มคำนามสองกลุ่มนี้ไม่ได้', readingId: 'a-big-family', examples: [
    ['Both my mother and my father work.','ทั้งแม่และพ่อของฉันทำงาน'],
    ['Both my brother and my sister live with us.','ทั้งพี่ชายหรือน้องชายและพี่สาวหรือน้องสาวของฉันอยู่กับพวกเรา'],
    ['The child needs both pens and pencils.','เด็กต้องการทั้งปากกาและดินสอ','getting-to-know-your-child'],
    ['Birders take both photos and videos.','นักดูนกถ่ายทั้งรูปและวิดีโอ','birdwatching'],
    ['I like both bread and cheese.','ฉันชอบทั้งขนมปังและชีส','street-food'],
  ]},
]

export const grammarExpansion: readonly GrammarLesson[] = groups.flatMap(group =>
  group.examples.map(([sentence, thai, readingId], index) => {
    const target = sentence.match(new RegExp(`\\b${group.target}\\b`, 'i'))?.[0]
    if (!target) throw new Error(`Missing grammar target ${group.target}: ${sentence}`)
    const uppercase = target[0] === target[0].toUpperCase()
    return {
      sentence, target, thai,
      choices: group.choices.map(choice => uppercase ? choice[0].toUpperCase() + choice.slice(1) : choice),
      focus: group.focus, why: group.why, whyThai: group.whyThai,
      practice: { id: `grammar-practice-v1-${group.target}-${index + 1}`, readingId: readingId ?? group.readingId },
    }
  }),
)
