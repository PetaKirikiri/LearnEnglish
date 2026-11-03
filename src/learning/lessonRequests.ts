/** Course lessons are independent of practice-level numbers and saved progress. */
export const lessonNumbers = ['1', '2', '3', '4'] as const
export type LessonNumber = typeof lessonNumbers[number]
export type LessonId = `lesson-${LessonNumber}`
export class UnsupportedLessonError extends Error {
  constructor(value: unknown) { super(`Unsupported lesson: ${String(value)}. Choose Lesson 1–4.`); this.name = 'UnsupportedLessonError' }
}
export function lessonNumber(value: unknown): LessonNumber {
  if (value === null || value === undefined) return '1'
  const number = typeof value === 'number' ? String(value) : value
  const normalized = typeof number === 'string' && number.startsWith('lesson-') ? number.slice(7) : number
  if (!(lessonNumbers as readonly unknown[]).includes(normalized)) throw new UnsupportedLessonError(value)
  return normalized as LessonNumber
}
export function requestedLesson(search: string): LessonNumber {
  const query = new URLSearchParams(search), state = query.get('liff.state')
  const nested = new URLSearchParams(state?.includes('?') ? state.slice(state.indexOf('?') + 1) : state ?? '')
  return lessonNumber(query.get('lesson') ?? nested.get('lesson'))
}
export const lessonId = (value: unknown): LessonId => `lesson-${lessonNumber(value)}`
