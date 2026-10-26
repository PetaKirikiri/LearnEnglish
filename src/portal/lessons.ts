import { z } from 'zod'
import { supabase } from '../lib/supabase'
import type { HotelQuestion, Progress } from '../hotel/course'

export const lessonSchema = z.object({
  id: z.string().uuid(), number: z.number().int().min(1).max(999),
  title: z.string().trim().min(1).max(160), date: z.string().regex(/^$|^\d{4}-\d{2}-\d{2}$/),
  skills: z.array(z.string().min(1)), published: z.boolean(),
}).refine(row=>!row.published||row.skills.length>0,'Choose homework content before publishing')
export type ClassLesson = z.infer<typeof lessonSchema>
const previewKey = 'englishsuccess:my-learning:preview-lessons:v1'

export async function readLessons(preview: boolean): Promise<ClassLesson[]> {
  if (preview) return z.array(lessonSchema).parse(JSON.parse(localStorage.getItem(previewKey) ?? '[]'))
  const { data, error } = await supabase.from('englishsuccess_class_lessons').select('id,number,title,date,skills,published').order('number').abortSignal(AbortSignal.timeout(12000))
  if (error) throw new Error('Could not load lessons. Please retry.')
  return z.array(lessonSchema).parse(data)
}
export async function saveLesson(lesson: ClassLesson, preview: boolean) {
  const row = lessonSchema.parse(lesson)
  if (preview) {
    const rows = await readLessons(true)
    if(rows.some(item=>item.id!==row.id&&item.number===row.number)) throw new Error('That lesson number is already used.')
    localStorage.setItem(previewKey, JSON.stringify([...rows.filter(item => item.id !== row.id), row].sort((a,b) => a.number-b.number)))
    return
  }
  const { error } = await supabase.from('englishsuccess_class_lessons').upsert(row).abortSignal(AbortSignal.timeout(12000))
  if (error) throw new Error('Could not save lesson. Check access and retry.')
}
export function lessonQuestions(lesson: ClassLesson, questions: readonly HotelQuestion[]) {
  return questions.filter(q => lesson.skills.includes(q.skill))
}
// Keep the assignment inside its authored question bank. Repeated successful
// encounters, not a single lucky choice, precede review of the whole set.
export function homeworkQuestion(questions: readonly HotelQuestion[], progress: Progress, previous?: string) {
  if (!questions.length) throw new Error('No questions assigned')
  const eligible = questions.filter(q => q.id !== previous)
  const pool = eligible.length ? eligible : [...questions]
  const unfinished = pool.filter(q => (progress[q.skill]?.items?.[q.id]?.streak ?? 0) < 2)
  return [...(unfinished.length ? unfinished : pool)].sort((a,b) =>
    (progress[a.skill]?.items?.[a.id]?.attempts ?? 0) - (progress[b.skill]?.items?.[b.id]?.attempts ?? 0))[0]
}
