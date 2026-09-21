import type { QuizQuestion } from './quizContent'
import type { ExamCategory } from './examPracticeContent'
import type { LearningMemory } from './learningMemory'

const categories: ExamCategory[] = ['grammar','vocabulary','dialogue','reading']
// Reserve two of ten slots for repairs; unseen content cannot be starved by errors.
export function selectExamPractice(bank: readonly QuizQuestion[], memory: LearningMemory, round: number, random: () => number, limit = 10) {
 const eligible=bank.filter(q=>q.examUse!=='assessment')
 const targetSeen=new Map<string,number>()
 for(const q of eligible) if(memory[q.id]) targetSeen.set(q.examTarget??q.id,(targetSeen.get(q.examTarget??q.id)??0)+1)
 const shuffled=eligible.map(q=>({q,tie:random()}))
 const repair=(q:QuizQuestion)=>Boolean(memory[q.id]?.lastWrongAt!==undefined && (memory[q.id]?.correctPasses?.length??0)<2)
 const used=new Set<string>(), targets=new Set<string>(), selected:QuizQuestion[]=[]
 for(let i=0;selected.length<limit && i<limit*categories.length;i++) {
  const category=categories[(i+round)%categories.length]
  const repairSlot=i%5===4
  const candidates=shuffled.filter(({q})=>q.examCategory===category&&!used.has(q.id))
  candidates.sort((a,b)=>Number(targets.has(a.q.examTarget??a.q.id))-Number(targets.has(b.q.examTarget??b.q.id))
   || (repairSlot?Number(repair(b.q))-Number(repair(a.q)):0)
   || Number(Boolean(memory[a.q.id]))-Number(Boolean(memory[b.q.id]))
   || (targetSeen.get(a.q.examTarget??a.q.id)??0)-(targetSeen.get(b.q.examTarget??b.q.id)??0)
   || (memory[a.q.id]?.lastAnsweredAt??0)-(memory[b.q.id]?.lastAnsweredAt??0)
   || a.tie-b.tie)
  const q=candidates[0]?.q
  if(q){ selected.push(q);used.add(q.id);targets.add(q.examTarget??q.id) }
 }
 return selected
}
