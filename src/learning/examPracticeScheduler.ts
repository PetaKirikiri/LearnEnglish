import type { QuizQuestion } from './quizContent'
import type { ExamCategory } from './examPracticeContent'
import { hasLearnedQuestion, type LearningMemory } from './learningMemory'

const categories: ExamCategory[] = ['grammar','vocabulary','dialogue','reading']
// Keep ten-question sessions strictly within the supplied exam syllabus.
// Review is drawn from these same topics; older progress is retained, not reset.
export function selectExamPractice(bank: readonly QuizQuestion[], memory: LearningMemory, round: number, random: () => number, limit = 10) {
 const shuffled=bank.map(q=>({q,tie:random()}))
 const repair=(q:QuizQuestion)=>Boolean(memory[q.id]?.lastWrongAt!==undefined && (memory[q.id]?.correctPasses?.length??0)<2)
 const order=(a:typeof shuffled[number],b:typeof shuffled[number])=>
  Number(repair(b.q))-Number(repair(a.q))
  || Number(hasLearnedQuestion(memory[a.q.id]))-Number(hasLearnedQuestion(memory[b.q.id]))
  || (memory[a.q.id]?.lastAnsweredAt??0)-(memory[b.q.id]?.lastAnsweredAt??0)
  || a.tie-b.tie
 const queues=new Map(categories.map(category=>[category,shuffled.filter(({q})=>q.examCategory===category).sort(order).map(({q})=>q)]))
 const selected:QuizQuestion[]=[]
 for(let i=0; selected.length<limit && i<limit*categories.length; i++) {
  const category=categories[(i+round)%categories.length]
  const next=queues.get(category)?.shift()
  if(next) selected.push(next)
 }
 return selected
}
