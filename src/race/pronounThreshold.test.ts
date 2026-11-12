// @vitest-environment happy-dom
import {expect,it} from 'vitest'
import {hierarchyState,pronounsReady} from './wordHierarchy'
import {generatedDeck,masteredWords} from './generatedPracticeProgress'
import {forecastPractice} from './practiceForecast'
import type {WordProgress} from '../learning/wordProgress/model'
const row=(word:string,learnt=true):WordProgress=>({word_id:'en:'+word,correct:25,attempts:25,listening_correct:learnt?3:0,direct_correct:0,last_practised:'2026-01-01T00:00:00Z',recent_results:[],fade_score:25,confirmation_count:learnt?3:0,proven_at:learnt?'2026-01-01T00:00:00Z':null,review_due_at:learnt?'2040-01-01T00:00:00Z':null,learning_version:1})
const isPronoun=(q:ReturnType<typeof generatedDeck>[number])=>q.document.units.some(u=>u.role==='person'&&/^(i|you|he|she|we|they)[?.!]?$/i.test(u.english))
it('unlocks after two learnt noun families from either subgroup, never from fading alone',()=>{
 for(const words of [['man','woman'],['phone','bag'],['man','phone']])expect(pronounsReady(hierarchyState(masteredWords(words.map(w=>row(w)),[])))).toBe(true)
 expect(pronounsReady(hierarchyState(masteredWords([row('man'),row('woman',false)],[])))).toBe(false)
 expect(pronounsReady(hierarchyState(masteredWords([row('man'),row('men')],[])))).toBe(false)
 expect(pronounsReady(hierarchyState(masteredWords([row('i')],[])))).toBe(true)
})
it('keeps noun practice first, then serves and tests pronouns inside the same action sentence structures',()=>{
 const before=generatedDeck(5,[],[],'before')
 expect(before.some(isPronoun)).toBe(false)
 expect(generatedDeck(5,[row('man'),row('woman')],[],'two-learnt').some(isPronoun)).toBe(true)
 const rows=[row('man'),row('woman'),row('water')]
 const after=generatedDeck(5,rows,[],'after')
 expect(after.some(isPronoun)).toBe(true)
 expect(after.filter((_,i)=>i%3===2).every(q=>q.targetWords.some(w=>['I','you','he','she'].includes(w)))).toBe(true)
 expect(after.some(q=>!isPronoun(q))).toBe(true)
 for(const q of after.filter(isPronoun))expect(q.document.construction).toMatch(/^action-/)
})
it('forecast crosses the same noun threshold without saving hypothetical results',()=>{
 const rows=[row('phone'),{...row('man',false),confirmation_count:2,learning_updated_at:'2026-01-01T00:00:00Z'}]
 const q=generatedDeck(5,rows,[],'forecast')[0],snapshot=JSON.stringify(rows)
 const current={...q,document:{...q.document,english:'the man'},targetWords:['man'],listeningWords:['man'],vocabulary:['man'],credit:'man'}
 expect(forecastPractice(5,rows,[],'forecast',0,current).slice(1).some(isPronoun)).toBe(true)
 expect(JSON.stringify(rows)).toBe(snapshot)
})
