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
  const scopedSkills = data.skills.filter(s=>nodes.has(s.id)).map(({englishOrder,englishPrerequisites,englishLevel,englishReferences,...s})=>({...s,
    level:course==='english' ? englishLevel??s.level : s.level,
    references:course==='english' ? englishReferences??s.references : s.references,
    order:course==='english' ? englishOrder??s.order : s.order,
    prerequisites:(course==='english' ? englishPrerequisites??s.prerequisites : s.prerequisites).filter(id=>nodes.has(id)),
  })).sort((a,b)=>a.order-b.order)
  if(course==='english') courseSkills.sort((a,b)=>scopedSkills.find(s=>s.id===a.nodeId)!.order-scopedSkills.find(s=>s.id===b.nodeId)!.order)
  const scopedCourseSkills=courseSkills.map((s,order)=>({...s,order}))
  if(course==='english') {
    const order=new Map(scopedCourseSkills.map(s=>[s.skill,s.order]))
    questions.sort((a,b)=>order.get(a.skill)!-order.get(b.skill)! || (a.grammar.sequenceTier??1)-(b.grammar.sequenceTier??1))
  }
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
    return { ...s, frames:course==='english' ? s.englishFrames??s.frames : s.frames, questionIds, vocabulary: s.vocabulary.filter(word => used.has(word)) }
  })
  return {
    ...data, revision: `${data.revision}:${course}`, questions, courseSkills:scopedCourseSkills, wordLinks, structures,
    skills: scopedSkills,
    vocabulary: data.vocabulary.filter(w => words.has(w.word)).map(w => {
      const used = structures.filter(s => s.vocabulary.includes(w.word))
        .sort((a,b) => scopedSkills.find(n => n.id === a.nodeId)!.order - scopedSkills.find(n => n.id === b.nodeId)!.order)
      return { ...w, firstNodeId: used[0].nodeId, structureIds: used.map(s => s.id) }
    }),
  }
}
