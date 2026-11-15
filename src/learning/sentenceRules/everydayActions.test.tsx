import {expect,it} from 'vitest'
import {existsSync} from 'node:fs'
import {renderToStaticMarkup} from 'react-dom/server'
import {everydayActions} from './everydayActions'
import {everydayActionOrder} from '../everydayVocabulary'
import {universityVocabulary} from '../universityVocabulary'
import {actionDialogue,actionVocabulary,objectsForAction} from './actionDialogue'
import {activeActionBlueprints,matchingActionBlueprint} from './actionBlueprints'
import {subjectCanPerform} from './actionSemantics'
import {wordHierarchies,hierarchyState,rankWordChoices} from '../../race/wordHierarchy'
import {wordId,wordTokens} from '../wordProgress/model'
import {serveBlueprintDeck,canonicalBlueprintQuestion} from '../../race/blueprintWordServer'
import {ActionIcon} from '../sentenceMatrix/ActionVocabularyIcon'
import {quadrantLayout} from '../sentenceMatrix/LanguageQuadrant'
import {taughtActionLine} from './assessmentScope'
const frame=(word:string)=>matchingActionBlueprint(actionVocabulary.find(a=>a.word===word)!)!
const objects=(word:string)=>objectsForAction(word,universityVocabulary,undefined,frame(word))
const examples=[['cooking','rice'],['taking','book'],['bringing','milk'],['choosing','shirt'],['cutting','bread'],['drawing','car'],['painting','chair'],['fixing','bicycle'],['pushing','chair'],['pulling','bag'],['lifting','bag'],['selling','apple'],['visiting','friend'],['coming','school']]
it('appends new verbs in one shared order without adding sentence structures',()=>{
 expect(everydayActionOrder.slice(-14)).toEqual(everydayActions.map(a=>a.word))
 expect(rankWordChoices([...everydayActions].reverse()).map(a=>a.word)).toEqual(everydayActions.map(a=>a.word))
 expect(activeActionBlueprints.map(b=>b.connection)).toEqual(['direct','to'])
 for(const entry of everydayActions){
  expect(frame(entry.word),entry.word).toBeDefined()
  expect(objects(entry.word).length,entry.word).toBeGreaterThan(0)
  expect(entry.categories.length).toBeGreaterThan(0)
 }
 const oldVerbs=everydayActionOrder.slice(0,-14)
 const mastered=new Set(oldVerbs.flatMap(w=>wordTokens(w).map(wordId)))
 const state=hierarchyState(mastered)
 // Word evidence is shared: previously learning 'taking off' already proves 'taking'.
 expect(state.verb.completed).toContain('taking')
 expect(state.verb.verbGroups?.transitive.current).toEqual(['cooking','bringing','choosing'])
 expect(state.verb.verbGroups?.intransitive.current).toEqual(['coming'])
})
it('composes real sentences with correct Thai, grammar and layout',()=>{
 for(const [verb,noun] of examples){
  const object=objects(verb).find(o=>o.noun===noun)!
  expect(object,`${verb} ${noun}`).toBeDefined()
  const answer=actionDialogue('i',verb,{blueprint:frame(verb),vocabulary:universityVocabulary,subject:{word:'I',thai:'ฉัน',person:1,kind:'person'},object:object.word,determiner:'the'}).answer
  expect(answer.english).toBe(`I am ${verb}${verb==='coming'?' to':''} the ${noun}.`)
  expect(taughtActionLine(verb==='coming'?5:6,answer.units),answer.english).toBe(true)
  expect(()=>quadrantLayout({...answer,construction:'action-answer'})).not.toThrow()
  if(verb==='cooking'){
   expect(answer.thai).toBe('ฉันกำลังหุงข้าว')
   expect(answer.units.find(u=>u.role==='action')?.thai).toBe('หุง')
  }
  if(verb==='coming')expect(answer.thai).toBe('ฉันกำลังมาที่โรงเรียน')
 }
 const person=objects('coming').find(o=>o.noun==='friend')!
 expect(actionDialogue('i','coming',{blueprint:frame('coming'),vocabulary:universityVocabulary,object:person.word,determiner:'the'}).answer.thai).toBe('ฉันกำลังมาหาเพื่อน')
})
it('rejects incompatible objects and self-directed visits without untaught reflexives',()=>{
 for(const [verb,noun] of [['cooking','phone'],['cooking','milk'],['cutting','rice'],['cutting','person'],['taking','car'],['bringing','school'],['choosing','money'],['painting','person'],['fixing','bread'],['pushing','milk'],['pulling','food'],['lifting','car'],['selling','money'],['visiting','phone'],['coming','rice']])expect(objects(verb).some(o=>o.noun===noun),`${verb} ${noun}`).toBe(false)
 for(const noun of ['child','children','sister'])expect(subjectCanPerform({word:`the ${noun}`},'selling','car')).toBe(false)
 expect(subjectCanPerform({word:'the man'},'visiting','the man')).toBe(false)
 expect(subjectCanPerform({word:'the woman'},'coming','to the woman')).toBe(false)
 expect(subjectCanPerform({word:'the child'},'drawing','car')).toBe(true)
})
it('serves each new verb and reconstructs its question on the scoring server',()=>{
 for(const entry of everydayActions){
  const earlier=everydayActionOrder.slice(0,everydayActionOrder.indexOf(entry.word))
  const mastered=new Set([...wordHierarchies.noun,...earlier,...wordHierarchies.determiner,...wordHierarchies.pronoun].flatMap(w=>wordTokens(w).map(wordId)))
  const state=hierarchyState(mastered)
  const [q]=serveBlueprintDeck(entry.word==='coming'?5:6,state,new Map(),[],`new-verb-${entry.word}`,{limit:1,focus:{type:'verb',word:entry.word},...(entry.word==='coming'?{structure:'destination' as const}:{})})
  expect(q.targetWords,entry.word).toContain(entry.word)
  expect(q.action,entry.word).toBe(entry.word)
  const restored=canonicalBlueprintQuestion(q.recipe)
  expect(restored?.id,entry.word).toBe(q.id)
  expect(restored?.document,entry.word).toEqual(q.document)
 }
})
it('renders a distinct real icon for every added action',()=>{
 expect(new Set(everydayActions.map(a=>a.icon)).size).toBe(14)
 for(const entry of everydayActions){
  expect(existsSync('public'+entry.icon),entry.word).toBe(true)
  expect(renderToStaticMarkup(<ActionIcon word={entry.word}/>)).toContain(entry.icon)
 }
})
