import {expect,it} from 'vitest'
import {existsSync} from 'node:fs'
import {actionPracticeQuestions} from './actionPracticeContent'
it('uses reviewed questions with exactly two distinct Thai translations',()=>{
 expect(actionPracticeQuestions.filter(q=>q.level===4&&q.id.startsWith('action-l4-')).map(q=>[q.english,q.thai])).toEqual([
 ['What are you doing?','คุณกำลังทำอะไร'],['What is he doing?','เขากำลังทำอะไร'],['What is she doing?','เธอกำลังทำอะไร'],['What are they doing?','พวกเขากำลังทำอะไร']])
 expect(actionPracticeQuestions.filter(q=>q.level===5&&q.id.startsWith('action-l5-'))).toHaveLength(32)
 for(const q of actionPracticeQuestions){expect(new Set(q.choices).size).toBe(2);expect(q.choices[q.correct]).toBe(q.thai);expect(q.units.map(u=>u.english).join(' ')).toBe(q.english);expect(existsSync('public'+q.audioUrl)).toBe(true);expect(q.english).not.toMatch(/eating.*hotel|sleeping (a|the)|doing it/)}
})
it('matches each subject with its verb and each action with a natural complement',()=>{
 const endings=['eating an apple.','drinking water.','sleeping.','running.','walking.','playing.','reading a book.','going to the hotel.']
 const thai=['กินแอปเปิลหนึ่งลูก','ดื่มน้ำ','นอน','วิ่ง','เดิน','เล่น','อ่านหนังสือหนึ่งเล่ม','ไปที่โรงแรม']
 for(const [subject,be,th] of [['I','am','ฉัน'],['He','is','เขา'],['She','is','เธอ'],['They','are','พวกเขา']])endings.forEach((ending,index)=>{
 const q=actionPracticeQuestions.find(q=>q.english===`${subject} ${be} ${ending}`)
 expect(q?.thai).toBe(`${th}กำลัง${thai[index]}`)
 })
})

it('covers cumulative compatible nouns, human subjects and determiners',async()=>{
 const {lessonThreeMatrixCatalogue}=await import('../classroom/wordCatalogue')
 const {actionVocabulary,objectsForAction,objectDeterminers}=await import('../learning/sentenceRules/actionDialogue')
 for(const level of [4,5]){
  const bank=actionPracticeQuestions.filter(q=>q.level===level)
  expect(bank.some(q=>q.english.includes('Bia'))).toBe(true)
  expect(bank.some(q=>q.units.some(u=>u.role==='person-determiner'))).toBe(true)
 }
 for(const action of actionVocabulary)for(const object of objectsForAction(action.word,lessonThreeMatrixCatalogue))for(const d of objectDeterminers(object)){
  expect(actionPracticeQuestions.some(q=>q.level===5&&q.units.some(u=>u.role==='action'&&u.english===action.word)&&q.units.some(u=>u.role==='object'&&u.english===object.noun+'.')&&q.units.some(u=>u.role==='determiner'&&u.english===d.word))).toBe(true)
 }
 for(const q of actionPracticeQuestions)expect(q.thai).not.toMatch(/[A-Za-z]/)
})
