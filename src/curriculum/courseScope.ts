import type { Curriculum } from './schema'

export type LearningCourse = 'english' | 'hotel'
export const courseNames: Record<LearningCourse, string> = { english: 'English Success', hotel: 'Hotel' }

// Situation metadata is authored in the language database. General exercises
// have a domain; the original professional Hotel catalogue does not.
export function scopeCurriculum(data: Curriculum, course: LearningCourse): Curriculum {
  const questions = data.questions.filter(q => Boolean(q.grammar.domain) === (course === 'english'))
  if (!questions.length) throw new Error(`No content available for ${courseNames[course]}`)
  const ids = new Set(questions.map(q => q.id))
  const groups = new Set(questions.map(q => q.skill))
  const courseSkills = data.courseSkills.filter(s => groups.has(s.skill))
  const nodes = new Set(courseSkills.map(s => s.nodeId))
  const wordLinks = data.wordLinks.filter(w => ids.has(w.questionId))
  const words = new Set(wordLinks.map(w => w.word))
  const wordsByQuestion = new Map<string, Set<string>>()
  for (const link of wordLinks) {
    const list = wordsByQuestion.get(link.questionId) ?? new Set<string>()
    list.add(link.word); wordsByQuestion.set(link.questionId, list)
  }
  const structures = data.structures.filter(s => nodes.has(s.nodeId)).map(s => {
    const questionIds = s.questionIds.filter(id => ids.has(id))
    const used = new Set(questionIds.flatMap(id => [...(wordsByQuestion.get(id) ?? [])]))
    return { ...s, questionIds, vocabulary: s.vocabulary.filter(word => used.has(word)) }
  })
  return {
    ...data, revision: `${data.revision}:${course}`, questions, courseSkills, wordLinks, structures,
    skills: data.skills.filter(s => nodes.has(s.id)).map(s => ({ ...s, prerequisites: s.prerequisites.filter(id => nodes.has(id)) })),
    vocabulary: data.vocabulary.filter(w => words.has(w.word)).map(w => {
      const used = structures.filter(s => s.vocabulary.includes(w.word))
        .sort((a,b) => data.skills.find(n => n.id === a.nodeId)!.order - data.skills.find(n => n.id === b.nodeId)!.order)
      return { ...w, firstNodeId: used[0].nodeId, structureIds: used.map(s => s.id) }
    }),
  }
}
