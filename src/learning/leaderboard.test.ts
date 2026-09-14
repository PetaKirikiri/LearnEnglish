import { expect, it } from 'vitest'
import { buildLeaderboard } from './leaderboard'
import { PETA_ACCOUNT_ID } from '../auth/appAccess'
import { getQuizCatalogue } from './quizContent'
import { questionProgressKey, type ProgressEvent } from './progressData'
const key = questionProgressKey(getQuizCatalogue().vocabulary[0])
function answers(id: string, correct: boolean[]): ProgressEvent[] {
  return correct.map((value, index) => ({ id: `${id}-${index}`, learner_id: id, kind: 'answer', occurred_at: `2026-09-12T10:00:0${index}Z`, payload: { questionId: key, correct: value, roundId: `${index}` } }))
}
it('ranks mastery before accuracy, shares ties and excludes Peta and inactive accounts', () => {
  const learners = ['a','b','c','idle',PETA_ACCOUNT_ID].map(id => ({id, display_name: id}))
  const result = buildLeaderboard(learners, [...answers('a',[true,true,true]), ...answers('b',[true]), ...answers('c',[true,true,true]), ...answers(PETA_ACCOUNT_ID,[true,true,true])])
  expect(result.map(row => [row.id,row.rank,row.learned])).toEqual([['a',1,1],['c',1,1],['b',3,0]])
})
it('a mistake removes mastery and duplicate events do not inflate results', () => {
  const events = answers('a',[true,true,true,false])
  const result = buildLeaderboard([{id:'a',display_name:'A'}], [...events,...events])
  expect(result[0]).toMatchObject({learned:0,attempts:4,accuracy:0.75})
})
