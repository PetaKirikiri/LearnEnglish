// @vitest-environment happy-dom
import {expect,it} from 'vitest'
import {hierarchyState,wordHierarchies,hierarchyCompatible} from './wordHierarchy'
import {generatedDeck,masteredWords,type ListeningEvidence} from './generatedPracticeProgress'
import {canonicalBlueprintQuestion} from './blueprintWordServer'
import {forecastPractice,nextPersonalQuestion} from './practiceForecast'
import type {WordProgress} from '../learning/wordProgress/model'
const row=(word:string,proved=false):WordProgress=>({word_id:'en:'+word,correct:99,attempts:99,listening_correct:proved?3:0,direct_correct:0,last_practised:'',recent_results:[true,true,true],fade_score:proved?25:24,confirmation_count:proved?3:0,proven_at:proved?'2026-01-01T00:00:00Z':null,review_due_at:proved?'2040-01-01T00:00:00Z':null,learning_version:1})
it('has five independent ordered hierarchies and exposure below full fade never advances a frontier',()=>{
 expect(Object.keys(wordHierarchies)).toEqual(['noun','verb','adjective','pronoun','determiner'])
 const state=hierarchyState(masteredWords([row('banana'),row('eating'),row('my')],[]))
 expect(Object.fromEntries(Object.entries(state).map(([k,v])=>[k,v.current[0]]))).toEqual({noun:'man',verb:'holding',adjective:'red',pronoun:'I',determiner:'the'})
})
it('only advances past the completed prefix, independently per word type',()=>{
 const state=hierarchyState(masteredWords([row('man',true),row('banana',true),row('holding',true),row('the',true)],[]))
 expect(state.noun.current[0]).toBe('woman');expect(state.verb.current[0]).toBe('opening')
 expect(state.determiner.current[0]).toBe('my');expect(state.adjective.current[0]).toBe('red');expect(state.pronoun.current[0]).toBe('I')
 const other=hierarchyState(masteredWords([row('i',true),row('red',true)],[]))
 expect(other.pronoun.current[0]).toBe('you');expect(other.adjective.current[0]).toBe('blue');expect(other.noun.current[0]).toBe('man')
})
it('Round 6 never serves banana just because it has historical correct answers',()=>{
 const rows=[row('banana'),row('apple'),row('eating')],state=hierarchyState(masteredWords(rows,[]))
 for(const seed of ['a','b','c']){
  const deck=generatedDeck(6,rows,[],seed,{actions:['eating','reading','drinking']})
  expect(deck).toHaveLength(30)
  for(const q of deck){expect(hierarchyCompatible(q,state)).toBe(true);expect(q.document.english).not.toMatch(/banana|apple/i)}
  expect(deck.every(q=>q.vocabulary.some(w=>['man','men','woman','women','phone','phones','bag','bags'].includes(w)))).toBe(true)
 }
})
it('all rounds and structures use the same noun frontier without silently skipping ahead',()=>{
 const rows=[row('man',true)],state=hierarchyState(masteredWords(rows,[]))
 for(const level of [1,2,3,4,5,6] as const)for(const structure of [undefined,'identify','location','destination'] as const){
  const deck=(()=>{try{return generatedDeck(level,rows,[],'same',{structure})}catch(error){throw new Error(`Level ${level}, ${structure??'default'}: ${String(error)}`)}})()
  expect(deck).toHaveLength(30)
  expect(deck.every(q=>hierarchyCompatible(q,state))).toBe(true)
  expect(deck.some(q=>q.targetWords.some(w=>['woman','women'].includes(w))||q.sceneChoices?.[q.correct].word==='woman'||q.kind==='judgement'&&q.vocabulary.some(w=>['woman','women'].includes(w))),`level ${level}, ${structure}`).toBe(true)
 }
})
it('forecast refills a noun slot at full fade without writing account progress',()=>{
 const evidence:ListeningEvidence[]=[],rows=[{...row('man'),correct:24,fade_score:24,confirmation_count:0,learning_updated_at:'2026-01-01T00:00:00Z'}]
 const original=JSON.stringify({rows,evidence}),options={focus:{type:'noun' as const,word:'man'}}
 let index=0,q=nextPersonalQuestion(1,rows,evidence,'forecast',index,options)
 while(!q.targetWords.includes('man')&&index<20)q=nextPersonalQuestion(1,rows,evidence,'forecast',++index,options)
 expect(q.targetWords).toContain('man')
 const forecast=forecastPractice(1,rows,evidence,'forecast',index,q)
 expect(forecast.slice(1).some(q=>q.vocabulary.some(w=>['boy','boys'].includes(w)))).toBe(true)
 expect(JSON.stringify({rows,evidence})).toBe(original)
})

