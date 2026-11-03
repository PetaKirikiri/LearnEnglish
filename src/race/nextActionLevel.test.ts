import {describe,it,expect} from 'vitest'
import {actionPracticeQuestions,actionPracticeDeck} from './actionPracticeContent'
import {objectsForAction,actionDialogue} from '../learning/sentenceRules/actionDialogue'
import {lessonThreeMatrixCatalogue} from '../classroom/wordCatalogue'
const questions=actionPracticeQuestions.filter(q=>q.level===6)
describe('next action level',()=>{
 it('covers the six taught subjects and six possessive determiners',()=>{
  expect(new Set(questions.flatMap(q=>q.units.filter(u=>u.role==='person').map(u=>u.english.toLowerCase())))).toEqual(new Set(['i','you','he','she','they','we']))
  expect(new Set(questions.flatMap(q=>q.units.filter(u=>u.role==='determiner').map(u=>u.english)))).toEqual(new Set(['my','your','his','her','their','our']))
  for(const q of questions){expect(q.choices).toHaveLength(2);expect(new Set(q.choices).size).toBe(2);expect(q.choices[q.correct]).toBe(q.thai);expect(q.english).not.toMatch(/\bours\b/)}
 })
 it('restricts action objects by meaning',()=>{
  const nouns=(verb:string)=>objectsForAction(verb,lessonThreeMatrixCatalogue).map(x=>x.noun)
  expect(nouns('eating')).not.toContain('hotel');expect(nouns('drinking')).toEqual(['water'])
  expect(nouns('opening')).toContain('bag');expect(nouns('opening')).not.toContain('apple')
  expect(nouns('washing')).toContain('plate');expect(nouns('washing')).not.toContain('book')
  expect(()=>actionDialogue('i','washing',{vocabulary:lessonThreeMatrixCatalogue,object:'a book'})).toThrow()
 })
 it('teaches You are without changing it into I am',()=>{
  expect(questions.some(q=>q.english.startsWith('You are '))).toBe(true)
  expect(questions.filter(q=>q.english.startsWith('We ')).every(q=>q.english.startsWith('We are '))).toBe(true)
 })
 it('includes each action in a thirty question run',()=>{
  const deck=actionPracticeDeck(6);expect(deck).toHaveLength(30)
  expect(new Set(deck.flatMap(q=>q.units.filter(u=>u.role==='action').map(u=>u.english)))).toEqual(new Set(['eating','reading','drinking','holding','opening','washing']))
 })
})
