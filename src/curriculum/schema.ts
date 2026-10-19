import { z } from 'zod'

export const levels = ['A1', 'A2', 'B1', 'B2', 'C1'] as const
export type Level = typeof levels[number]
const id = z.string().regex(/^[a-z][a-z0-9_-]*$/)
const reference = z.object({ sourceId: id, locator: z.string().min(1), status: z.enum(['adapted', 'reference-only']) })
const segment = z.object({ text: z.string().min(1), skill: id })
export const curriculumQuestionSchema = z.object({
  id, english: z.string().min(1), skill: id, correct: z.union([z.literal(0), z.literal(1)]),
  audioUrl: z.string().regex(/^\/audio\/hotel\/hotel-g[23]-[a-z0-9_-]+\.wav$/),
  answers: z.tuple([z.array(segment).min(1), z.array(segment).min(1)]),
  grammar: z.object({
    kind: z.enum(['meaning', 'form']), context: z.string().min(1), phase: z.enum(['practice', 'transfer']),
    targets: z.array(z.string().min(1)), explanation: z.string().min(1), contrast: z.string().min(1),
    thai: z.string().optional(), prompt: z.string().optional(),
    domain: z.enum(['Home','Family','Food','Work','Study','Shopping','Travel','Leisure']).optional(),
    promptAudioUrl: z.string().regex(/^\/audio\/hotel\/hotel-g[23]-[a-z0-9_-]+-prompt\.wav$/).optional(),
  }),
}).superRefine((q, ctx) => {
  const a = q.answers.map(answer => answer.map(s => s.text).join(''))
  if (a[0] === a[1]) ctx.addIssue({code:'custom',message:'Identical answer alternatives'})
  if (q.answers.flat().some(s => s.skill !== q.skill)) ctx.addIssue({code:'custom',message:'Answer skill mismatch'})
  if (q.grammar.kind === 'form' && (!q.grammar.thai || !q.grammar.prompt?.includes('_____') || !q.grammar.promptAudioUrl))
    ctx.addIssue({code:'custom',message:'Form requires Thai meaning and a separate blank audio prompt'})
  if (q.grammar.kind === 'meaning' && a.some(text => !/[\u0E00-\u0E7F]/.test(text)))
    ctx.addIssue({code:'custom',message:'Meaning alternatives must include Thai'})
})

export const curriculumSchema = z.object({
  version: z.union([z.literal(1),z.literal(2)]), revision: z.string().min(1),
  structures: z.array(z.object({
    id, nodeId:id, frames:z.array(z.string().min(1)).min(1), focusWords:z.array(z.string().min(1)).min(1),
    questionIds:z.array(id).min(1), vocabulary:z.array(z.string().min(1)).min(1),
    coverage:z.literal('introductory'),
  })).default([]),
  vocabulary: z.array(z.object({
    word:z.string().min(1),thai:z.string().min(1),firstNodeId:id,structureIds:z.array(id).min(1),
    role:z.enum(['grammar','support']),
  })).default([]),
  sources: z.array(z.object({ id, title: z.string().min(1), url: z.string().url().startsWith('https://'), use: z.string().min(1) })).min(1),
  skills: z.array(z.object({
    id, level: z.enum(levels), order: z.number().int().nonnegative(), title: z.string().min(1),
    family: z.enum(['pronouns', 'verbs', 'determiners', 'relationships', 'interaction']),
    thaiBridge: z.string().min(1), prerequisites: z.array(id), references: z.array(reference).min(1),
  })).min(1),
  courseSkills: z.array(z.object({ course: z.literal('hotel'), skill: id, nodeId: id, order: z.number().int().nonnegative() })).min(1),
  questions: z.array(curriculumQuestionSchema).min(1),
  wordLinks: z.array(z.object({ questionId: id, word: z.string().min(1), role: z.enum(['target', 'context']) })),
}).superRefine((data, ctx) => {
  const fail = (message: string) => ctx.addIssue({code:'custom',message})
  for (const [name, rows] of [['sources', data.sources], ['skills', data.skills], ['questions', data.questions]] as const)
    if (new Set(rows.map(r => r.id)).size !== rows.length) fail(`Duplicate ${name}`)
  const nodes = new Map(data.skills.map(s => [s.id, s]))
  if (new Set(data.skills.map(s => s.order)).size !== data.skills.length) fail('Duplicate focus order')
  const sourceIds = new Set(data.sources.map(s => s.id))
  for (const s of data.skills) {
    if (s.references.some(r => !sourceIds.has(r.sourceId))) fail(`Unknown reference: ${s.id}`)
    if (s.prerequisites.some(p => !nodes.has(p) || nodes.get(p)!.order >= s.order)) fail(`Prerequisites must precede ${s.id}`)
  }
  const keys = data.courseSkills.map(s => `${s.course}:${s.skill}`)
  if (new Set(keys).size !== keys.length) fail('Duplicate course skill')
  if (new Set(data.courseSkills.map(s => s.order)).size !== data.courseSkills.length) fail('Duplicate course order')
  for (const s of data.courseSkills) {
    if (!nodes.has(s.nodeId)) fail(`Unknown curriculum node: ${s.nodeId}`)
    const group = data.questions.filter(q => q.skill === s.skill)
    const practice = group.filter(q => q.grammar.phase === 'practice')
    const transfer = group.filter(q => q.grammar.phase === 'transfer')
    if (practice.length < 2 || transfer.length < 2 || new Set(group.map(q=>q.grammar.context)).size < 4 || new Set(transfer.map(q=>q.grammar.context)).size < 2)
      fail(`Insufficient practice/transfer contexts: ${s.skill}`)
  }
  if (data.questions.some(q => !keys.includes(`hotel:${q.skill}`))) fail('Unmapped question')
  const questionIds = new Set(data.questions.map(q => q.id))
  const questionsById = new Map(data.questions.map(q=>[q.id,q]))
  const linkedWords = new Set(data.wordLinks.map(w=>`${w.questionId}:${w.word}`))
  if (data.wordLinks.some(w => !questionIds.has(w.questionId))) fail('Word link has no question')
  if(data.version===2) {
    const structureIds=new Set(data.structures.map(s=>s.id)), words=new Set(data.vocabulary.map(w=>w.word))
    if(structureIds.size!==data.structures.length || words.size!==data.vocabulary.length) fail('Duplicate structures or vocabulary')
    for(const node of data.skills) if(!data.structures.some(s=>s.nodeId===node.id)) fail(`Missing structures: ${node.id}`)
    for(const s of data.structures) {
      if(!nodes.has(s.nodeId)) fail('Unknown structure node')
      const groups=data.courseSkills.filter(m=>m.nodeId===s.nodeId).map(m=>m.skill)
      if(s.questionIds.some(id=>!groups.includes(questionsById.get(id)?.skill??''))) fail('Unrelated structure question')
      if(s.vocabulary.some(w=>!words.has(w))) fail('Missing vocabulary')
    }
    for(const w of data.vocabulary) {
      if(!nodes.has(w.firstNodeId)||w.structureIds.some(s=>!structureIds.has(s))) fail('Invalid vocabulary reference')
    }
    for(const q of data.questions) {
      if(!data.structures.some(s=>s.questionIds.includes(q.id))) fail('Question missing from structures')
      for(const word of new Set(q.english.toLowerCase().match(/[a-z]+(?:'[a-z]+)*/g)??[]))
        if(!words.has(word)||!linkedWords.has(`${q.id}:${word}`)) fail(`Missing word link: ${q.id}/${word}`)
    }
  }
})
export type Curriculum = z.infer<typeof curriculumSchema>
