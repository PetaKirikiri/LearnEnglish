import {expect,it,vi} from 'vitest'
import * as dialogue from '../learning/sentenceRules/actionDialogue'
import {actionPracticeQuestions} from './actionPracticeContent'
import {actionStarsVersion,generatedActionCandidates} from './actionStarContent'

it('composes only recorded requests as vocabulary grows and preserves saved progress',()=>{
 const compose=vi.spyOn(dialogue,'actionDialogue')
 try{
  const candidates=generatedActionCandidates()
  expect(candidates.length).toBeGreaterThanOrEqual(150)
  expect(compose.mock.calls.length).toBeLessThanOrEqual(actionPracticeQuestions.filter(q=>q.level===6).length)
  expect(actionStarsVersion).toBe('action-stars-v1:9ypgoo')
 }finally{compose.mockRestore()}
})
