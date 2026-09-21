import { examPracticeQuestions, type ExamCategory } from './examPracticeContent'
import type { ProgressEvent } from './progressData'
import type { QuizQuestion } from './quizContent'
import type { LearningMemory } from './learningMemory'
import { recordAnswer } from './learningMemory'

export const examCategories: ExamCategory[] = ['vocabulary','dialogue','grammar','reading']
export function examEvidence(events: readonly ProgressEvent[], bank: readonly QuizQuestion[] = examPracticeQuestions) {
 const questions=new Map(bank.map(q=>[q.id,q]))
 const targets=new Map<string,{category:ExamCategory; seen:boolean; review:boolean; examples:Set<string>; rounds:Set<string>; required:number}>()
 for(const q of bank.filter(q=>q.examUse!=='assessment')) {
  const id=q.examTarget??q.id
  const target=targets.get(id)??{category:q.examCategory!,seen:false,review:false,examples:new Set<string>(),rounds:new Set<string>(),required:0}
  target.required=Math.min(3,target.required+1);targets.set(id,target)
 }
 const unique=[...new Map(events.map(e=>[e.id,e])).values()].sort((a,b)=>a.occurred_at.localeCompare(b.occurred_at)||a.id.localeCompare(b.id))
 for(const e of unique){
  if(e.kind!=='answer') continue
  const q=questions.get(e.payload.questionId??'');if(!q)continue
  const t=targets.get(q.examTarget??q.id);if(!t)continue
  t.seen=true
  if(!e.payload.correct || (e.payload.helpWords?.length??0)>0){t.examples.clear();t.rounds.clear();t.review=true}
  else if(e.payload.roundId && q.examUse!=='assessment') {t.examples.add(q.id);t.rounds.add(e.payload.roundId);if(t.examples.size>=t.required&&t.rounds.size>=2)t.review=false}
 }
 return examCategories.map(category=>{
  const group=[...targets.values()].filter(t=>t.category===category)
  return {category,total:group.length,seen:group.filter(t=>t.seen).length,secure:group.filter(t=>!t.review&&t.examples.size>=t.required&&t.rounds.size>=2).length,review:group.filter(t=>t.review).length}
 })
}
export function memoryFromExamEvents(events:readonly ProgressEvent[], initial:LearningMemory):LearningMemory {
 const questions=new Map(examPracticeQuestions.filter(q=>q.examUse!=='assessment').map(q=>[q.id,q]))
 let memory={...initial}
 for(const e of [...new Map(events.map(e=>[e.id,e])).values()].sort((a,b)=>a.occurred_at.localeCompare(b.occurred_at))) {
  const q=questions.get(e.payload.questionId??'');if(e.kind!=='answer'||!q)continue
  const time=Date.parse(e.occurred_at)
  if(!Number.isFinite(time)||time<=(memory[q.id]?.lastAnsweredAt??0))continue
  memory=recordAnswer(memory,q,e.payload.correct===true,time,e.payload.roundId??e.id,(e.payload.helpWords?.length??0)===0)
 }
 return memory
}
export function assessmentSeen(events:readonly ProgressEvent[]) {
 return new Set(events.flatMap(e=>[...(e.payload.assessmentQuestionIds??[]),...(e.kind==='answer'&&e.payload.questionId?[e.payload.questionId]:[])]))
}
function shuffle<T>(items: readonly T[], random:()=>number) {
 const result=[...items];for(let i=result.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[result[i],result[j]]=[result[j],result[i]]}return result
}
export function createExamAssessment(events:readonly ProgressEvent[], random:()=>number=Math.random, bank:readonly QuizQuestion[]=examPracticeQuestions):QuizQuestion[]|null {
 const seen=assessmentSeen(events), result:QuizQuestion[]=[]
 for(const category of examCategories){
  const usedTargets=new Set<string>()
  const candidates=shuffle(bank.filter(q=>q.examUse==='assessment'&&q.examCategory===category&&!seen.has(q.id)),random)
  const section=candidates.filter(q=>{const target=q.examTarget??q.id;if(usedTargets.has(target))return false;usedTargets.add(target);return true}).slice(0,10)
  if(section.length<10)return null
  result.push(...section.map(q=>({...q,choices:shuffle(q.choices,random)})))
 }
 return result
}
export function assessmentResults(events:readonly ProgressEvent[]) {
 const bank=new Map(examPracticeQuestions.map(q=>[q.id,q]))
 return events.filter(e=>e.kind==='visit'&&e.payload.assessmentQuestionIds?.length===40).map(start=>{
  const expected=new Set(start.payload.assessmentQuestionIds)
  const answers=new Map(events.filter(e=>e.kind==='answer'&&e.payload.assessment&&e.payload.roundId===start.payload.roundId&&expected.has(e.payload.questionId!)).sort((a,b)=>b.occurred_at.localeCompare(a.occurred_at)).map(e=>[e.payload.questionId!,e]))
  return {id:start.id,date:start.occurred_at,answered:answers.size,complete:answers.size===40,sections:examCategories.map(category=>({category,correct:[...answers].filter(([id,e])=>bank.get(id)?.examCategory===category&&e.payload.correct&&!(e.payload.helpWords?.length)).length}))}
 }).sort((a,b)=>b.date.localeCompare(a.date))
}

export function resumeExamAssessment(events:readonly ProgressEvent[]) {
 const latest=assessmentResults(events).find(result=>!result.complete)
 if(!latest)return null
 const start=events.find(e=>e.id===latest.id)!
 const questions=start.payload.assessmentQuestionIds!.map((id,index):QuizQuestion|undefined=>{
  const q=examPracticeQuestions.find(q=>q.id===id);if(!q)return undefined
  const choices=start.payload.assessmentChoices?.[index]
  return {...q,choices:choices?.length===4&&new Set(choices).size===4&&choices.every(c=>q.choices.includes(c))?choices:shuffle(q.choices,Math.random)}
 }).filter((q):q is QuizQuestion=>Boolean(q))
 if(questions.length!==40)return null
 const answered=new Set(events.filter(e=>e.kind==='answer'&&e.payload.assessment&&e.payload.roundId===start.payload.roundId).map(e=>e.payload.questionId))
 const index=questions.findIndex(q=>!answered.has(q.id))
 return index<0?null:{questions,index,roundId:start.payload.roundId!}
}
