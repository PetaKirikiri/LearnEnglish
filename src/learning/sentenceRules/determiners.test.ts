import {expect,it} from 'vitest'
import {determinerAgrees} from './determiners'
import {determinerCandidates} from '../../race/generatedPracticeContent'
import {wordHierarchies} from '../../race/wordHierarchy'
it('includes the requested determiners and enforces their number and mass-noun rules',()=>{
 for(const word of ['this','that','these','those','some'])expect(wordHierarchies.determiner).toContain(word)
 expect(determinerAgrees('this',true)).toBe(false);expect(determinerAgrees('that',false)).toBe(true)
 expect(determinerAgrees('these',false)).toBe(false);expect(determinerAgrees('those',true)).toBe(true)
 expect(determinerAgrees('some',false)).toBe(false);expect(determinerAgrees('some',false,true)).toBe(true)
 const bank=determinerCandidates();for(const q of bank)expect(determinerAgrees(q.owner,q.plural)).toBe(true)
 for(const word of ['this','that','these','those','some'])expect(bank.some(q=>q.targetWords.includes(word))).toBe(true)
})