it('introduces the next adjective only with an already completed noun',()=>{
 const q=canonicalBlueprintQuestion({version:1,level:1,anchor:{type:'adjective',word:'red'},a:{construction:'noun-phrase',noun:'phone',owner:'the',description:'red'},b:{construction:'noun-phrase',noun:'phone',owner:'the',description:'blue'}})!
 expect(q).toBeDefined()
 const before=wordHierarchies.noun.slice(0,wordHierarchies.noun.indexOf('phone')).map(w=>row(w,true))
 expect(hierarchyCompatible(q,hierarchyState(masteredWords(before,[])))).toBe(false)
 expect(hierarchyCompatible(q,hierarchyState(masteredWords([...before,row('phone',true)],[])))).toBe(true)
})

it('keeps four Current words per type, refills any learnt slot and exposes only one queued Next word',()=>{
 const initial=hierarchyState(new Set())
 expect(initial.noun.current).toEqual(['man','woman','phone','bag']);expect(initial.noun.queued).toEqual(['boy','water'])
 const completed=hierarchyState(new Set(['en:woman']))
 expect(completed.noun.current).toEqual(['man','boy','phone','bag']);expect(completed.noun.queued).toEqual(['girl','water'])
 for(const [type,track] of Object.entries(completed))expect(track.current.length).toBeLessThanOrEqual(type==='verb'?6:4)
 expect(completed.determiner.current).toEqual(initial.determiner.current)
})
it('cycles all four Current noun families without serving the queued replacement early',()=>{
 const families=new Set(generatedDeck(6,[],[],'cycle').flatMap(q=>q.targetWords.map(w=>({men:'man',women:'woman',phones:'phone',bags:'bag'} as Record<string,string>)[w]??w)))
 for(const word of ['man','woman','phone','bag'])expect(families.has(word)).toBe(true)
 expect(families.has('boy')).toBe(false);expect(families.has('water')).toBe(false)
})

it('refills subjects and objects independently, including lapses and exhausted groups',()=>{
 const initial=hierarchyState(new Set()).noun
 expect(initial.nounGroups?.subjects).toEqual({current:['man','woman'],next:'boy'})
 expect(initial.nounGroups?.objects).toEqual({current:['phone','bag'],next:'water'})
 const subject=hierarchyState(new Set(['en:woman'])).noun
 expect(subject.nounGroups?.subjects.current).toEqual(['man','boy'])
 expect(subject.nounGroups?.objects).toEqual(initial.nounGroups?.objects)
 const object=hierarchyState(new Set(['en:bag'])).noun
 expect(object.nounGroups?.objects).toEqual({current:['phone','water'],next:'cup'})
 expect(object.nounGroups?.subjects).toEqual(initial.nounGroups?.subjects)
 const people=wordHierarchies.noun.filter(w=>['man','woman','boy','girl','mother','father','son','daughter','doctor'].includes(w))
 const exhausted=hierarchyState(new Set(people.map(w=>'en:'+w))).noun
 expect(exhausted.current).toEqual(['phone','bag'])
 expect(hierarchyState(new Set()).noun.current).toEqual(initial.current)
})

it('checks possessive determiners in the subject block against the same word frontier',()=>{
 const q=canonicalBlueprintQuestion({version:1,level:4,anchor:{type:'noun',word:'man'},a:{construction:'action-question',person:'man',personOwner:'her',verb:'doing'},b:{construction:'action-question',person:'woman',personOwner:'her',verb:'doing'}})!
 expect(q).toBeDefined()
 expect(q.document.units.some(unit=>unit.role==='person-determiner'&&unit.english==='her')).toBe(true)
 expect(hierarchyCompatible(q,hierarchyState(new Set()))).toBe(false)
})
