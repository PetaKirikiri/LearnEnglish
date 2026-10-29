// @vitest-environment happy-dom
import {expect,it} from 'vitest'
import {practiceModules,modulePassed} from './practiceModules'
import {practiceDeck} from './practiceDeck'
it('puts every prompt into one bounded module with a reading and listening encounter',()=>{
 for(const lesson of [1,2]){
  const modules=practiceModules(lesson),ids=modules.flatMap(module=>module.questionIds)
  expect(new Set(ids).size).toBe(ids.length)
  expect(new Set(ids)).toEqual(new Set(practiceDeck(lesson).map(q=>q.id)))
  for(const module of modules){
   const deck=practiceDeck(lesson,module.questionIds)
   expect(deck.length).toBeGreaterThan(0);expect(deck.length).toBeLessThanOrEqual(8)
   expect(deck.filter(q=>q.audioOnly)).toHaveLength(module.questionIds.length)
   expect(deck.filter(q=>!q.audioOnly)).toHaveLength(module.questionIds.length)
   expect(deck.every(q=>q.english.startsWith(module.title.replace('…?','')))).toBe(true)
  }
 }
})
it('requires repeated success rather than marking an unsuccessful round complete',()=>{
 expect(modulePassed(5,8)).toBe(false);expect(modulePassed(6,8)).toBe(true);expect(modulePassed(0,0)).toBe(false)
})
