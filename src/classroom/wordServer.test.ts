import {expect,it} from 'vitest'
import {classroomWordQuestion} from './wordServer'
import {nextPersonalQuestion} from '../race/practiceForecast'
import {lessonPracticeTemplate} from '../race/lessonPracticeTemplate'
import {wordHierarchies,rankWordChoices,hierarchyCompatible,hierarchyState} from '../race/wordHierarchy'
import {masteredWords} from '../race/generatedPracticeProgress'
import type {WordProgress} from '../learning/wordProgress/model'
const learnt=(word:string):WordProgress=>({word_id:'en:'+word,correct:28,attempts:28,listening_correct:3,direct_correct:0,last_practised:'2026-11-01T00:00:00Z',recent_results:[true],fade_score:25,confirmation_count:3,proven_at:'2026-11-01T00:00:00Z',review_due_at:'2040-01-01T00:00:00Z',learning_version:1})
it('uses the exact individual-practice selector for every classroom lesson',()=>{
 for(let lesson=1;lesson<=6;lesson++){
  const template=lessonPracticeTemplate(lesson)
  const actual=classroomWordQuestion(lesson,'new-student',[],[],0,'class-turn')
  expect(actual.question).toEqual(nextPersonalQuestion(template.level,[],[],'new-student:class-turn',0,template.options))
  expect(hierarchyCompatible(actual.question,hierarchyState(new Set()))).toBe(true)
 }
},30000)
it('reads each learner’s progression afresh when switching activities and lessons',()=>{
 const rows=wordHierarchies.noun.slice(0,12).map(learnt)
 for(const lesson of [1,3,6]){
  const fresh=classroomWordQuestion(lesson,'new',[],[],0,'turn').question
  const advanced=classroomWordQuestion(lesson,'experienced',rows,[],0,'turn').question
  expect(hierarchyCompatible(advanced,hierarchyState(masteredWords(rows,[])))).toBe(true)
  expect(advanced.targetWords).not.toEqual(fresh.targetWords)
 }
})
it('never credits later deictic determiners just because their picture is available',()=>{
 for(let turn=0;turn<12;turn++){
  const q=classroomWordQuestion(6,'new',[],[],turn,'turn').question
  expect(q.targetWords.some(word=>['this','that','these','those','some'].includes(word))).toBe(false)
 }
})
it('orders the complete teacher selector without applying student limits',()=>{
 const choices=[...wordHierarchies.noun].reverse().map(word=>({word}))
 expect(rankWordChoices(choices).map(choice=>choice.word)).toEqual(wordHierarchies.noun)
 expect(rankWordChoices(choices)).toHaveLength(choices.length)
 expect(choices[0].word).toBe(wordHierarchies.noun.at(-1))
})

it('keeps every authored noun available on teacher whiteboards regardless of lesson',async()=>{
 const {whiteboardWords}=await import('./whiteboardWords')
 const {requestLesson}=await import('../learning/lessonRegistry')
 for(let lesson=1;lesson<=6;lesson++){
  const original=requestLesson(lesson),board=whiteboardWords(original)
  expect(wordHierarchies.noun.every(word=>board.vocabulary.some(item=>item.word===word))).toBe(true)
  expect(board.pattern).toBe(original.pattern)
  expect(board.actionGroup).toBe(original.actionGroup)
  expect(board.actionQuestion).toBe(original.actionQuestion)
  expect(board.owners).toContain('some')
 }
})
