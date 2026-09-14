import { expect,it } from 'vitest'
import { getQuizCatalogue } from './quizContent'
import { orderedQuestionBank, questionFrequency } from './questionSheet'

it('includes every actual question exactly once with a stable priority number',()=>{
  const c=getQuizCatalogue(),rows=orderedQuestionBank()
  expect(rows).toHaveLength(c.vocabulary.length+c.sentences.length)
  expect(new Set(rows.map(r=>r.question.id)).size).toBe(rows.length)
  expect(rows.map(r=>r.order)).toEqual(rows.map((_,i)=>i+1))
  for(let i=1;i<rows.length;i++) expect(questionFrequency(rows[i-1].question).rank).toBeLessThanOrEqual(questionFrequency(rows[i].question).rank)
  expect(orderedQuestionBank()).toEqual(rows)
})
