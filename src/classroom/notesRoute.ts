/** Old lesson-one links are aliases of the actively maintained classroom. */
export function classroomNotesDestination(pathname: string, search: string, hash = '') {
  if (pathname.replace(/\/$/, '') !== '/english/race/lesson') return null
  const value=new URLSearchParams(search).get('lesson')
  const number=value==='where-are-my'?'2':value==='where-is-the'?'1':value===null?'1':value
  // Both numeric and unsupported values reach the canonical request validator.
  return `/classroom/index.html${number==='1'?'':`?lesson=${encodeURIComponent(number)}`}${hash === '#race-guide' ? hash : ''}`
}
