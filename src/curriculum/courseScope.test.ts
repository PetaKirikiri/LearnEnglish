// @vitest-environment happy-dom
import { afterEach, expect, it } from 'vitest'
import { scopeCurriculum } from './courseScope'
import { curriculumSchema } from './schema'
import snapshot from './syllabus.snapshot.json'
import { installCurriculum, selectLearningCourse, getCurriculum } from './database'
import { hotelQuestions, nextQuestion, recordAnswer, loadProgress, progressKey, grammarWordMemoryKey, legacyProgressKey, legacyWordMemoryKey, type Progress, requiresAudioCheck, isSkillReady } from '../hotel/course'
import { loadWordFamiliarity } from '../hotel/wordFamiliarity'
const data = curriculumSchema.parse(snapshot)
afterEach(() => { installCurriculum(data); localStorage.clear() })

it('partitions every question exactly once and scopes content, structures and vocabulary together', () => {
  const english = scopeCurriculum(data, 'english'), hotel = scopeCurriculum(data, 'hotel')
  expect(english.questions).toHaveLength(2336)
  expect(hotel.questions).toHaveLength(294)
  expect(new Set([...english.questions,...hotel.questions].map(q=>q.id)).size).toBe(data.questions.length)
  for (const course of [english,hotel]) {
    const ids = new Set(course.questions.map(q=>q.id))
    expect(course.structures.flatMap(s=>s.questionIds).every(id=>ids.has(id))).toBe(true)
    expect(course.wordLinks.every(link=>ids.has(link.questionId))).toBe(true)
    expect(course.vocabulary.every(w=>course.wordLinks.some(link=>link.word===w.word))).toBe(true)
    expect(course.questions.every(q=>Boolean(q.grammar.domain)===(course===english))).toBe(true)
    expect(course.questions.every(q=>q.id.startsWith('hotel-g3-general-')===(course===english))).toBe(true)
  }
})

it('moves only matching legacy question evidence into each independent course save, never overwriting the legacy backup', () => {
  installCurriculum(data)
  const general = data.questions.find(q=>q.grammar.domain)!, hotel = data.questions.find(q=>!q.grammar.domain)!
  const legacy = recordAnswer(recordAnswer({},general,true,false,1000),hotel,true,false,1000)
  const backup = JSON.stringify(legacy)
  localStorage.setItem(legacyProgressKey('learner'),backup)
  localStorage.setItem(legacyWordMemoryKey('learner'),JSON.stringify({she:{seen:4,strength:4}}))
  for (const course of ['hotel','english'] as const) {
    selectLearningCourse(course)
    const loaded = loadProgress('learner'), target = course === 'english' ? general : hotel
    const other = course === 'english' ? hotel : general
    expect(loaded[target.skill].items?.[target.id].attempts).toBe(1)
    expect(loaded[other.skill]?.items?.[other.id]).toBeUndefined()
    expect(loadWordFamiliarity('learner',grammarWordMemoryKey('learner'),legacyWordMemoryKey('learner')).she.strength).toBe(4)
    localStorage.setItem(progressKey('learner'),JSON.stringify(recordAnswer(loaded,target,true,false,2000)))
    expect(localStorage.getItem(legacyProgressKey('learner'))).toBe(backup)
  }
  selectLearningCourse('english'); expect(loadProgress('learner')[general.skill].items?.[general.id].attempts).toBe(2)
  selectLearningCourse('hotel'); expect(loadProgress('learner')[hotel.skill].items?.[hotel.id].attempts).toBe(2)
  expect(loadProgress('different-account')).toEqual({})
})

it('only practices the chosen course and can reach all its questions with recurring review', () => {
  installCurriculum(data)
  for (const course of ['hotel','english'] as const) {
    selectLearningCourse(course)
    const allowed = new Set(getCurriculum()!.questions.map(q=>q.id)), seen = new Set<string>()
    let progress:Progress = {}, previous:string|undefined
    for (let round=0;round<18000 && seen.size<allowed.size;round++) {
      const q = nextQuestion(progress,previous,round,()=>0,1000)
      expect(q).toBeDefined()
      expect(allowed.has(q.id)).toBe(true)
      const catalogue=getCurriculum()!
      const node=catalogue.skills.find(n=>n.id===catalogue.courseSkills.find(s=>s.skill===q.skill)!.nodeId)!
      for(const parent of catalogue.courseSkills.filter(s=>node.prerequisites.includes(s.nodeId)))
        expect(isSkillReady(progress,parent.skill),`${course}: ${q.skill} before ${parent.skill}`).toBe(true)
      seen.add(q.id); previous=q.id
      progress=recordAnswer(progress,q,true,false,1000,requiresAudioCheck(progress,q))
    }
    expect(seen.size).toBe(allowed.size)
    expect(hotelQuestions.length).toBe(allowed.size)
  }
},30000)
