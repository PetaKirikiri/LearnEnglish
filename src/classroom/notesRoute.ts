/** Old lesson-one links are aliases of the actively maintained classroom. */
export function classroomNotesDestination(pathname: string, search: string, hash = '') {
  if (pathname.replace(/\/$/, '') !== '/english/race/lesson') return null
  const lessonTwo = new URLSearchParams(search).get('lesson') === 'where-are-my'
  return `/classroom/index.html${lessonTwo ? '?lesson=2' : ''}${hash === '#race-guide' ? hash : ''}`
}
