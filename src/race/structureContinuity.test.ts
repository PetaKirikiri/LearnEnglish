import {expect,it} from 'vitest'
import {classroomWordQuestion} from '../classroom/wordServer'
import {lessonPracticeTemplate} from './lessonPracticeTemplate'
import {nextPersonalQuestion} from './practiceForecast'
/** Word progression must not silently replace the selected sentence blueprint. */
for(const lesson of [3,4,5,6])for(const activity of ['phone','casino'] as const)it(`keeps Lesson ${lesson}'s sentence structure for a new learner on ${activity}`,()=>{
 const template=lessonPracticeTemplate(lesson)
 const choices={phone:nextPersonalQuestion(template.level,[],[],'structure-continuity',0,template.options),casino:classroomWordQuestion(lesson,'new-student',[],[],0,'structure-continuity').question}
 const expected=lesson===6?['identification-question','identification-answer']:['action-answer']
 {
  const q=choices[activity]
  expect(expected,`${activity}, Lesson ${lesson}: served ${JSON.stringify(q.document.english)} as ${q.document.construction}`).toContain(q.document.construction)
  if(lesson===5)expect(q.document.units.find(unit=>unit.role==='preposition')?.english).toBe('to')
 }
},60000)
