// @vitest-environment happy-dom
import {expect,it} from 'vitest'
import {allPracticeCandidates} from './generatedPracticeContent'
import {adjectiveFitsNoun} from '../learning/sentenceRules/adjectiveSemantics'
import {quadrantLayout} from '../learning/sentenceMatrix/LanguageQuadrant'
it('keeps every generated adjective and its alternative attached to a compatible noun in valid boxes',()=>{
 const bank=allPracticeCandidates(),described=bank.filter(q=>q.document.units.some(unit=>unit.role==='description'))
 expect(new Set(bank.map(q=>q.id)).size).toBe(bank.length)
 expect(described.some(q=>q.document.units.some((u,i)=>u.role==='description'&&q.document.units[i+1]?.role==='person'))).toBe(true)
 expect(described.some(q=>q.document.units.some((u,i)=>u.role==='description'&&q.document.units[i+1]?.role==='object'))).toBe(true)
 const invalid=[]
 for(const q of described)for(const document of [q.document,...(q.alternatives??[])]){
  for(const [index,unit] of document.units.entries())if(unit.role==='description'&&!adjectiveFitsNoun(unit.english,document.units[index+1]?.english??''))invalid.push(document.english)
  try{quadrantLayout(document)}catch{invalid.push(document.english)}
 }
 expect(invalid).toEqual([])
},25000)
