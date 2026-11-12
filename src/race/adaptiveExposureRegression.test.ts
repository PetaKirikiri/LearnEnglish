// @vitest-environment happy-dom
import {beforeEach,expect,it} from 'vitest'
import {lessonPracticeTemplate} from './lessonPracticeTemplate'
import {nextPersonalQuestion} from './practiceForecast'
import {loadEvidence,saveEvidence,masteredWords,curriculumBaseline,type ListeningEvidence} from './generatedPracticeProgress'
import {hierarchyState,wordHierarchies,hierarchyCompatible} from './wordHierarchy'
import {learningStates} from '../learning/wordProgress/learningLifecycle'
import {wordTokens,type WordProgress} from '../learning/wordProgress/model'
import type {GeneratedQuestion} from './generatedPracticeContent'
const base=Date.parse('2026-11-12T00:00:00Z')
const user='water-verb-regression'
const learned=(word:string):WordProgress=>({word_id:'en:'+word,correct:25,attempts:25,listening_correct:0,direct_correct:0,last_practised:new Date(base).toISOString(),recent_results:[true],fade_score:25,proven_at:new Date(base).toISOString(),review_due_at:new Date(base+86400000).toISOString(),learning_updated_at:new Date(base).toISOString()})
beforeEach(()=>localStorage.clear())
function answer(q:GeneratedQuestion,index:number,rows:WordProgress[]=[]){
 const event:ListeningEvidence={id:'regression-'+index,questionId:q.id,level:q.level,sentence:q.document.english,targets:q.credit===null?[]:q.targetWords,vocabulary:q.vocabulary,correct:true,hidden:true,heard:true,assisted:false,plays:1,at:new Date(base+index+1).toISOString()}
 const before=learningStates(rows,loadEvidence(user));saveEvidence(event,user);const after=learningStates(rows,loadEvidence(user))
 const focus=wordTokens(q.credit??'').filter(word=>!['am','is','are'].includes(word));const targets=new Set(focus.length?focus:wordTokens(q.credit??''))
 if(q.credit!==null)for(const word of new Set([...wordTokens(q.document.english),...targets])){
  expect(after.get('en:'+word)?.fadeScore,`${q.document.english}: ${word}`).toBe(Math.min(25,(before.get('en:'+word)?.fadeScore??0)+(targets.has(word)?3:1)))
 }
}
function tight(q:GeneratedQuestion){
 if(!q.alternatives)return
 if(q.kind==='meaning'){expect(q.alternatives[q.correct].english).toBe(q.document.english);expect(q.choices).toEqual(q.alternatives.map(doc=>doc.english))}
 const [a,b]=q.alternatives;expect(a.units.length).toBe(b.units.length)
 const diff=a.units.filter((u,i)=>u.english.toLowerCase()!==b.units[i].english.toLowerCase())
 expect(diff.length).toBeGreaterThan(0)
 expect(diff.filter(u=>u.role!=='be').length,`${a.english} / ${b.english}`).toBeLessThanOrEqual(1)
}
it('finishes drinking with water already Learnt, testing the verb against another valid verb and retaining water',()=>{
 const nouns=wordHierarchies.noun.slice(0,wordHierarchies.noun.indexOf('water')+1)
 const verbs=wordHierarchies.verb.slice(0,wordHierarchies.verb.indexOf('drinking'))
 const rows=[...new Set([...nouns,...verbs,'the','my','your','I','you','he','she'].flatMap(wordTokens))].map(learned)
 let drinkingTests=0
 const verbsSeen=new Set<string>()
 for(let i=0;i<120;i++){
  const events=loadEvidence(user),q=nextPersonalQuestion(6,rows,events,'known-water',i,{now:base+i,familiar:curriculumBaseline(rows,events,user)})
  tight(q)
  expect(hierarchyCompatible(q,hierarchyState(masteredWords(rows,events)))).toBe(true)
  if(q.targetWords.includes('drinking')){
   drinkingTests++;expect(q.document.units.find(u=>u.role==='object')?.english.replace(/[.!?]/g,'')).toBe('water')
   expect(q.alternatives).toBeDefined()
   const [a,b]=q.alternatives!;expect(a.units.filter(u=>u.role!=='action')).toEqual(b.units.filter(u=>u.role!=='action'))
   expect(a.units.find(u=>u.role==='action')?.english).not.toBe(b.units.find(u=>u.role==='action')?.english)
  }
  if(q.action)verbsSeen.add(q.action)
  answer(q,i,rows)
  expect(masteredWords(rows,loadEvidence(user)).has('en:water')).toBe(true)
  if(masteredWords(rows,loadEvidence(user)).has('en:drinking'))break
 }
 expect(drinkingTests).toBeGreaterThan(0)
 expect(masteredWords(rows,loadEvidence(user)).has('en:drinking')).toBe(true)
 expect(verbsSeen.size).toBeGreaterThan(1)
 const saved=loadEvidence(user)
 expect(saved.filter(event=>event.targets.includes('water'))).toHaveLength(0)
 console.log(JSON.stringify({case:'known-water-unfinished-drinking',answers:saved.length,drinkingContrasts:drinkingTests,waterRetested:0,drinkingFade:learningStates(rows,saved).get('en:drinking')?.fadeScore}))
},120000)
it('serves is/are judgement from the normal Round 3 path with the auxiliary as the only scored focus',()=>{
 const seen=new Set<string>()
 for(let i=0;i<60;i++){
  const events=loadEvidence(user),q=nextPersonalQuestion(3,[],events,'agreement',i,{now:base+i})
  tight(q)
  if(q.kind==='judgement'&&q.credit!==null){expect(q.targetWords).toHaveLength(1);expect(['is','are']).toContain(q.credit);seen.add(q.credit!)}
  answer(q,i)
 }
 expect(seen).toEqual(new Set(['is','are']))
},120000)

it('starts every lesson with the same account-wide Current vocabulary before any answers exist',()=>{
 const initial=hierarchyState(new Set())
 expect(initial.noun.current).toEqual(['man','woman','phone','bag'])
 for(let lesson=1;lesson<=6;lesson++){
  const template=lessonPracticeTemplate(lesson),q=nextPersonalQuestion(template.level,[],[],'new-account',0,{...template.options,now:base})
  tight(q)
  expect(hierarchyCompatible(q,initial),q.document.english).toBe(true)
  expect(q.document.units.filter(unit=>['person','object'].includes(unit.role)).every(unit=>!['I','you','he','she','we','they'].includes(unit.english.replace(/[.!?]/g,'')))).toBe(true)
 }
 expect(loadEvidence(user)).toEqual([])
},120000)
