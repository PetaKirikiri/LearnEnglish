import type {ClassroomWord} from './sentenceMatrix/model'
import type {WordMeaning} from './sentenceRules/blueprints'
import type {VocabularyCategory} from './sentenceMatrix/vocabularyCategories'

type Entry={singular:string;plural?:string;thai:string;classifierThai?:string;categories:readonly VocabularyCategory[];meaning:WordMeaning}
/** Explicit senses and affordances, shared by teacher exploration and adaptive practice. */
const establishedObjects:readonly Entry[]=[
 {singular:'home',plural:'homes',thai:'บ้าน',classifierThai:'หลัง',categories:['places','buildings'],meaning:{kind:'place',countability:'count',locationPrepositions:['at','in'],actionContexts:['destination','cleanable','sleep-inside','paintable','depictable','visitable']}},
 {singular:'room',plural:'rooms',thai:'ห้อง',classifierThai:'ห้อง',categories:['places'],meaning:{kind:'place',countability:'count',locationPrepositions:['in'],actionContexts:['destination','cleanable','sleep-inside','paintable']}},
 {singular:'food',thai:'อาหาร',categories:['food'],meaning:{kind:'physical-object',countability:'mass',actionContexts:['food','purchasable','carryable','cookable']}},
 {singular:'rice',thai:'ข้าว',categories:['food'],meaning:{kind:'physical-object',countability:'mass',actionContexts:['food','purchasable','carryable','cookable']}},
 {singular:'bread',thai:'ขนมปัง',categories:['food'],meaning:{kind:'physical-object',countability:'mass',actionContexts:['food','purchasable','holdable','carryable','cuttable']}},
 {singular:'milk',thai:'นม',categories:['food'],meaning:{kind:'physical-object',countability:'mass',actionContexts:['drink','purchasable','carryable']}},
 {singular:'money',thai:'เงิน',categories:['everyday'],meaning:{kind:'physical-object',countability:'mass',actionContexts:['holdable','carryable','findable','usable']}},
 {singular:'car',plural:'cars',thai:'รถยนต์',classifierThai:'คัน',categories:['transport'],meaning:{kind:'physical-object',countability:'count',actionContexts:['drivable','washable','cleanable','usable','findable','purchasable','watchable','spatial-target','repairable','depictable']}},
]
/** Adults unless explicitly marked by the reviewed child/baby artwork. */
export const additionalPeople=[
 {singular:'police officer',plural:'police officers',thai:'ตำรวจ'},
 {singular:'nurse',plural:'nurses',thai:'พยาบาล'},
 {singular:'teacher',plural:'teachers',thai:'ครู'},
 {singular:'student',plural:'students',thai:'นักเรียน'},
 {singular:'firefighter',plural:'firefighters',thai:'นักดับเพลิง'},
 {singular:'farmer',plural:'farmers',thai:'เกษตรกร'},
 {singular:'chef',plural:'chefs',thai:'พ่อครัวหรือแม่ครัว'},
 {singular:'driver',plural:'drivers',thai:'คนขับรถ'},
 {singular:'waiter',plural:'waiters',thai:'พนักงานเสิร์ฟชาย'},
 {singular:'waitress',plural:'waitresses',thai:'พนักงานเสิร์ฟหญิง'},
 {singular:'dentist',plural:'dentists',thai:'ทันตแพทย์'},
 {singular:'vet',plural:'vets',thai:'สัตวแพทย์'},
 {singular:'builder',plural:'builders',thai:'ช่างก่อสร้าง'},
 {singular:'cleaner',plural:'cleaners',thai:'พนักงานทำความสะอาด'},
 {singular:'shopkeeper',plural:'shopkeepers',thai:'เจ้าของร้าน'},
 {singular:'mechanic',plural:'mechanics',thai:'ช่างซ่อมรถ'},
 {singular:'pilot',plural:'pilots',thai:'นักบิน'},
 {singular:'musician',plural:'musicians',thai:'นักดนตรี'},
 {singular:'singer',plural:'singers',thai:'นักร้อง'},
 {singular:'dancer',plural:'dancers',thai:'นักเต้น'},
 {singular:'artist',plural:'artists',thai:'ศิลปิน'},
 {singular:'baby',plural:'babies',thai:'ทารก'},
 {singular:'grandfather',plural:'grandfathers',thai:'ปู่หรือตา'},
 {singular:'grandmother',plural:'grandmothers',thai:'ย่าหรือยาย'},
] as const
export const additionalObjects:readonly Entry[]=[
 {singular:'door',plural:'doors',thai:'ประตู',classifierThai:'บาน',categories:['everyday'],meaning:{kind:'physical-object',countability:'count',actionContexts:['openable','cleanable','paintable','repairable','spatial-target']}},
 {singular:'window',plural:'windows',thai:'หน้าต่าง',classifierThai:'บาน',categories:['everyday'],meaning:{kind:'physical-object',countability:'count',actionContexts:['openable','washable','cleanable','repairable','spatial-target']}},
 {singular:'bed',plural:'beds',thai:'เตียง',classifierThai:'หลัง',categories:['furniture'],meaning:{kind:'physical-object',countability:'count',actionContexts:['cleanable','purchasable','repairable','sleep-surface','spatial-target']}},
 {singular:'ball',plural:'balls',thai:'ลูกบอล',classifierThai:'ลูก',categories:['sports'],meaning:{kind:'physical-object',countability:'count',actionContexts:['holdable','carryable','washable','findable','purchasable','depictable','pushable','spatial-target']}},
 {singular:'computer',plural:'computers',thai:'คอมพิวเตอร์',classifierThai:'เครื่อง',categories:['everyday'],meaning:{kind:'physical-object',countability:'count',actionContexts:['usable','cleanable','repairable','purchasable','spatial-target']}},
 {singular:'television',plural:'televisions',thai:'โทรทัศน์',classifierThai:'เครื่อง',categories:['everyday'],meaning:{kind:'physical-object',countability:'count',actionContexts:['watchable','usable','cleanable','repairable','purchasable','spatial-target']}},
 {singular:'juice',thai:'น้ำผลไม้',categories:['food'],meaning:{kind:'physical-object',countability:'mass',actionContexts:['drink','purchasable','carryable']}},
 {singular:'coffee',thai:'กาแฟ',categories:['food'],meaning:{kind:'physical-object',countability:'mass',actionContexts:['drink','purchasable','carryable']}},
]
export const expandedEverydayObjects:readonly Entry[]=[...establishedObjects,...additionalObjects]
export const expandedEverydayCatalogue:readonly ClassroomWord[]=expandedEverydayObjects.flatMap(item=>[
 {...item,word:item.singular,number:'singular' as const},
 ...(item.plural?[{...item,word:item.plural,number:'plural' as const}]:[]),
])
const establishedPeopleWords=['brother','sister','friend','child','person','family'] as const
export const expandedPeopleWords=[...establishedPeopleWords,...additionalPeople.map(person=>person.singular)] as const
export const expandedVocabularyOrder=[...establishedPeopleWords,...establishedObjects.map(item=>item.singular),...additionalPeople.map(person=>person.singular),...additionalObjects.map(item=>item.singular)]
export function expandedVocabularyIcon(word:string){
 const object=expandedEverydayObjects.find(item=>item.singular===word||item.plural===word)
 const name=object?.singular??word
 return expandedVocabularyOrder.includes(name)?`/classroom/icons/everyday/expanded/${name.replaceAll(' ','-')}.png`:undefined
}
