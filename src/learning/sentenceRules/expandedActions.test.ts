import {expect,it} from 'vitest'
import {existsSync,statSync} from 'node:fs'
import {expandedActions} from './expandedActions'
import {actionDialogue,objectsForAction} from './actionDialogue'
import {subjectCanPerform} from './actionSemantics'
import {verbGroupFor} from './verbGroups'
import {lessonThreeMatrixCatalogue} from '../../classroom/wordCatalogue'
import {everydayPeopleCatalogue,everydayActionOrder} from '../everydayVocabulary'
import {quadrantLayout} from '../sentenceMatrix/LanguageQuadrant'
import {taughtActionLine} from './assessmentScope'
const vocabulary=[...lessonThreeMatrixCatalogue,...everydayPeopleCatalogue]
it('adds all nineteen reviewed verbs with real, distinct matching-style icon assets',()=>{
 expect(expandedActions).toHaveLength(19)
 for(const action of expandedActions){
  expect(everydayActionOrder).toContain(action.word)
  expect(existsSync('public'+action.icon),action.word).toBe(true)
  expect(statSync('public'+action.icon).size).toBeGreaterThan(10000)
 }
 expect(new Set(expandedActions.map(a=>a.icon)).size).toBe(19)
})
it('composes direct-object, particle, prepositional and standalone uses with valid shared layouts',()=>{
 const examples=[['using','the phone','I am using the phone.'],['carrying','the bag','I am carrying the bag.'],['finding','the key','I am finding the key.'],['buying','the apple','I am buying the apple.'],['closing','the book','I am closing the book.'],['wearing','the shirt','I am wearing the shirt.'],['putting on','the shirt','I am putting on the shirt.'],['taking off','the shirt','I am taking off the shirt.'],['riding','the bicycle','I am riding the bicycle.'],['catching','the bus','I am catching the bus.'],['getting on','on the bus','I am getting on the bus.'],['helping','the woman','I am helping the woman.'],['watching','the man','I am watching the man.'],['teaching','the boy','I am teaching the boy.'],['arriving','at the school','I am arriving at the school.'],['leaving','the school','I am leaving the school.']]
 for(const [verb,phrase,english] of examples){
  const object=objectsForAction(verb,vocabulary).find(o=>o.word===phrase||o.noun===phrase.replace(/^the /,''))!
  expect(object,verb).toBeDefined()
  const answer=actionDialogue('i',verb,{vocabulary,subject:{word:'I',thai:'ฉัน',person:1,kind:'person'},object:object.word,determiner:'the'}).answer
  expect(answer.english).toBe(english)
  expect(taughtActionLine(6,answer.units),english).toBe(true)
  expect(()=>quadrantLayout({...answer,construction:'action-answer'})).not.toThrow()
 }
 for(const verb of ['sitting','standing','waiting']){
  const answer=actionDialogue('i',verb,{vocabulary,subject:{word:'I',thai:'ฉัน',person:1,kind:'person'}}).answer
  expect(answer.english).toBe(`I am ${verb}.`)
  expect(taughtActionLine(5,answer.units)).toBe(true)
 }
 expect(verbGroupFor('getting on')).toBe('intransitive')
 expect(verbGroupFor('arriving')).toBe('intransitive')
 expect(verbGroupFor('leaving')).toBe('transitive')
})
it('rejects plausible-looking but wrong pairings, child motorbike use and untaught reflexives',()=>{
 for(const [verb,noun] of [['wearing','phone'],['riding','chair'],['catching','bicycle'],['getting on','shirt'],['helping','chair'],['teaching','apple'],['arriving','phone']])expect(objectsForAction(verb,vocabulary).some(o=>o.noun===noun),`${verb} ${noun}`).toBe(false)
 expect(subjectCanPerform({word:'the son'},'riding','motorbike')).toBe(false)
 expect(subjectCanPerform({word:'the daughter'},'riding','bicycle')).toBe(true)
 expect(subjectCanPerform({word:'the boy'},'buying','the bus')).toBe(false)
 expect(subjectCanPerform({word:'the man'},'helping','the man')).toBe(false)
})
