// @vitest-environment happy-dom
import { afterEach, expect, it } from 'vitest'
import { beginnerQuestions } from './beginnerContent'
import snapshot from './syllabus.snapshot.json'
import { curriculumSchema } from './schema'
import { installCurriculum, selectLearningCourse, getCurriculum } from './database'
import { scopeCurriculum } from './courseScope'
import { nextQuestion, recordAnswer, requiresAudioCheck, isSkillReady, type Progress } from '../hotel/course'
const data=curriculumSchema.parse(snapshot)
afterEach(()=>installCurriculum(data))

it('starts English with names and origins before actions or object-pronoun drills',()=>{
  installCurriculum(data); selectLearningCourse('english')
  expect(getCurriculum()!.courseSkills.slice(0,4).map(s=>s.skill)).toEqual(['meeting_names','meeting_origins','meeting_people','meeting_belongings'])
  expect(getCurriculum()!.questions[0].english).toBe('My name is Nam.')
  let progress:Progress={}, previous:string|undefined
  const groups=new Set<string>()
  for(let n=0;n<80;n++) {
    const q=nextQuestion(progress,previous,n,()=>0,1000)
    groups.add(q.skill)
    expect(['meeting_names','meeting_origins']).toContain(q.skill)
    expect(q.id).toContain('general-introduction-')
    expect(q.english).not.toMatch(/call|help/i)
    progress=recordAnswer(progress,q,true,true,1000)
    previous=q.id
  }
  expect(groups.size).toBe(2)
})

it('keeps vocabulary stable within each beginner pair and holds out new transfer combinations',()=>{
  const grammar=new Set(['i','you','he','she','we','they','am','is','are','not','do','does','will'])
  const lemmas:Record<string,string>={eats:'eat',ate:'eat',eating:'eat',drinks:'drink',drank:'drink',drinking:'drink',talks:'talk',talked:'talk',talking:'talk',goes:'go',went:'go',going:'go',wants:'want',has:'have'}
  const lexical=(s:string)=>(s.toLowerCase().match(/[a-z]+/g)??[]).filter(w=>!grammar.has(w)).map(w=>lemmas[w]??w)
  const practice=new Set(data.questions.filter(q=>q.grammar.phase==='practice').map(q=>q.english))
  const questions=beginnerQuestions()
  expect(questions).toHaveLength(76)
  for(const q of questions){
    expect(lexical(q.english),q.id).toEqual(lexical(q.grammar!.contrast))
    if(q.grammar!.phase==='transfer') expect(practice.has(q.english),q.id).toBe(false)
  }
})

it('prioritizes familiar verbs in later tense sections while retaining earlier review',()=>{
  installCurriculum(data);selectLearningCourse('english')
  let progress:Progress={},previous:string|undefined, reviews=0
  const firstBySkill=new Map<string,string>()
  for(let n=0;n<12000 && !firstBySkill.has('future_ongoing');n++){
    const q=nextQuestion(progress,previous,n,()=>0,1000)
    if(!firstBySkill.has(q.skill)) firstBySkill.set(q.skill,q.id)
    if(isSkillReady(progress,q.skill) && q.skill.startsWith('first_')) reviews++
    progress=recordAnswer(progress,q,true,false,1000,requiresAudioCheck(progress,q));previous=q.id
  }
  for(const skill of ['habit_ongoing','route_past_events','future_ongoing']) expect(firstBySkill.get(skill),skill).toContain('general-beginner-basic-')
  expect(reviews).toBeGreaterThan(0)
})

it('keeps Hotel out of the new route and maintains valid prerequisites in both courses',()=>{
  const hotel=scopeCurriculum(data,'hotel')
  expect(hotel.questions).toHaveLength(294)
  expect(hotel.courseSkills[0].skill).toBe('roles')
  expect(hotel.skills.some(s=>s.id.startsWith('first-'))).toBe(false)
  for(const course of ['english','hotel'] as const) {
    const scoped=scopeCurriculum(data,course)
    for(const node of scoped.skills) for(const parent of node.prerequisites) {
      expect(scoped.skills.find(s=>s.id===parent)!.order).toBeLessThan(node.order)
    }
  }
})
