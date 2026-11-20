import {expect,it} from 'vitest'
import {canonicalPracticeQuestion} from './practiceQuestionCatalogue'

it.each([['How-long','Hours','2 hours'],['How-far','Kilometres','5 kilometres']])(
 'keeps both old and new scoring keys for the %s cue',
 (cue,oldAnswer,newAnswer)=>{
  const old=canonicalPracticeQuestion('daily-question-7-interrogative-'+cue)
  const next=canonicalPracticeQuestion('daily-question-7-typed-interrogative-'+cue)
  expect(old?.choices[old.correct]).toBe(oldAnswer)
  expect(next?.choices[next.correct]).toBe(newAnswer)
  expect(old?.credit).toBe(next?.credit)
 },
)
