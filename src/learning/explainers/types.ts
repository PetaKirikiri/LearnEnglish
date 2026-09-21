import { z } from 'zod'
import type { QuizQuestion } from '../quizContent'
const thai = z.string().min(3).refine(value => /[ก-๙]/.test(value), 'Teaching text must contain Thai')
export const explainerSchema = z.object({
  question_id: z.string().min(1), content_key: z.string().min(1), pattern_key: z.string().min(1),
  title_th: thai, rule_th: thai, clue_th: thai, caution_th: thai.nullable(),
  contrasts: z.array(z.object({ label_th: thai, text: z.string().min(1), highlight: z.string().optional() })).min(2),
  examples: z.array(z.string().min(1)).min(2),
})
export type Explainer = z.infer<typeof explainerSchema>
export function explanationContentKey(q: QuizQuestion) {
  return JSON.stringify([q.mode, q.prompt, q.answer, q.example, q.grammarFocus ?? '', q.mode === 'sentences' ? [...q.choices].sort() : q.spokenText, ...(q.examCategory ? [q.passage ?? '', q.placeRelation ?? ''] : [])])
}
