// @vitest-environment happy-dom
import {expect,it} from 'vitest'
import {lessonPracticeTemplate} from './lessonPracticeTemplate'
import {determinerCandidates,practiceCandidates} from './generatedPracticeContent'
import {hierarchyState} from './wordHierarchy'
import {wordTokens} from '../learning/wordProgress/model'
const bank=(lesson:number)=>{const template=lessonPracticeTemplate(lesson);return practiceCandidates(template.level,template.options.structure,new Set(hierarchyState(new Set()).verb.allowed))}
it('assesses intransitive verbs through the existing general action answer, without changing the frame',()=>{
 const questions=bank(3)
 for(const word of ['talking','listening','walking']){
  const question=questions.find(q=>q.targetWords.includes(word))!
  expect(question,word).toBeDefined()
  expect(question.document.construction).toBe('action-answer')
  expect(question.document.units.map(unit=>unit.role)).toEqual(['person','be','action','preposition','determiner','object'])
  expect(question.document.units.find(unit=>unit.role==='preposition')?.english).toBe('to')
  expect(question.alternatives?.every(doc=>doc.units.map(unit=>unit.role).join(' ')==='person be action preposition determiner object')).toBe(true)
 }
})
it('tests the as an ownership/determiner contrast with the same sentence structure and noun',()=>{
 const q=bank(4).find(q=>q.targetWords.length===1&&q.targetWords[0]==='the')!
 expect(q).toBeDefined()
 expect(q.document.units.map(unit=>unit.role)).toEqual(q.alternatives![1].units.map(unit=>unit.role))
 expect(q.document.units.filter((unit,index)=>unit.english!==q.alternatives![1].units[index].english).map(unit=>unit.role)).toEqual(['determiner'])
})
it('credits the tested agreeing auxiliary with I, so hidden proof cannot stall on an uncredited am',()=>{
 const q=bank(3).find(q=>q.targetWords.includes('I')&&q.listeningWords.includes('am'))!
 expect(q).toBeDefined()
 expect(q.targetWords).toContain('am')
 expect(q.listeningWords.flatMap(wordTokens).every(token=>q.targetWords.flatMap(wordTokens).includes(token))).toBe(true)
})

it('tests a/an against an already-taught determiner without introducing some or a second noun form',()=>{
 for(const q of determinerCandidates().filter(q=>q.targetWords.some(word=>['a','an'].includes(word)))){
  expect(q.alternatives![1].units[0].english).toBe('the')
  expect(q.alternatives![1].units[1].english).toBe(q.document.units[1].english)
  expect(q.listeningWords).toEqual(q.targetWords)
 }
})

