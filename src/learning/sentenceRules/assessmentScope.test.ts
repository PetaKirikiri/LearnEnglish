import {expect,it} from 'vitest'
import {hasUntaughtIt,taughtActionLine} from './assessmentScope'
import {actionDialogue} from './actionDialogue'
import {requestLesson} from '../lessonRegistry'
import {numberCatalogue} from '../../race/numberCatalogue'
import {actionPracticeQuestions} from '../../race/actionPracticeContent'
import {actionStarTiers} from '../../race/actionStarContent'

it.each(['it','IT?','its','Its book.','reading it.','it’s','it\'s','the book and its cover'])('rejects the untaught whole word in %s',english=>{
 expect(hasUntaughtIt(english)).toBe(true)
})
it.each(['tickets','visits','sitting','shirts','I am reading their book.'])('preserves taught words in %s',english=>{
 expect(hasUntaughtIt(english)).toBe(false)
})
it('rejects its inside any action slot, including bundled noun phrases',()=>{
 const units=actionDialogue('he','reading',{vocabulary:requestLesson(3).vocabulary,determiner:'the'}).answer.units
 expect(taughtActionLine(5,units)).toBe(true)
 for(const english of ['its','its book.','IT.']){
  expect(taughtActionLine(5,units.map(u=>u.role==='object'?{...u,english}:u))).toBe(false)
 }
 expect(taughtActionLine(5,units.map(u=>u.role==='determiner'?{...u,english:'its'}:u))).toBe(false)
})
it('keeps every first-six-level prompt and English distractor free of it and its',()=>{
 expect(numberCatalogue.length).toBeGreaterThan(0)
 for(const word of numberCatalogue){
  // Levels 1, 2 and 3 use this common noun inventory with fixed the/is/are.
  expect(word.word).not.toMatch(/\b(?:it|its)\b/i)
 }
 const questions=[...actionPracticeQuestions,...actionStarTiers.flatMap(t=>t.questions)]
 for(const q of questions){
  expect(q.english,q.id).not.toMatch(/\b(?:it|its)\b/i)
  expect(q.distractorUnits.map(u=>u.english).join(' '),q.id).not.toMatch(/\b(?:it|its)\b/i)
 }
})
