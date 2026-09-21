import { describe, expect, it } from 'vitest'
import { countNeighbours, rankedNeighbours } from './corpus'
import { nouns, verbs, nounMatches, verbMatches } from '../../../scripts/wordGrammar'
import { tenseInContext } from './tense'
it('counts actual adjacent words without crossing sentence boundaries, gaps, or repeated exercise copies',()=>{
 const result=countNeighbours(['The child runs. The children run.','The child runs.','We see the child.','The _____ runs.','L: About 50 miles.'])
 expect(rankedNeighbours(result.get('child')!.before)).toEqual([{word:'the',count:2}])
 expect(rankedNeighbours(result.get('child')!.after)).toEqual([{word:'runs',count:1}])
 expect(result.get('runs')!.after.size).toBe(0)
 expect(result.get('the')!.after.has('runs')).toBe(false)
 expect(result.has('l')).toBe(false)
 expect(result.get('about')!.after.has('miles')).toBe(false)
})
it('recognises irregular nouns and verbs without treating every s ending as plural',()=>{
 expect(nouns.find(n=>nounMatches(n,'children'))).toMatchObject({singular:'child',plural:'children'})
 expect(nouns.find(n=>nounMatches(n,'bus'))).toMatchObject({singular:'bus',plural:'buses'})
 expect(nouns.find(n=>nounMatches(n,'cities'))).toMatchObject({singular:'city',plural:'cities'})
 expect(nouns.find(n=>nounMatches(n,'water'))).toMatchObject({plural:null,countability:'uncountable'})
 expect(verbs.find(v=>verbMatches(v,'went'))).toMatchObject({base:'go',past:'went',participle:'gone'})
 expect(verbs.find(v=>v.base==='stop')).toMatchObject({past:'stopped',ing:'stopping'})
 expect(verbs.find(v=>v.base==='write')).toMatchObject({ing:'writing'})
})
describe('contextual tense',()=>{
 const read=verbs.find(v=>v.base==='read')!, walk=verbs.find(v=>v.base==='walk')!
 it('does not assign a definite tense to ambiguous isolated forms',()=>{
  expect(tenseInContext('read','read',read)).toBeNull()
  expect(tenseInContext('walking','I like walking.',walk)).toBeNull()
  expect(tenseInContext('walked','walked',walk)).toBeNull()
 })
 it('uses auxiliary phrases and preserves sentence boundaries',()=>{
  expect(tenseInContext('walking','He is walking.',walk)).toBe('ปัจจุบันกำลังดำเนินอยู่')
  expect(tenseInContext('walking','He was walking.',walk)).toBe('อดีตกำลังดำเนินอยู่')
  expect(tenseInContext('read','I have read it.',read)).toBe('ปัจจุบันสมบูรณ์')
  expect(tenseInContext('read','I had read it.',read)).toBe('อดีตสมบูรณ์')
  expect(tenseInContext('read','I will read it.',read)).toContain('อนาคต')
  expect(tenseInContext('read','I have. Read it.',read)).toBeNull()
  expect(tenseInContext('read','The book is usually read.',read)).toBe('ปัจจุบัน · รูปถูกกระทำ')
 })
})
