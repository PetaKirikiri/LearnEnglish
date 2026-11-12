// @vitest-environment happy-dom
import './testing/forbidSentenceBanks'
import {beforeEach,expect,it,vi} from 'vitest'
import {nextPersonalQuestion} from './practiceForecast'
import {classroomWordQuestion} from '../classroom/wordServer'
import {lessonPracticeTemplate} from './lessonPracticeTemplate'
import {composeQuestion} from './generatedPracticeContent'
import {assertBlueprintQuestion} from './testing/blueprintIntegrity'

beforeEach(()=>{localStorage.clear();vi.mocked(composeQuestion).mockClear()})
// These are requirements, not expected failures. The current engine must fail
// until it serves the blueprint without enumerating a sentence catalogue.
for(const path of ['phone','classroom GO'] as const)for(const lesson of [1,2,3,4,5,6]){
 it(`${path}, lesson ${lesson}: serves the blueprint without requesting a sentence bank`,()=>{
  const template=lessonPracticeTemplate(lesson)
  const question=path==='phone'
   ?nextPersonalQuestion(template.level,[],[],'architecture-contract',0,template.options)
   :classroomWordQuestion(lesson,'fresh-architecture-learner',[],[],0,'architecture-contract').question
  expect(question).toBeDefined()
  expect(vi.mocked(composeQuestion).mock.calls.length).toBeLessThanOrEqual(1)
  assertBlueprintQuestion(question)
 })
}
