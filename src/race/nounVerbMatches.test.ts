import {expect,it} from 'vitest'
import {nounVerbMatches} from './nounVerbMatches'
import {actionVocabulary,objectsForAction} from '../learning/sentenceRules/actionDialogue'
import {numberItem} from './numberCatalogue'
it('shows the engine’s human subject verbs',()=>{
 for(const word of ['man','woman','doctor'])expect(nounVerbMatches(word).map(v=>v.word)).toEqual(actionVocabulary.map(a=>a.word))
})
it('matches direct objects and preserves destination prepositions',()=>{
 expect(nounVerbMatches('phone').map(v=>v.label)).toEqual(expect.arrayContaining(['holding','cleaning','using','carrying','finding','buying']))
 expect(nounVerbMatches('water').map(v=>v.label)).toEqual(expect.arrayContaining(['drinking','buying','using']))
 expect(nounVerbMatches('book').map(v=>v.label).sort()).toEqual(expect.arrayContaining(['holding','opening','reading','closing']))
 expect(nounVerbMatches('school').map(v=>v.label).sort()).toEqual(expect.arrayContaining(['cleaning','going to','running to','walking to','arriving at','leaving']))
 expect(nounVerbMatches('apple').map(v=>v.label).sort()).toEqual(expect.arrayContaining(['eating','holding','washing','buying']))
 for(const noun of ['phone','water','book','school','apple'])for(const match of nounVerbMatches(noun)){
  expect(objectsForAction(match.word,[numberItem(noun)!],match.label.endsWith(' to')?'destination':undefined).length).toBeGreaterThan(0)
 }
})

it('excludes driving for depicted children and provides meaningful coverage for every current noun',async()=>{
 const {wordHierarchies}=await import('./wordHierarchy')
 for(const word of ['boy','girl','son','daughter']){
  expect(nounVerbMatches(word).some(v=>v.word==='driving'),word).toBe(false)
  expect(nounVerbMatches(word).some(v=>v.word==='reading'),word).toBe(true)
 }
 for(const word of wordHierarchies.noun)expect(nounVerbMatches(word).length,word).toBeGreaterThan(0)
 expect(nounVerbMatches('air conditioner').map(v=>v.word)).toEqual(expect.arrayContaining(['cleaning','using','buying']))
})
