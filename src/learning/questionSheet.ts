import { getQuizCatalogue, type QuizQuestion } from './quizContent'
import { compareContent, questionWord } from './contentOrder'
export { questionWord, questionFrequency } from './contentOrder'

const catalogue = getQuizCatalogue()
const examples = new Map<string, Set<string>>()
for (const q of [...catalogue.vocabulary, ...catalogue.sentences]) {
  const key = `${q.mode}:${questionWord(q)}`
  if (!examples.has(key)) examples.set(key, new Set())
  examples.get(key)!.add(q.example)
}
export const questionExampleCount = (q: QuizQuestion) => examples.get(`${q.mode}:${questionWord(q)}`)?.size ?? 0
export function orderedQuestionBank() {
  const catalogue=getQuizCatalogue()
  return [...catalogue.vocabulary,...catalogue.sentences].sort(compareContent)
    .map((question,index)=>({question,order:index+1}))
}
