import {expect,it} from 'vitest'
import {additionalPeople,additionalObjects,expandedVocabularyOrder} from './expandedEverydayVocabulary'
import {universityVocabulary} from './universityVocabulary'
import {everydayNounOrder} from './everydayVocabulary'
import {nounGroupFor} from '../race/nounGroups'
import {reviewVocabulary} from '../race/reviewVocabulary'
import {subjectCanPerform} from './sentenceRules/actionSemantics'
import {objectsForAction,actionDialogue,objectDeterminers} from './sentenceRules/actionDialogue'
import {activeActionBlueprints} from './sentenceRules/actionBlueprints'
import {objectPronouns} from './sentenceRules/nominalReferences'
const direct=activeActionBlueprints.find(b=>b.connection==='direct')!
const find=(word:string)=>universityVocabulary.find(item=>item.word===word)!
const object=(verb:string,noun:string)=>objectsForAction(verb,universityVocabulary,undefined,direct).find(item=>item.noun===noun)
it('shares 24 new people and 8 objects with the ordered review and real inventory',()=>{
 expect(additionalPeople).toHaveLength(24)
 expect(additionalObjects).toHaveLength(8)
 for(const person of additionalPeople){
  for(const word of [person.singular,person.plural]){
   expect(find(word),word).toBeDefined()
   expect(nounGroupFor(word),word).toBe('subjects')
  }
  expect(everydayNounOrder).toContain(person.singular)
  expect(reviewVocabulary.noun).toContain(person.singular)
 }
 for(const item of additionalObjects){
  expect(nounGroupFor(item.singular)).toBe('objects')
  expect(reviewVocabulary.noun).toContain(item.singular)
 }
 expect(expandedVocabularyOrder.slice(0,14)).toEqual(['brother','sister','friend','child','person','family','home','room','food','rice','bread','milk','money','car'])
})
it('connects objects by meaning without changing the existing sentence frames',()=>{
 for(const [verb,noun] of [['opening','door'],['opening','window'],['cleaning','bed'],['holding','ball'],['using','computer'],['watching','television'],['drinking','juice'],['drinking','coffee']])expect(object(verb,noun),`${verb} ${noun}`).toBeDefined()
 for(const [verb,noun] of [['drinking','ball'],['eating','coffee'],['wearing','door'],['holding','television'],['reading','computer']])expect(object(verb,noun),`${verb} ${noun}`).toBeUndefined()
 for(const noun of ['juice','coffee']){
  expect(find(noun).plural).toBeUndefined()
  expect(objectDeterminers(object('drinking',noun)!).some(d=>['a','an','these','those'].includes(d.word))).toBe(false)
 }
 for(const person of additionalPeople){
  const singular=actionDialogue('i','drinking',{blueprint:direct,vocabulary:universityVocabulary,subject:{word:`the ${person.singular}`,thai:person.thai,kind:'person',phrase:{noun:person.singular,nounThai:person.thai,determiner:{english:'the',thai:''}}},object:object('drinking','juice')!.word}).answer.english
  const plural=actionDialogue('i','drinking',{blueprint:direct,vocabulary:universityVocabulary,subject:{word:`the ${person.plural}`,thai:person.thai,kind:'person',number:'plural',phrase:{noun:person.plural,nounThai:person.thai,plural:true,determiner:{english:'the',thai:''}}},object:object('drinking','juice')!.word}).answer.english
  expect(singular,person.singular).toBe(`The ${person.singular} is drinking juice.`)
  expect(plural,person.plural).toBe(`The ${person.plural} are drinking juice.`)
 }
})
it('respects child subjects, baby capabilities and gender-specific references',()=>{
 for(const noun of ['student','students','baby','babies'])expect(subjectCanPerform({word:`the ${noun}`},'driving','car')).toBe(false)
 expect(subjectCanPerform({word:'the baby'},'fixing','car')).toBe(false)
 expect(subjectCanPerform({word:'the baby'},'sleeping')).toBe(true)
 expect(subjectCanPerform({word:'the police officer'},'driving','car')).toBe(true)
 expect(objectPronouns(find('grandmother')).map(x=>x.word)).toEqual(['her'])
 expect(objectPronouns(find('grandfather')).map(x=>x.word)).toEqual(['him'])
 expect(objectPronouns(find('nurse')).map(x=>x.word)).toEqual(['him','her'])
})
