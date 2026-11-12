import type {Action} from './actionDialogue'
const icon=(id:string)=>`/classroom/icons/actions/expanded/${id}.png`
/** Each entry is a reviewed use: particles stay with phrasal verbs; prepositions get a slot. */
export const expandedActions:readonly Action[]=[
 {word:'using',thai:'ใช้',complement:'object',objects:['usable'],categories:['everyday'],icon:icon('using')},
 {word:'carrying',thai:'ถือไป',complement:'object',objects:['carryable'],categories:['everyday'],icon:icon('carrying')},
 {word:'finding',thai:'พบ',complement:'object',objects:['findable'],categories:['everyday'],icon:icon('finding')},
 {word:'buying',thai:'ซื้อ',complement:'object',objects:['purchasable'],categories:['everyday'],icon:icon('buying')},
 {word:'closing',thai:'ปิด',complement:'object',objects:['openable'],categories:['everyday'],icon:icon('closing')},
 {word:'wearing',thai:'สวม',complement:'object',objects:['wearable'],categories:['clothing'],icon:icon('wearing')},
 {word:'putting on',uses:{on:{objects:['wearable'],spoken:'putting',thai:'—'}},thai:'สวมใส่',complement:'object',objects:['wearable'],categories:['clothing'],icon:icon('putting-on')},
 {word:'taking off',uses:{off:{objects:['wearable'],spoken:'taking',thai:'—'}},thai:'ถอด',complement:'object',objects:['wearable'],categories:['clothing'],icon:icon('taking-off')},
 {word:'riding',thai:'ขี่',complement:'object',objects:['rideable'],categories:['transport'],icon:icon('riding')},
 {word:'catching',thai:'ขึ้นให้ทัน',complement:'object',objects:['public-transport'],categories:['transport'],icon:icon('catching')},
 {word:'getting on',spoken:'getting',preposition:{english:'on',thai:'ขึ้น'},thai:'เคลื่อนตัว',sentenceThai:'ขึ้น',complement:'prepositional',objects:['public-transport'],categories:['transport'],icon:icon('getting-on')},
 {word:'helping',thai:'ช่วย',complement:'object',objects:['person'],categories:['people'],icon:icon('helping')},
 {word:'watching',thai:'ดู',complement:'object',objects:['watchable','person'],categories:['everyday'],icon:icon('watching')},
 {word:'teaching',thai:'สอน',complement:'object',objects:['person'],categories:['people'],icon:icon('teaching')},
 {word:'sitting',thai:'นั่ง',complement:'none',objects:[],categories:['everyday'],icon:icon('sitting')},
 {word:'standing',thai:'ยืน',complement:'none',objects:[],categories:['everyday'],icon:icon('standing')},
 {word:'waiting',thai:'รอ',complement:'none',objects:[],categories:['everyday'],icon:icon('waiting')},
 {word:'arriving',preposition:{english:'at',thai:'ที่'},thai:'มาถึง',complement:'prepositional',objects:['destination'],categories:['places'],icon:icon('arriving')},
 {word:'leaving',thai:'ออกจาก',complement:'object',objects:['destination'],categories:['places'],icon:icon('leaving')},
]
