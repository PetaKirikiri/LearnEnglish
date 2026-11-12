import './testing/forbidSentenceBanks'
import {expect,it} from 'vitest'
import {canonicalPracticeQuestion} from '../../server/practiceQuestionCatalogue'
import {canonicalBlueprintQuestion} from './blueprintWordServer'
import {nextPersonalQuestion} from './practiceForecast'
import {lessonPracticeTemplate} from './lessonPracticeTemplate'

it('reconstructs the same canonical sentence, correct answer and credit without a bank',()=>{
 for(let lesson=1;lesson<=6;lesson++)for(const useLesson of [true,false])for(let index=0;index<12;index++){
  const template=lessonPracticeTemplate(lesson),q=nextPersonalQuestion(useLesson?template.level:lesson as 1|2|3|4|5|6,[],[],'recipe',index,useLesson?template.options:{}),server=canonicalPracticeQuestion(q.id,q.recipe)
  expect(server?.id).toBe(q.id);expect(server?.document).toEqual(q.document);expect(server?.choices[server.correct]).toBe(q.choices[q.correct]);expect(server?.credit).toBe(q.credit)
 }
})
it('rejects a modified ID and ignores supplied answers and credit',()=>{
 const q=nextPersonalQuestion(5,[],[],'recipe',0)
 expect(canonicalPracticeQuestion(q.id+'-forged',q.recipe)).toBeUndefined()
 const recipe={...(q.recipe as object),answer:'anything',credit:'banana'}
 expect(canonicalBlueprintQuestion(recipe)?.credit).toBe(q.credit)
})
it.each([
 ['child driving',5,{type:'noun',word:'son'},{construction:'action-answer',person:'son',personOwner:'the',verb:'driving',connection:'to',noun:'hotel',owner:'the'},{construction:'action-answer',person:'man',personOwner:'the',verb:'driving',connection:'to',noun:'hotel',owner:'the'}],
 ['drinking phone',6,{type:'verb',word:'drinking'},{construction:'action-answer',person:'man',personOwner:'the',verb:'drinking',noun:'phone',owner:'the'},{construction:'action-answer',person:'man',personOwner:'the',verb:'holding',noun:'phone',owner:'the'}],
 ['invented preposition',6,{type:'verb',word:'holding'},{construction:'action-answer',person:'man',personOwner:'the',verb:'holding',connection:'on',noun:'phone',owner:'the'},{construction:'action-answer',person:'man',personOwner:'the',verb:'opening',connection:'on',noun:'phone',owner:'the'}],
 ['red man',1,{type:'adjective',word:'red'},{construction:'noun-phrase',noun:'man',owner:'the',description:'red'},{construction:'noun-phrase',noun:'man',owner:'the',description:'blue'}],
 ['singular these',1,{type:'determiner',word:'these'},{construction:'noun-phrase',noun:'man',owner:'these'},{construction:'noun-phrase',noun:'man',owner:'that'}],
])('rejects an invalid ingredient recipe: %s',(_name,level,anchor,a,b)=>{
 expect(canonicalBlueprintQuestion({version:1,level,anchor,a,b})).toBeUndefined()
})
it('rejects changing both the verb and its object',()=>{
 expect(canonicalBlueprintQuestion({version:1,level:6,anchor:{type:'verb',word:'drinking'},a:{construction:'action-answer',person:'man',personOwner:'the',verb:'drinking',noun:'water',owner:'the'},b:{construction:'action-answer',person:'man',personOwner:'the',verb:'holding',noun:'phone',owner:'the'}})).toBeUndefined()
})
