import {diverseQuestions} from './diverseQuestions'
import {taughtActionLine} from '../learning/sentenceRules/assessmentScope'
import {subjectPronouns} from '../learning/sentenceMatrix/subjectEngine'
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
type ActionLine = ReturnType<typeof actionDialogue>['question'|'answer']
export type ActionPracticeQuestion = ActionLine & {id:string;level:4|5|6;choices:[string,string];correct:number;audioUrl:string;distractorUnits:ActionLine['units']}

function recordedQuestion(level:4|5|6,id:string,source:ActionLine,other:ActionLine,audioUrl:string):ActionPracticeQuestion {
 return {...source,id,level,choices:[source.thai,other.thai],correct:0,audioUrl,distractorUnits:other.units}
}
const originalQuestions:ActionPracticeQuestion[]=subjects.flatMap((subject,index)=>{
 const question=actionDialogue(subject,'eating',{vocabulary}).question
 const otherQuestion=actionDialogue(subjects[(index+1)%subjects.length],'eating',{vocabulary}).question
 return [recordedQuestion(4,`action-l4-${subject}`,question,otherQuestion,`/audio/action-practice/question-${subject}.wav`),...actions.map((action,actionIndex)=>{
 const answer=actionDialogue(subject,action,{vocabulary}).answer
 const candidate=actionDialogue(subject,actions[(actionIndex+1)%actions.length],{vocabulary}).answer
 const replaceDistractor=!taughtActionLine(5,candidate.units)
 const wrong=replaceDistractor?actionDialogue(subject,'sleeping',{vocabulary}).answer:candidate
 return recordedQuestion(5,`action-l5-${subject}-${action}${replaceDistractor?'-taught':''}`,answer,wrong,`/audio/action-practice/answer-${subject}-${action}.wav`)
 })]
})
const people:SubjectWord[]=[
 ...classroomMatrices['lesson-3'].subjectModes.names.filter(p=>p.kind==='person').map(p=>({...p,thai:p.word==='Bia'?'เบีย':p.thai})),
 ...lessonThreeMatrixCatalogue.filter(w=>meaningForWord(w)?.kind==='person').map(w=>({word:`the ${w.word}`,thai:w.number==='plural'?`กลุ่ม${w.thai}`:w.thai,number:w.number,kind:'person' as const,phrase:{noun:w.word,nounThai:w.thai,determiner:{english:'the',thai:'ที่กำลังพูดถึง'}}})),
]
const speakers=[...[...subjects,...(['i','we','it'] as const)].map(pronoun=>({pronoun,person:undefined as SubjectWord|undefined})),...people.map(person=>({pronoun:'he' as ActionSubject,person}))]
const expanded:ActionPracticeQuestion[]=[]
const slug=(s:string)=>s.toLowerCase().replace(/[^a-z]+/g,'-').replace(/-$/,'')
function add(level:4|5|6,speaker:typeof speakers[number],action:string,object?:string,determiner?:Parameters<typeof actionDialogue>[2]['determiner']){
 const selection={vocabulary:lessonThreeMatrixCatalogue,subject:speaker.person,object,determiner}
 const pair=actionDialogue(speaker.pronoun,action,selection)
 const sentence=level===4?pair.question:pair.answer
 const alternative=level===4
  ?actionDialogue(speaker.pronoun==='they'?'she':'they',action,{vocabulary:lessonThreeMatrixCatalogue}).question
  :actionDialogue(speaker.pronoun,action==='sleeping'?'running':'sleeping',{vocabulary:lessonThreeMatrixCatalogue,subject:speaker.person}).answer
 const id=`action-expanded-l${level}-${slug(sentence.english)}`
 if(expanded.some(q=>q.id===id)||originalQuestions.some(q=>q.level===level&&q.english===sentence.english))return
 expanded.push(recordedQuestion(level,id,sentence,alternative,`/audio/action-practice/${id}.wav`))
}
for(const speaker of speakers){add(4,speaker,'eating');for(const action of actionVocabulary.filter(a=>!a.level||a.level<=5))add(5,speaker,action.word)}
// Cover every compatible noun and determiner without a huge subject x noun product.
let rotation=0
for(const action of actionVocabulary.filter(a=>!a.level||a.level<=5))for(const object of objectsForAction(action.word,lessonThreeMatrixCatalogue)){
 for(const determiner of objectDeterminers(object))add(5,speakers[rotation++%speakers.length],action.word,object.word,determiner.word)
}
// Next level keeps the established frame; only reviewed verb/object combinations grow.
const nextLevel:ActionPracticeQuestion[]=[]
const nextOwners=['my','your','his','her','their','our'] as const
// Preserve the authored rotation/IDs while taking every meaning and agreement fact from the shared catalogue.
const nextSubjects:SubjectWord[]=['I','you','he','she','they','we'].map(word=>{
 const subject=subjectPronouns.find(item=>item.word===word)
 if(!subject)throw new Error(`Unsupported practice subject: ${word}`)
 return {...subject,kind:'person'}
})

