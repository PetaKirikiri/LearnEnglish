import {expect,it} from 'vitest'
import {evaluate,words,nouns,actions} from './wordGrammar'
const valid=(s:string)=>evaluate(s.split(' ')).valid
it('requires auxiliary agreement and -ing actions',()=>{
 expect(valid('the dog is running')).toBe(true)
 expect(valid('the dogs are walking')).toBe(true)
 expect(valid('the dogs is running')).toBe(false)
 expect(valid('the dog are walking')).toBe(false)
 expect(valid('I am reading a book')).toBe(true)
 expect(valid('I is reading a book')).toBe(false)
 expect(valid('the dog runs')).toBe(false)
 expect(words).not.toContain('runs')
})
it('connects complete clauses and destination/location phrases',()=>{
 expect(valid('the small dog is running and the big fish is walking')).toBe(true)
 expect(valid('the dog is walking to the school')).toBe(true)
 expect(valid('the dog is sleeping in the bedroom')).toBe(true)
 expect(valid('the dog and the cat are walking')).toBe(true)
 expect(valid('the dog and the cat')).toBe(true)
 expect(valid('the dog is running the school')).toBe(false)
 expect(valid('the dog is running and')).toBe(false)
 expect(valid('the dog is running to')).toBe(false)
})
it('uses the full shared noun and action inventories, including irregular plurals',()=>{
 expect(nouns.length).toBeGreaterThan(100)
 expect(actions.length).toBeGreaterThan(15)
 for(const n of nouns)expect(words).toContain(n.word)
 for(const a of actions)expect(words).toContain(a.word)
 expect(valid('the children are reading the books')).toBe(true)
 expect(valid('the children is reading the books')).toBe(false)
 expect(valid('the a dogs')).toBe(false)
 expect(valid('a dogs')).toBe(false)
})
