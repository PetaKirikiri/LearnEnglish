import {expect,it} from 'vitest'
import {existsSync,readFileSync} from 'node:fs'
import {actionPracticeQuestions} from './actionPracticeContent'
it('uses reviewed questions with exactly two distinct Thai translations',()=>{
 expect(actionPracticeQuestions.filter(q=>q.level===4&&q.id.startsWith('action-l4-')).map(q=>[q.english,q.thai])).toEqual([
 ['What are you doing?','คุณกำลังทำอะไร'],['What is he doing?','เขากำลังทำอะไร'],['What is she doing?','เธอกำลังทำอะไร'],['What are they doing?','พวกเขากำลังทำอะไร']])
 expect(actionPracticeQuestions.filter(q=>q.level===5).length).toBeGreaterThanOrEqual(30)
 for(const q of actionPracticeQuestions){expect(new Set(q.choices).size).toBe(2);expect(q.choices[q.correct]).toBe(q.thai);expect(q.units.map(u=>u.english).join(' ')).toBe(q.english);expect(existsSync('public'+q.audioUrl)).toBe(true);expect(q.english).not.toMatch(/eating.*hotel|sleeping (a|the)|doing it/)}
})
it('matches each subject with its verb and each action with a natural complement',()=>{
 const endings=['eating an apple.','drinking water.','sleeping.','running.','walking.','playing.','reading a book.']
 const thai=['กินแอปเปิลหนึ่งลูก','ดื่มน้ำ','นอน','วิ่ง','เดิน','เล่น','อ่านหนังสือหนึ่งเล่ม']
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
 for(const action of actionVocabulary.filter(a=>!a.level && a.complement==='object'))for(const object of objectsForAction(action.word,lessonThreeMatrixCatalogue))for(const d of objectDeterminers(object)){
  const examples=actionPracticeQuestions.filter(q=>q.level===5&&q.units.some(u=>u.role==='action'&&u.english===action.word))
  expect(examples.some(q=>q.units.some(u=>u.role==='object'&&u.english===object.noun+'.'))).toBe(true)
  expect(examples.some(q=>q.units.some(u=>u.role==='determiner'&&u.english===d.word))).toBe(true)
 }
 for(const q of actionPracticeQuestions)expect(q.thai).not.toMatch(/[A-Za-z]/)
})

it('admits only taught prompts and distractors to the practice, race and live-class catalogues',async()=>{
 const {racePools}=await import('./pools')
 const {subjectPronouns}=await import('../learning/sentenceMatrix/subjectEngine')
 expect(subjectPronouns.map(p=>p.word)).toContain('it')
 for(const q of actionPracticeQuestions){
  for(const line of [q.units,q.distractorUnits])expect(line.map(u=>u.english).join(' ')).not.toMatch(/\b(it|its|to)\b/i)
  for(const choice of q.choices)expect(choice).not.toMatch(/มัน|กำลังไปที่/)
 }
 for(const pool of racePools.filter(p=>p.id.startsWith('lesson-three')||p.id.startsWith('lesson-four')||p.id.startsWith('classroom-action'))){
  for(const q of pool.questions){
   expect(q.english).not.toMatch(/\b(it|its|to)\b/i)
   for(const choice of q.answers)expect(choice.map(part=>part.text).join(' ')).not.toMatch(/มัน|กำลังไปที่/)
  }
 }
 const sql=readFileSync('supabase/migrations/20261106000300_taught_classroom_questions.sql','utf8')
 const ids=[...sql.matchAll(/^\('(action-[^']+)',/gm)].map(match=>match[1])
 expect(ids.sort()).toEqual(actionPracticeQuestions.map(q=>q.id).sort())
})

it('requires taught grammar in every slot even when a future form is valid English',async()=>{
 const {taughtActionLine}=await import('../learning/sentenceRules/assessmentScope')
 const {actionDialogue}=await import('../learning/sentenceRules/actionDialogue')
 const {lessonThreeMatrixCatalogue:vocabulary}=await import('../classroom/wordCatalogue')
 const line=actionDialogue('he','reading',{vocabulary}).answer.units
 expect(taughtActionLine(5,line)).toBe(true)
 expect(taughtActionLine(5,line.map(unit=>unit.role==='be'?{...unit,english:'was'}:unit))).toBe(false)
 expect(taughtActionLine(5,line.filter(unit=>unit.role!=='determiner').map(unit=>unit.role==='object'?{...unit,english:'it.'}:unit))).toBe(false)
 expect(taughtActionLine(5,actionDialogue('he','going',{vocabulary}).answer.units)).toBe(false)
 expect(taughtActionLine(4,actionDialogue('it','reading',{vocabulary}).question.units)).toBe(false)
})
