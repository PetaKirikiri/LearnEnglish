// @vitest-environment happy-dom
import {expect,it} from 'vitest'
import {verbGroupFor,verbsForGroup} from '../learning/sentenceRules/verbGroups'
import {hierarchyState,hierarchyCompatible} from './wordHierarchy'
import {generatedCandidates,structureCandidates} from './generatedPracticeContent'
import {actionCapabilities} from '../learning/sentenceRules/actionCapabilities'
import {lessonRegistry} from '../learning/lessonRegistry'
it('keeps three Current verbs per frame group and replaces each independently',()=>{
 const start=hierarchyState(new Set()).verb
 expect(start.verbGroups?.transitive).toEqual({current:['holding','opening','using'],next:'eating'})
 expect(start.verbGroups?.intransitive).toEqual({current:['talking','listening','walking'],next:'running'})
 const learnt=hierarchyState(new Set(['en:opening','en:listening'])).verb
 expect(learnt.verbGroups?.transitive.current).toEqual(['holding','using','eating'])
 expect(learnt.verbGroups?.intransitive.current).toEqual(['talking','walking','running'])
 expect(hierarchyState(new Set(['en:drinking'])).verb.verbGroups?.intransitive).toEqual(start.verbGroups?.intransitive)
})
it('uses reviewed object frames rather than guessing from preposition spelling',()=>{
 expect(verbGroupFor('reading')).toBe('transitive')
 expect(verbGroupFor('sleeping')).toBe('intransitive')
 expect(verbGroupFor('going')).toBe('intransitive')
 const transitive=generatedCandidates(6).filter(q=>verbsForGroup('transitive').some(a=>a.word===q.action))
 expect(transitive.length).toBeGreaterThan(0)
 expect(transitive.every(q=>q.document.units.some(u=>u.role==='object')&&!q.document.units.some(u=>u.role==='preposition'))).toBe(true)
 for(const q of structureCandidates('destination')){
  expect(verbGroupFor(q.action)).toBe('intransitive')
  expect(q.document.units.some(u=>u.role==='preposition'&&u.english==='to')).toBe(true)
 }
 const state=hierarchyState(new Set())
 expect(structureCandidates('destination').filter(q=>hierarchyCompatible(q,state)).every(q=>q.action==='walking')).toBe(true)
},15000)
it('blueprints request their verbs from the matching shared group',()=>{
 expect(actionCapabilities(lessonRegistry['lesson-4']).actions.every(action=>verbGroupFor(action.word)==='transitive')).toBe(true)
 expect(actionCapabilities(lessonRegistry['lesson-5']).actions.every(action=>verbGroupFor(action.word)==='intransitive')).toBe(true)
})
