/** Old lesson-one links are aliases of the actively maintained classroom. */
export function classroomNotesDestination(pathname: string, search: string, hash = '') {
  if (pathname.replace(/\/$/, '') !== '/english/race/lesson') return null
  // Lesson two is separate authored material, not a duplicate of lesson one.
  if (new URLSearchParams(search).get('lesson') === 'where-are-my') return null
  return `/classroom/index.html${hash === '#race-guide' ? hash : ''}`
}
