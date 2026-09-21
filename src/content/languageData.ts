import { z } from 'zod'
import { thaiTranslations as bundledGlosses } from './thaiTranslations.generated'
import { lessonThaiTranslations as bundledLessonGlosses } from './lessonThaiTranslations'

// Bundled values are authoring/test fixtures. The app's LanguageGate replaces
// both maps with a validated database snapshot before mounting any lessons.
export const thaiTranslations: Record<string, string> = { ...bundledGlosses }
export const lessonThaiTranslations: Record<string, string> = { ...bundledLessonGlosses }

const wordSchema = z.object({
  word: z.string().trim().min(1).max(100),
  thai_gloss: z.string().min(1).nullable(),
  lesson_thai_gloss: z.string().min(1).nullable(),
  corpus_count: z.number().int().nonnegative(),
  corpus_rank: z.number().int().positive().nullable(),
})
export const languageSnapshotSchema = z.object({
  version: z.literal(1),
  words: z.array(wordSchema).min(1),
}).superRefine(({ words }, ctx) => {
  if (new Set(words.map(w => w.word)).size !== words.length) ctx.addIssue({ code: 'custom', message: 'Duplicate language word' })
  // Removing a reviewed lesson meaning would silently remove a question.
  for (const word of Object.keys(bundledLessonGlosses)) {
    if (!words.some(w => w.word === word && w.lesson_thai_gloss)) ctx.addIssue({ code: 'custom', message: `Missing lesson meaning: ${word}` })
  }
})
export type LanguageSnapshot = z.infer<typeof languageSnapshotSchema>

export function installLanguageSnapshot(input: unknown) {
  const snapshot = languageSnapshotSchema.parse(input)
  for (const word of Object.keys(thaiTranslations)) delete thaiTranslations[word]
  for (const word of Object.keys(lessonThaiTranslations)) delete lessonThaiTranslations[word]
  for (const row of snapshot.words) {
    if (row.thai_gloss) Object.defineProperty(thaiTranslations, row.word, { value: row.thai_gloss, enumerable: true, configurable: true, writable: true })
    if (row.lesson_thai_gloss) Object.defineProperty(lessonThaiTranslations, row.word, { value: row.lesson_thai_gloss, enumerable: true, configurable: true, writable: true })
  }
  return snapshot
}
