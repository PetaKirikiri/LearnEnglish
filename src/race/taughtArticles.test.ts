import {expect,it} from 'vitest'
import {readFileSync} from 'node:fs'
import {actionPracticeDeck,actionPracticeQuestions,pictureActionPracticeQuestions} from './actionPracticeContent'
import {lessonPracticeQuestions} from './lessonPractice'
import {journeyBriefings} from './journeyBriefings'
import {requestLesson} from '../learning/lessonRegistry'
import {taughtActionLine} from '../learning/sentenceRules/assessmentScope'
import {actionDialogue} from '../learning/sentenceRules/actionDialogue'

it('excludes untaught articles from prompts, picture alternatives, examples and lesson practice',()=>{
 for(const q of [...actionPracticeQuestions,...pictureActionPracticeQuestions]){
  for(const units of [q.units,q.distractorUnits]){
   expect(units.map(u=>u.english).join(' '),q.id).not.toMatch(/\b(a|an)\b/i)
   expect(taughtActionLine(q.level,units),q.id).toBe(true)
  }
 }
 for(const level of [4,5,6] as const)expect(actionPracticeDeck(level)).toHaveLength(30)
 for(const briefing of journeyBriefings)for(const example of briefing.examples)expect(example.document.english).not.toMatch(/\b(a|an)\b/i)
 for(let lesson=1;lesson<=5;lesson++)for(const q of lessonPracticeQuestions(lesson)){
  expect(q.english,q.id).not.toMatch(/\b(a|an)\b/i)
  expect(q.distractorDocument?.english??'',q.id).not.toMatch(/\b(a|an)\b/i)
 }
 expect(requestLesson(3).owners).not.toContain('a')
 expect(requestLesson(3).owners).not.toContain('an')
})
it('rejects a and an while allowing the already-taught determiner',()=>{
 const vocabulary=requestLesson(3).vocabulary
 for(const verb of ['reading','eating']){
  expect(taughtActionLine(5,actionDialogue('he',verb,{vocabulary}).answer.units)).toBe(false)
  expect(taughtActionLine(5,actionDialogue('he',verb,{vocabulary,determiner:'the'}).answer.units)).toBe(true)
 }
})
it('keeps retained picture questions identical to their registered scoring versions',()=>{
 const sql=readFileSync('supabase/migrations/20261110000100_picture_practice_contrasts.sql','utf8')
 const quote=(s:string)=>`'${s.replaceAll("'","''")}'`
 for(const q of pictureActionPracticeQuestions.filter(q=>q.questionVersion===2)){
  expect(sql,q.id).toContain(`(${quote(q.id)},2,${quote(q.english)},array[${q.choices.map(quote).join(',')}],${quote(q.thai)},${quote(q.english)})`)
 }
})
