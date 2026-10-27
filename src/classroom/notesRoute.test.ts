import { expect, it } from 'vitest'
import { classroomNotesDestination } from './notesRoute'
it('uses the maintained classroom for old lesson-one and walkthrough links', () => {
  expect(classroomNotesDestination('/english/race/lesson', '')).toBe('/classroom/index.html')
  expect(classroomNotesDestination('/english/race/lesson/', '?lesson=where-is-the', '#race-guide')).toBe('/classroom/index.html#race-guide')
  expect(classroomNotesDestination('/english/race/lesson', '', '#words')).toBe('/classroom/index.html')
})
it('preserves the separate plural lesson and other app routes', () => {
  expect(classroomNotesDestination('/english/race/lesson', '?lesson=where-are-my')).toBeNull()
  expect(classroomNotesDestination('/english/practice', '')).toBeNull()
  expect(classroomNotesDestination('/classroom/index.html', '')).toBeNull()
})
