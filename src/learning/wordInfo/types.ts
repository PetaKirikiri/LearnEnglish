import { z } from 'zod'
const noun = z.object({ singular: z.string(), plural: z.string().nullable(), countability: z.enum(['countable','uncountable','both','plural-only']), note_th: z.string().optional() })
const verb = z.object({ base: z.string(), third: z.string(), past: z.string(), participle: z.string(), ing: z.string() })
const neighbour = z.object({ word: z.string(), count: z.number().int().positive() })
export const wordProfileSchema = z.object({
  usage_frames: z.array(z.object({word:z.string().min(1).optional(),before:z.array(z.string().min(1)).min(1),after:z.array(z.string().min(1)).min(1),source:z.literal('teaching')})).optional(),
  grammar_note_th: z.string().optional(),
  nouns: z.array(noun), verbs: z.array(verb),
  before: z.array(neighbour), after: z.array(neighbour),
  occurrences: z.number().int().nonnegative(), corpus_version: z.string(),
})
export type WordProfile = z.infer<typeof wordProfileSchema>
export type NounForms = z.infer<typeof noun>
export type VerbForms = z.infer<typeof verb>
