import {expect,it} from 'vitest'
import {classroomWordQuestion} from './wordServer'
import {wordHierarchies,rankWordChoices} from '../race/wordHierarchy'
import type {WordProgress} from '../learning/wordProgress/model'
const learnt=(word:string):WordProgress=>({word_id:'en:'+word,correct:28,attempts:28,listening_correct:3,direct_correct:0,last_practised:'2026-11-01T00:00:00Z',recent_results:[true],fade_score:25,confirmation_count:3,proven_at:'2026-11-01T00:00:00Z',review_due_at:'2040-01-01T00:00:00Z',learning_version:1})
const sharedRows=['the','phone','phones','bag','bags','man','men','woman','women','is','are','my','your','eating','drinking','water','apple','apples','big','small'].map(learnt)
it('keeps full Class 7 sentences while contrasting only content words familiar to all three players',()=>{
 const players=[sharedRows,sharedRows,sharedRows]
 for(let turn=0;turn<30;turn++){
  const q=classroomWordQuestion(7,'student',sharedRows,[],turn,'class-turn',players).question
  expect(q.document.construction).toBe('identification-answer');expect(q.document.english).toMatch(/^These are the /)
  expect(q.targetWords.every(word=>!['the','my','your','some','these','is','are'].includes(word))).toBe(true)
  for(const doc of q.alternatives??[])for(const unit of doc.units.filter(u=>u.role==='object'))expect(sharedRows.some(row=>row.word_id==='en:'+unit.english.replace(/[.?!]$/,''))).toBe(true)
 }
})
it('blocks empty or non-overlapping histories instead of introducing unknown words',()=>{
 expect(()=>classroomWordQuestion(7,'new',[],[],0,'turn',[[],sharedRows])).toThrow(/shared familiar content/)
 expect(()=>classroomWordQuestion(7,'one',sharedRows,[],0,'turn',[sharedRows,['the','book','books','cup','cups'].map(learnt)])).toThrow(/shared familiar content/)
})
it('never uses determiner differences as the tested contrast, even after determiners have been seen',()=>{
 for(let turn=0;turn<12;turn++){
  const q=classroomWordQuestion(6,'student',sharedRows,[],turn,'turn',[sharedRows]).question
  expect(q.targetWords.some(word=>['this','that','these','those','some','the','my'].includes(word))).toBe(false)
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
