import { readings } from '../content/readings'
import { buildWordData } from '../lib/wordData'
import { getQuizCatalogue, type QuizQuestion } from './quizContent'

const frequency=new Map(buildWordData(readings).ranking.map((entry,index)=>[entry.word,{count:entry.count,rank:index+1}]))
export const questionWord = (q: QuizQuestion) => (q.mode==='vocabulary' ? q.spokenText : q.answer).toLowerCase()
const catalogue = getQuizCatalogue()
const examples = new Map<string, Set<string>>()
for (const q of [...catalogue.vocabulary, ...catalogue.sentences]) {
  const key = `${q.mode}:${questionWord(q)}`
  if (!examples.has(key)) examples.set(key, new Set())
  examples.get(key)!.add(q.example)
}
export const questionExampleCount = (q: QuizQuestion) => examples.get(`${q.mode}:${questionWord(q)}`)?.size ?? 0
export function questionFrequency(q: QuizQuestion) { return frequency.get(questionWord(q)) ?? { count:0,rank:Infinity } }
export function orderedQuestionBank() {
  const catalogue=getQuizCatalogue()
  return [...catalogue.vocabulary,...catalogue.sentences].sort((a,b)=>questionFrequency(a).rank-questionFrequency(b).rank || questionWord(a).localeCompare(questionWord(b)) || a.id.localeCompare(b.id))
    .map((question,index)=>({question,order:index+1}))
}
