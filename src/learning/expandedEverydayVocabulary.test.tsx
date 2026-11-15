import {expect,it} from 'vitest'
import {existsSync} from 'node:fs'
import {renderToStaticMarkup} from 'react-dom/server'
import {expandedEverydayCatalogue,expandedVocabularyOrder,expandedVocabularyIcon} from './expandedEverydayVocabulary'
import {everydayPeopleCatalogue,everydayNounOrder} from './everydayVocabulary'
import {universityVocabulary} from './universityVocabulary'
import VocabularyPicture from './VocabularyPicture'
import {vocabularyIntegrity} from './sentenceRules/vocabularyAudit'
import {actionDialogue,objectsForAction,actionVocabulary,objectDeterminers} from './sentenceRules/actionDialogue'
import {activeActionBlueprints,actionInBlueprint} from './sentenceRules/actionBlueprints'
import {subjectCanPerform} from './sentenceRules/actionSemantics'
import {objectPronouns,namedNouns} from './sentenceRules/nominalReferences'
import {adjectiveFitsNoun} from './sentenceRules/adjectiveSemantics'
import {numberItem,generatedNumberCatalogue} from '../race/numberCatalogue'
import {nounGroupFor} from '../race/nounGroups'
import {rankWordChoices,hierarchyState,nounFamily} from '../race/wordHierarchy'
import {whiteboardWords} from '../classroom/whiteboardWords'
import {wordId,wordTokens} from './wordProgress/model'
const find=(word:string)=>universityVocabulary.find(item=>item.word===word)!
const direct=activeActionBlueprints.find(b=>b.connection==='direct')!
const compatible=(verb:string,noun:string)=>objectsForAction(verb,universityVocabulary,undefined,direct).find(item=>item.noun===noun)
it('shares every new form, category, meaning and order across whiteboard, lookup and practice',()=>{
 expect(vocabularyIntegrity([...expandedEverydayCatalogue,...everydayPeopleCatalogue])).toEqual([])
 const board=whiteboardWords({id:'test',vocabulary:[],plural:true,initialWord:'phone'})
 expect(everydayNounOrder.slice(-14)).toEqual(expandedVocabularyOrder)
 expect(rankWordChoices([...expandedVocabularyOrder].reverse().map(word=>({word}))).map(x=>x.word)).toEqual(expandedVocabularyOrder)
 for(const word of expandedVocabularyOrder){
  const item=find(word)
  expect(item,word).toBeDefined()
  expect(item.categories?.length,word).toBeGreaterThan(0)
  for(const form of [word,...(item.plural?[item.plural]:[])]){
   expect(board.vocabulary.some(w=>w.word===form),form).toBe(true)
   expect(generatedNumberCatalogue.some(w=>w.word===form),form).toBe(true)
   expect(numberItem(form)?.singular,form).toBe(word)
   expect(nounFamily(form)).toBe(word)
  }
  expect(actionVocabulary.some(action=>activeActionBlueprints.some(blueprint=>actionInBlueprint(action,blueprint)&&objectsForAction(action.word,universityVocabulary,undefined,blueprint).some(o=>o.noun===word))),word).toBe(true)
 }
 expect(nounGroupFor('child')).toBe('subjects')
 expect(nounGroupFor('family')).toBe('subjects')
 expect(nounGroupFor('milk')).toBe('objects')
 const learnt=new Set(everydayNounOrder.filter(w=>!expandedVocabularyOrder.includes(w)).flatMap(w=>wordTokens(w).map(wordId)))
 const state=hierarchyState(learnt)
 expect(state.noun.nounGroups?.subjects.current).toEqual(['brother','sister'])
 expect(state.noun.nounGroups?.objects.current).toEqual(['home','room'])
})
it('connects new nouns to appropriate verbs and rejects incompatible senses',()=>{
 for(const [verb,noun] of [['eating','rice'],['eating','bread'],['eating','food'],['drinking','milk'],['holding','money'],['cleaning','room'],['washing','car'],['driving','car'],['helping','sister'],['teaching','child']])expect(compatible(verb,noun),`${verb} ${noun}`).toBeDefined()
 for(const [verb,noun] of [['eating','milk'],['drinking','rice'],['eating','money'],['wearing','bread'],['holding','car'],['washing','bread'],['buying','money'],['reading','room']])expect(compatible(verb,noun),`${verb} ${noun}`).toBeUndefined()
 for(const noun of ['food','rice','bread','milk','money']){
  expect(find(noun).plural).toBeUndefined()
  const action=noun==='milk'?'drinking':noun==='money'?'holding':'eating'
  const object=compatible(action,noun)!
  expect(object.mass).toBe(true)
  expect(objectDeterminers(object).some(d=>['a','an','these','those'].includes(d.word))).toBe(false)
 }
 const sentence=actionDialogue('i','drinking',{blueprint:direct,vocabulary:universityVocabulary,subject:{word:'the child',thai:'เด็ก',kind:'person',phrase:{noun:'child',nounThai:'เด็ก',determiner:{english:'the',thai:''}}},object:compatible('drinking','milk')!.word}).answer
 expect(sentence.english).toBe('The child is drinking milk.')
 for(const child of ['child','children','brother','brothers','sister','sisters']){
  expect(subjectCanPerform({word:`the ${child}`},'driving','car')).toBe(false)
  expect(subjectCanPerform({word:`the ${child}`},'buying','cars')).toBe(false)
  expect(subjectCanPerform({word:`the ${child}`},'riding','bicycle')).toBe(true)
 }
 expect(objectPronouns(find('sister')).map(x=>x.word)).toEqual(['her'])
 expect(objectPronouns(find('brother')).map(x=>x.word)).toEqual(['him'])
 expect(objectPronouns(find('family')).map(x=>x.word)).toEqual(['it'])
 expect(namedNouns(find('family'))).toEqual([])
 expect(adjectiveFitsNoun('tall',find('family'))).toBe(false)
 expect(adjectiveFitsNoun('blue',find('car'))).toBe(true)
 expect(adjectiveFitsNoun('hot',find('milk'))).toBe(true)
})
it('renders real matching artwork for every new singular and irregular plural',()=>{
 for(const word of expandedVocabularyOrder){
  const item=find(word),icon=expandedVocabularyIcon(word)!
  expect(existsSync('public'+icon),word).toBe(true)
  const singular=renderToStaticMarkup(<VocabularyPicture word={word}/>)
  expect(singular).toContain(icon)
  expect(singular.match(/<img\b/g)).toHaveLength(1)
  if(item.plural){
   const plural=renderToStaticMarkup(<VocabularyPicture word={item.plural}/>)
   expect(plural.match(/<img\b/g)).toHaveLength(2)
   expect(plural).toContain(icon)
  }
 }
})

it('serves and reconstructs each new word through the real adaptive practice path',async()=>{
 const {serveBlueprintDeck,canonicalBlueprintQuestion}=await import('../race/blueprintWordServer')
 const {wordHierarchies}=await import('../race/wordHierarchy')
 for(const word of expandedVocabularyOrder){
  const before=everydayNounOrder.slice(0,everydayNounOrder.indexOf(word))
  const mastered=new Set([...before,...wordHierarchies.verb,...wordHierarchies.determiner,...wordHierarchies.pronoun].flatMap(w=>wordTokens(w).map(wordId)))
  const state=hierarchyState(mastered)
  const [q]=serveBlueprintDeck(6,state,new Map(),[],`expansion-${word}`,{limit:1,focus:{type:'noun',word}})
  expect(q.targetWords.some(target=>nounFamily(target)===word),word).toBe(true)
  const restored=canonicalBlueprintQuestion(q.recipe)
  expect(restored?.id,word).toBe(q.id)
  expect(restored?.document,word).toEqual(q.document)
 }
})
