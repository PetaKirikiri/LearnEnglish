export type PronunciationSketch = { syllables: string[]; pitch: number[]; emphasis: number | null; drawn: boolean }
export type PronunciationGuide = { thai: PronunciationSketch; english: PronunciationSketch }
// Spelling-based teaching chunks, not IPA or measured pitch. Stress is separate
// from the editable example melody. Unknown words remain whole until authored.
const chunks: Record<string, [string, number]> = {
 i:['I',0],you:['you',0],he:['he',0],she:['she',0],am:['am',0],at:['at',0],
 was:['was',0],were:['were',0],his:['his',0],her:['her',0],
 apple:['ap-ple',0],banana:['ba-na-na',1],orange:['or-ange',0],oranges:['or-ang-es',0],
 sandwich:['sand-wich',0],sandwiches:['sand-wich-es',0],umbrella:['um-brel-la',1],wallet:['wal-let',0],
 passport:['pass-port',0],laptop:['lap-top',0],camera:['cam-er-a',0],bicycle:['bi-cy-cle',0],
 bus:['bus',0],buses:['bus-es',0],restaurant:['res-tau-rant',0],
 computer:['com-pu-ter',1], hotel:['ho-tel',1], toilet:['toi-let',0], gym:['gym',0],
 'padel court':['pa-del-court',0], racket:['rack-et',0], phone:['phone',0], 'air conditioner':['air-con-di-tion-er',1],
 fan:['fan',0], remote:['re-mote',1], doctor:['doc-tor',0], clinic:['clin-ic',0], school:['school',0],
 motorbike:['mo-tor-bike',0], table:['ta-ble',0], chair:['chair',0], bank:['bank',0],
 bookstore:['book-store',0], watch:['watch',0], clock:['clock',0], bedroom:['bed-room',0],
 where:['where',0], is:['is',0], are:['are',0], the:['the',0], my:['my',0], your:['your',0],
 shoe:['shoe',0], key:['key',0], sock:['sock',0], bag:['bag',0], ticket:['tick-et',0], book:['book',0],
 sandal:['san-dal',0], boot:['boot',0], shirt:['shirt',0], hat:['hat',0], pen:['pen',0],
 pencil:['pen-cil',0], charger:['char-ger',0], towel:['tow-el',0], bottle:['bot-tle',0],
 cup:['cup',0], plate:['plate',0], glasses:['glass-es',0], trousers:['trou-sers',0],
}
export const pronunciationKey = (word:string) => word.toLowerCase().trim().replace(/[?!.,]+$/,'')
// Thai-script sound approximations of the English word, never its translation.
// These do not determine a speaker's accent or supply measured lexical tones.
const thaiSounds: Record<string,string> = {
 i:'ไอ',you:'ยู',he:'ฮี',she:'ชี',am:'แอม',at:'แอท',
 was:'วอซ',were:'เวอร์',his:'ฮิซ',her:'เฮอร์',
 apple:'แอพ-เพิล',apples:'แอพ-เพิลซ',banana:'เบอะ-แน-นะ',bananas:'เบอะ-แน-นะซ',
 orange:'ออ-รินจ์',oranges:'ออ-ริน-จิซ',sandwich:'แซนด์-วิช',sandwiches:'แซนด์-วิช-อิซ',
 umbrella:'อัม-เบรล-ละ',umbrellas:'อัม-เบรล-ละซ',wallet:'วอล-ลิท',wallets:'วอล-ลิทส์',
 passport:'พาส-พอร์ท',passports:'พาส-พอร์ทส์',laptop:'แล็พ-ท็อพ',laptops:'แล็พ-ท็อพส์',
 camera:'แคม-เมอะ-ระ',cameras:'แคม-เมอะ-ระซ',bicycle:'ไบ-ซิ-เคิล',bicycles:'ไบ-ซิ-เคิลซ',
 bus:'บัส',buses:'บัส-อิซ',restaurant:'เรส-เทอะ-รองท์',restaurants:'เรส-เทอะ-รองท์ส',
 computer:'คอม-พิว-เตอร์',hotel:'โฮ-เทล',toilet:'ทอย-เล็ท',gym:'จิม',
 'padel court':'แพ-เดล-คอร์ท',racket:'แร็ก-เก็ต',phone:'โฟน',phones:'โฟนซ','air conditioner':'แอร์-คัน-ดิ-ชัน-เนอร์',
 fan:'แฟน',remote:'รี-โมท',doctor:'ด็อก-เทอร์',clinic:'คลิ-นิก',school:'สกูล',
 motorbike:'โม-เทอร์-ไบค์',table:'เท-เบิล',chair:'แชร์',bank:'แบงก์',
 bookstore:'บุ๊ก-สตอร์',watch:'ว็อทช์',clock:'คล็อก',bedroom:'เบด-รูม',
 where:'แวร์',is:'อิซ',are:'อาร์',the:'เดอะ',my:'มาย',your:'ยอร์',
 shoe:'ชู',shoes:'ชูซ',key:'คี',keys:'คีซ',sock:'ซ็อก',socks:'ซ็อกส์',
 bag:'แบ็ก',bags:'แบ็กซ',ticket:'ทิก-เก็ต',tickets:'ทิก-เก็ตส์',book:'บุ๊ก',books:'บุ๊กส์',
 sandal:'แซน-เดิล',sandals:'แซน-เดิลซ',boot:'บูท',boots:'บูทส์',shirt:'เชิร์ท',shirts:'เชิร์ทส์',
 hat:'แฮ็ท',hats:'แฮ็ทส์',pen:'เพ็น',pens:'เพ็นซ',pencil:'เพ็น-ซิล',pencils:'เพ็น-ซิลซ',
 charger:'ชาร์-เจอร์',chargers:'ชาร์-เจอร์ซ',towel:'เทา-เอิล',towels:'เทา-เอิลซ',
 bottle:'บ็อท-เทิล',bottles:'บ็อท-เทิลซ',cup:'คัพ',cups:'คัพส์',plate:'เพลท',plates:'เพลทส์',
 glasses:'กลาส-อิซ',trousers:'เทรา-เซอร์ซ',
}
export function defaultGuide(word:string):PronunciationGuide {
 const key=pronunciationKey(word)
 let entry=chunks[key]
 if(!entry && key.endsWith('s') && chunks[key.slice(0,-1)]) {
  const base=chunks[key.slice(0,-1)]
  entry=[`${base[0]}s`,base[1]]
 }
 const syllables=(entry?.[0]??key).split('-')
 const thaiSyllables=thaiSounds[key]?.split('-')??['…']
 if(key==='computer')return {thai:{syllables:thaiSyllables,pitch:[.5,.35,.9],emphasis:null,drawn:true},english:{syllables,pitch:[.4,.7,.25],emphasis:1,drawn:true}}
 // English is a teaching melody based on known word stress, not a recording.
 // A single syllable has no within-word stress contrast.
 return {
  thai:{syllables:thaiSyllables,pitch:thaiSyllables.map(()=>.5),emphasis:null,drawn:false},
  english:{syllables,pitch:syllables.map((_,i)=>!entry ? .5 : syllables.length===1?.6:i===entry[1]?.78:i<entry[1]?.4:.28),emphasis:entry?.[1]??null,drawn:!!entry},
 }
}
export function isSketch(value:unknown):value is PronunciationSketch {
 if(!value||typeof value!=='object')return false
 const v=value as PronunciationSketch
 return Array.isArray(v.syllables)&&v.syllables.length>0&&v.syllables.length<=12&&v.syllables.every(s=>typeof s==='string'&&s.length>0&&s.length<=100)&&Array.isArray(v.pitch)&&v.pitch.length===v.syllables.length&&v.pitch.every(p=>Number.isFinite(p)&&p>=0&&p<=1)&&(v.emphasis===null||(Number.isInteger(v.emphasis)&&v.emphasis>=0&&v.emphasis<v.syllables.length))&&typeof v.drawn==='boolean'
}
const storageKey=(word:string)=>`englishsuccess:pronunciation-sketch:v1:${pronunciationKey(word)}`
export function readGuide(word:string):PronunciationGuide {
 try{const value=JSON.parse(localStorage.getItem(storageKey(word))??'null');if(isSketch(value?.thai)&&isSketch(value?.english))return value}catch{/* A corrupt saved sketch must not break word help. */}
 return defaultGuide(word)
}
export function saveGuide(word:string,guide:PronunciationGuide){localStorage.setItem(storageKey(word),JSON.stringify(guide))}
export function splitSketch(sketch:PronunciationSketch,text:string):PronunciationSketch {
 const syllables=text.split(/\s*[-·]\s*/).map(s=>s.trim()).filter(Boolean).slice(0,12)
 if(!syllables.length)return sketch
 return {...sketch,syllables,pitch:syllables.map((_,i)=>sketch.pitch[i]??.5),emphasis:sketch.emphasis!==null&&sketch.emphasis<syllables.length?sketch.emphasis:null}
}
