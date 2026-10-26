import {expect,it} from 'vitest'
import {introductionQuestions,introductionNodes} from './introductions'
import {scopeCurriculum} from './courseScope'
import {curriculumSchema} from './schema'
import snapshot from './syllabus.snapshot.json'

it('keeps content words identical in both choices, with fresh transfer contexts',()=>{
  const questions=introductionQuestions()
  const focus=new Set(introductionNodes.flatMap(n=>n.focus))
  const lexical=(text:string)=>(text.toLowerCase().match(/[a-z]+(?:'[a-z]+)*/g)??[]).filter(w=>!focus.has(w)&&!['is','are'].includes(w))
  expect(questions).toHaveLength(64)
  const practice=new Set(questions.filter(q=>q.grammar!.phase==='practice').map(q=>q.english))
  for(const q of questions){
    expect(lexical(q.english),q.id).toEqual(lexical(q.grammar!.contrast))
    expect(q.answers[0]).not.toEqual(q.answers[1])
    if(q.grammar!.phase==='transfer')expect(practice.has(q.english),q.id).toBe(false)
  }
})

it('uses the same opening topics in structures, vocabulary, assignments and practice',()=>{
  const data=scopeCurriculum(curriculumSchema.parse(snapshot),'english')
  expect(data.skills.slice(0,4).map(n=>n.id)).toEqual(introductionNodes.map(n=>n.id))
  expect(data.courseSkills.slice(0,4).map(n=>n.skill)).toEqual(introductionNodes.map(n=>n.skill))
  for(const node of introductionNodes){
    const structure=data.structures.find(s=>s.nodeId===node.id)!
    expect(structure.frames).toEqual(node.frames)
    expect(structure.questionIds).toHaveLength(16)
  }
  expect(data.vocabulary.find(w=>w.word==='name')!.firstNodeId).toBe('meeting-names')
  expect(data.skills.find(n=>n.id==='first-actions')!.prerequisites).toEqual(['meeting-people','meeting-belongings'])
})
