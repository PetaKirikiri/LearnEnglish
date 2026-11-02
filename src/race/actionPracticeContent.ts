import {lessonThreeMatrixCatalogue} from '../classroom/wordCatalogue'
import {classroomMatrices} from '../classroom/matrixLessons'
import {meaningForWord} from '../learning/sentenceRules/blueprints'
import type {SubjectWord} from '../learning/sentenceMatrix/subjectEngine'
import {actionDialogue,actionVocabulary,objectsForAction,objectDeterminers,type ActionSubject} from '../learning/sentenceRules/actionDialogue'
import type {ClassroomWord} from '../learning/sentenceMatrix/model'
// Explicit, reviewed complements. No arbitrary verb/noun combinations.
const vocabulary:ClassroomWord[]=['apple','water','book','hotel'].map(word=>lessonThreeMatrixCatalogue.find(item=>item.word===word)!)
const subjects:ActionSubject[]=['you','he','she','they']
const actions=['eating','drinking','sleeping','running','walking','playing','reading','going']
export type ActionPracticeQuestion={id:string;level:4|5;english:string;thai:string;units:ReturnType<typeof actionDialogue>['answer']['units']|ReturnType<typeof actionDialogue>['question']['units'];choices:[string,string];correct:number;audioUrl:string}
const originalQuestions:ActionPracticeQuestion[]=subjects.flatMap((subject,index)=>{
 const question=actionDialogue(subject,'eating',{vocabulary}).question
 const otherQuestion=actionDialogue(subjects[(index+1)%subjects.length],'eating',{vocabulary}).question
 return [{...question,id:`action-l4-${subject}`,level:4 as const,choices:[question.thai,otherQuestion.thai] as [string,string],correct:0,audioUrl:`/audio/action-practice/question-${subject}.wav`},...actions.map((action,actionIndex)=>{
 const answer=actionDialogue(subject,action,{vocabulary}).answer
 const wrong=actionDialogue(subject,actions[(actionIndex+1)%actions.length],{vocabulary}).answer
 return {...answer,id:`action-l5-${subject}-${action}`,level:5 as const,choices:[answer.thai,wrong.thai] as [string,string],correct:0,audioUrl:`/audio/action-practice/answer-${subject}-${action}.wav`}
 })]
})
const people:SubjectWord[]=[
 ...classroomMatrices['lesson-3'].subjectModes.names.filter(p=>p.kind==='person').map(p=>({...p,thai:p.word==='Bia'?'เบีย':p.thai})),
 ...lessonThreeMatrixCatalogue.filter(w=>meaningForWord(w)?.kind==='person').map(w=>({word:`the ${w.word}`,thai:w.number==='plural'?`กลุ่ม${w.thai}`:w.thai,number:w.number,kind:'person' as const,phrase:{noun:w.word,nounThai:w.thai,determiner:{english:'the',thai:'ที่กำลังพูดถึง'}}})),
]
const speakers=[...subjects.map(pronoun=>({pronoun,person:undefined as SubjectWord|undefined})),...people.map(person=>({pronoun:'he' as ActionSubject,person}))]
const expanded:ActionPracticeQuestion[]=[]
const slug=(s:string)=>s.toLowerCase().replace(/[^a-z]+/g,'-').replace(/-$/,'')
function add(level:4|5,speaker:typeof speakers[number],action:string,object?:string,determiner?:Parameters<typeof actionDialogue>[2]['determiner']){
 const selection={vocabulary:lessonThreeMatrixCatalogue,subject:speaker.person,object,determiner}
 const pair=actionDialogue(speaker.pronoun,action,selection)
 const sentence=level===4?pair.question:pair.answer
 const alternative=level===4
  ?actionDialogue(speaker.pronoun==='they'?'she':'they',action,{vocabulary:lessonThreeMatrixCatalogue}).question.thai
  :actionDialogue(speaker.pronoun,action==='sleeping'?'running':'sleeping',{vocabulary:lessonThreeMatrixCatalogue,subject:speaker.person}).answer.thai
 const id=`action-expanded-l${level}-${slug(sentence.english)}`
 if(expanded.some(q=>q.id===id)||originalQuestions.some(q=>q.level===level&&q.english===sentence.english))return
 expanded.push({...sentence,id,level,choices:[sentence.thai,alternative],correct:0,audioUrl:`/audio/action-practice/${id}.wav`})
}
for(const speaker of speakers){add(4,speaker,'eating');for(const action of actionVocabulary)add(5,speaker,action.word)}
// Cover every compatible noun and determiner without a huge subject x noun product.
let rotation=0
for(const action of actionVocabulary)for(const object of objectsForAction(action.word,lessonThreeMatrixCatalogue)){
 for(const determiner of objectDeterminers(object))add(5,speakers[rotation++%speakers.length],action.word,object.word,determiner.word)
}
export const actionPracticeQuestions=[...originalQuestions,...expanded]
export function actionPracticeDeck(level:4|5){const deck=actionPracticeQuestions.filter(q=>q.level===level).map(q=>Math.random()<.5?{...q,choices:[q.choices[1],q.choices[0]] as [string,string],correct:1}:{...q});for(let i=deck.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]]}return deck.slice(0,30)}
