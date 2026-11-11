// @vitest-environment happy-dom
import {beforeEach,expect,it} from 'vitest'
import {lessonPracticeTemplate} from './lessonPracticeTemplate'
import {generatedDeck,availableVocabulary,sharedStarterVocabulary} from './generatedPracticeProgress'
import {structureCandidates} from './generatedPracticeContent'
import {forecastPractice,nextPersonalQuestion} from './practiceForecast'
beforeEach(()=>localStorage.clear())
it('every lesson specifies structure without owning questions, vocabulary or a deck',()=>{
 for(let lesson=1;lesson<=6;lesson++){
  const template=lessonPracticeTemplate(lesson)
  expect(Object.keys(template).sort()).toEqual(['label','level','options','scope'])
  const deck=generatedDeck(template.level,[],[],'same-account',template.options)
  expect(deck).toHaveLength(30)
  expect(deck.every(q=>q.document.english&&q.choices.length===2)).toBe(true)
 }
})
it('identification pictures use account vocabulary rather than the old object list',()=>{
 const options={...lessonPracticeTemplate(6).options,familiar:[...sharedStarterVocabulary]}
 const deck=generatedDeck(6,[],[],'account',options)
 expect(deck.every(q=>q.vocabulary.every(w=>availableVocabulary([],[]).has(w)))).toBe(true)
 expect(deck.some(q=>q.sceneChoices?.some(s=>s.word==='man'))).toBe(true)
 expect(deck.some(q=>q.sceneChoices?.some(s=>s.word==='apple'))).toBe(false)
 const withApple=generatedDeck(6,[],[],'account',{...options,familiar:['apple']})
 expect(withApple.every(q=>q.vocabulary[0]==='apple')).toBe(true)
})
it('identification alternatives preserve matching pictures when flipped and forecast follows live selection',()=>{
 const options={...lessonPracticeTemplate(6).options,familiar:[...sharedStarterVocabulary]}
 const q=nextPersonalQuestion(6,[],[],'run',0,options)
 for(const item of generatedDeck(6,[],[],'run',options))expect(item.sceneChoices?.[item.correct].reference).toBe(structureCandidates('identify').find(x=>x.id===item.id)?.sceneChoices?.[0].reference)
 expect(forecastPractice(6,[],[],'run',0,q,options)).toHaveLength(11)
})
