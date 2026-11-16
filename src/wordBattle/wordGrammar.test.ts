import {expect,it} from 'vitest'
import {evaluate,words,nouns,actions} from './wordGrammar'
const valid=(s:string)=>evaluate(s.split(' ')).valid
it('requires auxiliary agreement and -ing actions',()=>{
 expect(valid('the doctor is running')).toBe(true)
 expect(valid('the doctors are walking')).toBe(true)
 expect(valid('the doctors is running')).toBe(false)
 expect(valid('the doctor are walking')).toBe(false)
 expect(valid('I am reading a book')).toBe(true)
 expect(valid('I is reading a book')).toBe(false)
 expect(valid('the doctor runs')).toBe(false)
 expect(words).not.toContain('runs')
})
it('connects complete clauses and destination/lobookion phrases',()=>{
 expect(valid('the small doctor is running and the big apple is walking')).toBe(true)
 expect(valid('the doctor is walking to the school')).toBe(true)
 expect(valid('the doctor is sleeping in the bedroom')).toBe(true)
 expect(valid('the doctor and the book are walking')).toBe(true)
 expect(valid('the doctor and the book')).toBe(true)
 expect(valid('the doctor is running the school')).toBe(false)
 expect(valid('the doctor is running and')).toBe(false)
 expect(valid('the doctor is running to')).toBe(false)
})
it('uses the full shared noun and action inventories, including irregular plurals',()=>{
 expect(nouns.length).toBeGreaterThan(100)
 expect(actions.length).toBeGreaterThan(15)
 for(const n of nouns)expect(words).toContain(n.word)
 for(const a of actions)expect(words).toContain(a.word)
 expect(valid('the children are reading the books')).toBe(true)
 expect(valid('the children is reading the books')).toBe(false)
 expect(valid('the a doctors')).toBe(false)
 expect(valid('a doctors')).toBe(false)
})

it('keeps orange usable as a fruit noun as well as an adjective',()=>{expect(evaluate(['the','orange']).valid).toBe(true);expect(evaluate(['the','orange','book']).valid).toBe(true)})
