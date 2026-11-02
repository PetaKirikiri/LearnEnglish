import {actionDialogue,type ActionSubject} from '../learning/sentenceRules/actionDialogue'
import type {ClassroomWord} from '../learning/sentenceMatrix/model'
// Explicit, reviewed complements. No arbitrary verb/noun combinations.
const vocabulary:ClassroomWord[]=[
 {word:'apple',thai:'แอปเปิล',indefiniteArticle:'an',classifierThai:'ลูก',categories:['food'],meaning:{kind:'physical-object',actionContexts:['food']}},
 {word:'water',thai:'น้ำ',categories:['food'],meaning:{kind:'physical-object',countability:'mass',actionContexts:['drink']}},
 {word:'book',thai:'หนังสือ',classifierThai:'เล่ม',categories:['everyday'],meaning:{kind:'physical-object',actionContexts:['readable']}},
 {word:'hotel',thai:'โรงแรม',categories:['places'],meaning:{kind:'place',roles:['destination']}},
]
const subjects:ActionSubject[]=['you','he','she','they']
const actions=['eating','drinking','sleeping','running','walking','playing','reading','going']
export type ActionPracticeQuestion={id:string;level:4|5;english:string;thai:string;units:ReturnType<typeof actionDialogue>['answer']['units']|ReturnType<typeof actionDialogue>['question']['units'];choices:[string,string];correct:number;audioUrl:string}
export const actionPracticeQuestions:ActionPracticeQuestion[]=subjects.flatMap((subject,index)=>{
 const question=actionDialogue(subject,'eating',{vocabulary}).question
 const otherQuestion=actionDialogue(subjects[(index+1)%subjects.length],'eating',{vocabulary}).question
 return [{...question,id:`action-l4-${subject}`,level:4 as const,choices:[question.thai,otherQuestion.thai] as [string,string],correct:0,audioUrl:`/audio/action-practice/question-${subject}.wav`},...actions.map((action,actionIndex)=>{
 const answer=actionDialogue(subject,action,{vocabulary}).answer
 const wrong=actionDialogue(subject,actions[(actionIndex+1)%actions.length],{vocabulary}).answer
 return {...answer,id:`action-l5-${subject}-${action}`,level:5 as const,choices:[answer.thai,wrong.thai] as [string,string],correct:0,audioUrl:`/audio/action-practice/answer-${subject}-${action}.wav`}
 })]
})
export function actionPracticeDeck(level:4|5){const deck=actionPracticeQuestions.filter(q=>q.level===level).map(q=>Math.random()<.5?{...q,choices:[q.choices[1],q.choices[0]] as [string,string],correct:1}:{...q});for(let i=deck.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]]}return deck}
