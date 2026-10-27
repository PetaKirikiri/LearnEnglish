import { expect, it } from 'vitest'
import { classroomNotesDestination } from './notesRoute'
it('uses the maintained classroom for old lesson-one and walkthrough links', () => {
  expect(classroomNotesDestination('/english/race/lesson', '')).toBe('/classroom/index.html')
  expect(classroomNotesDestination('/english/race/lesson/', '?lesson=where-is-the', '#race-guide')).toBe('/classroom/index.html#race-guide')
  expect(classroomNotesDestination('/english/race/lesson', '', '#words')).toBe('/classroom/index.html')
})
it('routes the plural lesson into lesson two without changing other routes', () => {
  expect(classroomNotesDestination('/english/race/lesson', '?lesson=where-are-my')).toBe('/classroom/index.html?lesson=2')
  expect(classroomNotesDestination('/english/practice', '')).toBeNull()
  expect(classroomNotesDestination('/classroom/index.html', '')).toBeNull()
})