for(const verb of ['eating','reading','drinking','holding','opening','washing']){
 const objects=objectsForAction(verb,lessonThreeMatrixCatalogue)
 for(let n=0;n<objects.length;n++)for(let person=0;person<nextSubjects.length;person++){
  const owner=nextOwners[(n+person)%nextOwners.length]
  const selection={vocabulary:lessonThreeMatrixCatalogue,subject:nextSubjects[person],object:objects[n].word,determiner:owner}
  const sentence=actionDialogue('i',verb,selection).answer
  // Distractor changes ownership, preserving natural Thai and the same sentence frame.
  const other=actionDialogue('i',verb,{...selection,determiner:nextOwners[(n+person+1)%nextOwners.length]}).answer
  const id=`action-l6-${slug(sentence.english)}`
  nextLevel.push(recordedQuestion(6,id,sentence,other,`/audio/action-practice/${id}.wav`))
 }
}
// A paired example for the preparation screen, generated by the same blueprint.
const guide=actionDialogue('i','eating',{vocabulary:lessonThreeMatrixCatalogue,subject:nextSubjects[0],object:'an apple',determiner:'your'}).answer
if(!nextLevel.some(q=>q.english===guide.english)){const id=`action-l6-${slug(guide.english)}`;nextLevel.push(recordedQuestion(6,id,guide,nextLevel[0],`/audio/action-practice/${id}.wav`))}
// Keep the recording rotation and identifiers stable for previously earned scores.
// Only rows whose prompt AND competing translation use taught language can go live.
const recordings=[...originalQuestions,...expanded,...nextLevel]
/** Authoring inventory only; assessment callers must use actionPracticeQuestions. */
export const actionPracticeRecordings:readonly ActionPracticeQuestion[]=recordings
const approved=recordings.filter(q=>taughtActionLine(q.level,q.units)&&taughtActionLine(q.level,q.distractorUnits))

// If excluding a speaker removes the only example of a taught object/owner pair,
// reuse its recorded sentence with a taught speaker and a familiar action contrast.
const complementKey=(q:ActionPracticeQuestion)=>q.units.filter(u=>['action','determiner','object'].includes(u.role)).map(u=>u.english).join(' ')
const covered=new Set(approved.filter(q=>q.level===5).map(complementKey))
const reviewedPairs=new Set(expanded.filter(q=>q.level===5).map(complementKey))
const replacements:ActionPracticeQuestion[]=[]
for(const q of nextLevel){
 const pair=complementKey(q)
 if(!reviewedPairs.has(pair)||covered.has(pair)||!taughtActionLine(5,q.units))continue
 const subject=q.units.find(u=>u.role==='person')!.english
 const person=nextSubjects.find(p=>p.word.toLowerCase()===subject.toLowerCase())!
 const other=actionDialogue(person.word.toLowerCase() as ActionSubject,'sleeping',{vocabulary:lessonThreeMatrixCatalogue,subject:person}).answer
 replacements.push(recordedQuestion(5,`action-l5-taught-${slug(q.english)}`,q,other,q.audioUrl))
 covered.add(pair)
}
export const actionPracticeQuestions=[...approved,...replacements]
function practiceGroups(question:ActionPracticeQuestion){
 const word=question.units.find(unit=>unit.role==='object')?.english.toLowerCase().replace(/[.!?]$/,'')
 const noun=lessonThreeMatrixCatalogue.find(item=>item.word===word)
 return [noun?.singular??word??'no-object',question.units.find(unit=>unit.role==='person')?.english??'',question.units.find(unit=>unit.role==='action')?.english??'',question.units.find(unit=>unit.role==='determiner')?.english??'']
}
export function actionPracticeDeck(level:4|5|6){
 const candidates=actionPracticeQuestions.filter(question=>question.level===level)
 const selected=level===6
  ?['eating','reading','drinking','holding','opening','washing'].flatMap(action=>diverseQuestions(candidates.filter(question=>question.units.some(unit=>unit.role==='action'&&unit.english===action)),5,practiceGroups))
  :diverseQuestions(candidates,30,practiceGroups)
 return selected.map(question=>Math.random()<.5?{...question,choices:[question.choices[1],question.choices[0]] as [string,string],correct:1}:{...question})
}
