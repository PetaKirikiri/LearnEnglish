import type {PracticeLevel} from './PracticeLevelPicker'
import type {LanguageDocument} from '../learning/sentenceMatrix/LanguageQuadrant'
import {ACTION_PRACTICE_ROUND_SIZE,actionPracticeQuestions, type ActionPracticeQuestion} from './actionPracticeContent'
import {numberNounPool} from './numberFoundation'

export type BriefingExample = {
 document:LanguageDocument
 audio:string
 switchLabel:string
 choices:readonly [string,string]
 correct:number
 rule:string
 focus:readonly string[]
}
export type LevelBriefing = {
 id:PracticeLevel
 title:string
 change:'new'|'extend'|'combine'
 changeText:string
 task:string
 total:number
 examples:readonly BriefingExample[]
}
const singularPlural=['หนึ่งสิ่ง','หลายสิ่ง'] as const
function numberExample(level:1|2|3,plural:boolean):BriefingExample{
 const word=level===3?'keys':plural?'keys':'key'
 const be=level===3?(plural?'is':'are'):plural?'are':'is'
 const units:LanguageDocument['units']=[...(level===1?[]:[{english:'Where',thai:'ที่ไหน',role:'question' as const},{english:be,thai:'อยู่',role:'be' as const}]),{english:'the',thai:'ที่กำลังพูดถึง',role:'determiner'},{english:word+(level===1?'':'?'),thai:word==='keys'?'กุญแจหลายดอก':'กุญแจหนึ่งดอก',role:'object'}]
 return {document:{construction:level===1?'noun-phrase':'question',english:units.map(u=>u.english).join(' '),thai:level===1?(plural?'กุญแจหลายดอก':'กุญแจหนึ่งดอก'):'กุญแจอยู่ที่ไหน',units},audio:`/audio/number-foundation/${level===1?'the':`where-${be}-the`}-${word}.wav`,switchLabel:level===3?be:word,
  choices:level===3?['ถูก','ผิด']:singularPlural,correct:plural?1:0,
  rule:level===1?'คู่นี้: เติม s → หลายสิ่ง · ฟังเสียงท้ายคำ':level===2?'หนึ่งสิ่งใช้ is · หลายสิ่งใช้ are':plural?'หลายสิ่งใช้ are · is จึงไม่ถูก':'keys มีหลายสิ่ง → are จึงถูก',
  focus:level===1?['keys']:['is','are','key','keys']}
}
function actionExample(english:string,switchLabel:string,rule:string,focus:readonly string[]):BriefingExample{
 const q=actionPracticeQuestions.find(q=>q.english===english)
 if(!q)throw new Error(`Missing recorded briefing example: ${english}`)
 return fromQuestion(q,switchLabel,rule,focus)
}
function fromQuestion(q:ActionPracticeQuestion,switchLabel:string,rule:string,focus:readonly string[]):BriefingExample{
 return {document:{english:q.english,thai:q.thai,units:q.units,construction:q.level===4?'action-question':'action-answer'},audio:q.audioUrl,switchLabel,choices:q.choices,correct:q.correct,rule,focus}
}
const pair=(level:1|2|3)=>[numberExample(level,false),numberExample(level,true)]
export const journeyBriefings:readonly LevelBriefing[]=[
 {id:1,title:'หนึ่งหรือหลาย',change:'new',changeText:'เสียงท้ายคำ',task:'ฟัง → เลือกจำนวน',total:30,examples:pair(1)},
 {id:2,title:'is หรือ are',change:'extend',changeText:'จากคำ → ทั้งประโยค',task:'ฟัง → เลือกจำนวน',total:30,examples:pair(2)},
 {id:3,title:'จับคู่ให้ถูก',change:'combine',changeText:'จำนวน + is / are',task:'ฟัง → เลือกถูก / ผิด',total:30,examples:pair(3)},
 {id:4,title:'ใครกำลังทำอะไร?',change:'new',changeText:'ถามถึงการกระทำ',task:'ฟัง → เลือกคำแปล',total:ACTION_PRACTICE_ROUND_SIZE,examples:[
  actionExample('What are you doing?','you','ถาม: is / are อยู่ก่อนคน · you ใช้ are',['are','you']),
  actionExample('What is he doing?','he / she','he / she ใช้ is · ถามว่าเขากำลังทำอะไร',['is','he']),
  actionExample('What are they doing?','we / they','we / they ใช้ are · หลายคน',['are','they']),
 ]},
 {id:5,title:'ตอบว่ากำลังทำอะไร',change:'extend',changeText:'จากถาม → ตอบ',task:'ฟัง → เลือกคำแปล',total:30,examples:[
  actionExample('I am walking.','I','ตอบ: I ใช้ am · walking = กำลังเดิน',['I','am']),
  actionExample('He is walking.','he / she','he / she ใช้ is · กำลังเดินเหมือนเดิม',['He','is']),
  actionExample('They are walking.','you / we / they','you / we / they ใช้ are · กำลังเดินเหมือนเดิม',['They','are']),
 ]},
 {id:6,title:'ใครทำอะไร · ของใคร',change:'combine',changeText:'คน + การกระทำ + เจ้าของ',task:'ฟัง → เลือกคำแปล',total:30,examples:[
  actionExample('I am eating my apple.','my','my = ของฉัน · คนทำกับเจ้าของอาจไม่ใช่คนเดียวกัน',['my']),
  actionExample('I am eating your apple.','your','your = ของคุณ · ฉันกิน แต่แอปเปิลเป็นของคุณ',['your']),
 ]},
]
export const briefingFor=(level:PracticeLevel)=>journeyBriefings[level-1]
export function levelPreview(level:PracticeLevel){
 const role=level===4?'person':'action'
 const words=level<=3?numberNounPool(level).map(n=>n.singular):[...new Set(actionPracticeQuestions.filter(q=>q.level===level).flatMap(q=>q.units.filter(u=>u.role===role).map(u=>u.english.replace(/[?.]/g,'').trim())))]
 return {words,total:briefingFor(level).total}
}
