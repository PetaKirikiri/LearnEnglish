// @vitest-environment happy-dom
import {expect,it} from 'vitest'
import {allPracticeCandidates,generatedCandidates} from './generatedPracticeContent'
import {wordHierarchies,hierarchyState,hierarchyCompatible} from './wordHierarchy'
import {subjectCanPerform} from '../learning/sentenceRules/actionSemantics'
it('provides creditable questions for every verb and keeps bounded banks identical to registered combinations',()=>{
 const full=allPracticeCandidates(),byId=new Map(full.map(q=>[q.id,q]))
 expect(byId.size).toBe(full.length)
 for(const verb of wordHierarchies.verb)expect(full.some(q=>q.action===verb&&q.targetWords.includes(verb)),verb).toBe(true)
 const partial=generatedCandidates(5,new Set(['eating','drinking','reading','talking','listening','walking','opening','running']))
 expect(partial.length).toBeLessThan(generatedCandidates(5).length)
 expect(partial.every(q=>JSON.stringify(byId.get(q.id))===JSON.stringify(q))).toBe(true)
 const invalid=full.flatMap(q=>[q.document,...(q.alternatives??[])]).filter(document=>{
  const subject=document.units.find(u=>u.role==='person'),action=document.units.find(u=>u.role==='action'),object=document.units.find(u=>u.role==='object')
  return subject&&action&&!subjectCanPerform({word:subject.english.replace(/[?.!]$/,'')},action.english.replace(/[?.!]$/,''),object?.english)
 })
 expect(invalid).toEqual([])
 const initial=hierarchyState(new Set())
 expect(partial.filter(q=>hierarchyCompatible(q,initial)).every(q=>!q.document.english.includes('wearing'))).toBe(true)
},20000)
