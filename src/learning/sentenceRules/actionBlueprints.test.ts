import {expect,it} from 'vitest'
import {activeActionBlueprints,potentialActionUses,type ActionBlueprint} from './actionBlueprints'
import {actionCapabilities,composeLessonAction} from './actionCapabilities'
import {actionDialogue,actionVocabulary} from './actionDialogue'
import {requestLesson} from '../lessonRegistry'
import {hierarchyState,wordHierarchies} from '../../race/wordHierarchy'
import {wordTokens} from '../wordProgress/model'
it('keeps the current action blueprints exactly direct-object and to-object',()=>{
 expect(activeActionBlueprints.map(frame=>frame.connection)).toEqual(['direct','to'])
 for(const number of [3,4,5]){
  const lesson={...requestLesson(number),pattern:'present-action' as const}
  const capability=actionCapabilities(lesson)
  for(const action of capability.actions){
   expect(action.complement).not.toBe('none')
   expect(action.preposition?.english===undefined||action.preposition.english==='to').toBe(true)
   expect(capability.objects(action.word).length).toBeGreaterThan(0)
  }
 }
})
it('matches walking and driving to the existing to slot and eligible destination nouns',()=>{
 const lesson=requestLesson(5),capability=actionCapabilities(lesson)
 for(const action of ['walking','driving']){
  expect(capability.actions.some(word=>word.word===action)).toBe(true)
  expect(capability.objects(action).every(object=>object.phrase.preposition?.english==='to'&&object.categories.includes('destination'))).toBe(true)
  expect(composeLessonAction(lesson,{subject:'I',action,object:'to the hotel',determiner:'the'}).answer.english).toBe(`I am ${action} to the hotel.`)
 }
})
it('stores sleeping potential uses without inserting in/on or using it in a to blueprint',()=>{
 const sleeping=actionVocabulary.find(word=>word.word==='sleeping')!
 expect(potentialActionUses(sleeping).to).toBeUndefined()
 expect(potentialActionUses(sleeping).in).toBeDefined()
 expect(potentialActionUses(sleeping).on).toBeDefined()
 expect(actionCapabilities(requestLesson(5)).actions.some(word=>word.word==='sleeping')).toBe(false)
 expect(()=>actionCapabilities({...requestLesson(5),actions:['sleeping']})).toThrow('blueprint')
 expect(hierarchyState(new Set()).verb.waiting).toContain('sleeping')
 expect(hierarchyState(new Set()).verb.current).not.toContain('sleeping')
})
it('activates sleeping only when an explicit compatible blueprint is supplied, with matching nouns',()=>{
 const future:ActionBlueprint={id:'future-in',connection:'in',nounCategories:['sleep-inside']}
 const lesson={...requestLesson(5),actionQuestion:undefined,actions:['sleeping'],actionBlueprints:[future]}
 const capability=actionCapabilities(lesson)
 expect(capability.objects('sleeping').map(item=>item.word)).toEqual(expect.arrayContaining(['in the hotel','in the bedroom']))
 expect(capability.objects('sleeping').some(item=>item.noun==='school')).toBe(false)
 expect(composeLessonAction(lesson,{subject:'I',action:'sleeping',object:'in the bedroom',determiner:'the'}).answer.english).toBe('I am sleeping in the bedroom.')
 const prefix=wordHierarchies.verb.slice(0,wordHierarchies.verb.indexOf('sleeping'))
 const learnt=new Set(prefix.flatMap(word=>wordTokens(word).map(token=>'en:'+token)))
 expect(hierarchyState(learnt).verb.current).not.toContain('sleeping')
 expect(hierarchyState(learnt,[...activeActionBlueprints,future]).verb.current).toContain('sleeping')
})

it('requires both blueprint noun categories and word-specific noun compatibility',()=>{
 const lesson={...requestLesson(5),actionQuestion:undefined,actions:['sleeping'],actionBlueprints:[{id:'in-wrong-noun-source',connection:'in' as const,nounCategories:['holdable' as const]}]}
 expect(()=>actionCapabilities(lesson)).toThrow('compatible lesson objects')
})

it('keeps the fixed to slot when switching noun references instead of silently changing the blueprint',()=>{
 const blueprint=activeActionBlueprints.find(frame=>frame.connection==='to')!,vocabulary=requestLesson(5).vocabulary
 const answer=actionDialogue('i','going',{blueprint,vocabulary,object:'to the hotel',objectReference:{mode:'pronoun',word:'it'}}).answer
 expect(answer.english).toBe('I am going to it.')
 expect(answer.units.find(unit=>unit.role==='preposition')?.english).toBe('to')
 expect(()=>actionDialogue('i','going',{blueprint,vocabulary,object:'to the hotel',objectReference:{mode:'pronoun',word:'there'}})).toThrow()
})

it('allows approaching a compatible Current person or object without opening unrelated movement uses',()=>{
 const vocabulary=requestLesson(4).vocabulary.concat(requestLesson(1).subjectNouns??[])
 const lesson={...requestLesson(5),vocabulary}
 const capability=actionCapabilities(lesson)
 expect(capability.objects('walking').some(object=>object.noun==='phone')).toBe(true)
 expect(capability.objects('walking').some(object=>object.noun==='woman')).toBe(true)
 expect(capability.objects('driving').some(object=>object.noun==='phone')).toBe(false)
 expect(composeLessonAction(lesson,{subject:'I',action:'walking',object:'to the woman',determiner:'the'}).answer.english).toBe('I am walking to the woman.')
 expect(capability.actions.some(action=>action.word==='sleeping')).toBe(false)
})
