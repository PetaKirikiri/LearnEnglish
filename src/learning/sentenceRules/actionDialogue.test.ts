import {expect,it} from 'vitest'
import {actionDialogue as compose,actionSubjects,actionVocabulary,objectsForAction as compatibleObjects,type ActionSubject} from './actionDialogue'
import {testVocabulary} from '../sentenceMatrix/actionTestVocabulary'
const actionDialogue=(subject:ActionSubject,word:string,selection:Partial<Parameters<typeof compose>[2]>={})=>compose(subject,word,{vocabulary:testVocabulary,...selection})
const objectsForAction=(word:string,catalogue=testVocabulary)=>compatibleObjects(word,catalogue)
const actionObjects=actionVocabulary.flatMap(action=>objectsForAction(action.word))
it('pairs every reviewed action and complement with agreeing subjects and aligned units',()=>{
 for(const subject of Object.keys(actionSubjects) as ActionSubject[])for(const action of actionVocabulary){
  for(const object of objectsForAction(action.word).length?objectsForAction(action.word):[undefined]){
   const pair=actionDialogue(subject,action.word,{object:object?.word}),p=actionSubjects[subject]
   expect(pair.question.english).toBe(`What ${p.questionBe} ${subject==='i'?'I':subject} doing?`)
   expect(pair.answer.english.startsWith(`${p.answer} ${p.answerBe} ${action.word}`)).toBe(true)
   for(const sentence of [pair.question,pair.answer])expect(sentence.units.map(u=>u.english).join(' ')).toBe(sentence.english)
   expect(pair.answer.units.length).toBeLessThanOrEqual(6)
  }
 }
})
it('teaches simple object, destination and standalone patterns',()=>{
 expect(actionDialogue('you','eating').answer.english).toBe('I am eating an apple.')
 expect(actionDialogue('you','sleeping').answer.english).toBe('I am sleeping.')
 const pair=actionDialogue('you','going')
 expect(pair.answer.english).toBe('I am going to the hotel.')
 expect(pair.answer.thai).toBe('ฉันกำลังไปที่โรงแรม')
 expect(pair.answer.units.map(u=>u.thai)).toEqual(['ฉัน','กำลัง','ไป','ที่','ที่กำลังพูดถึง','โรงแรม'])
 expect(actionDialogue('they','going',{object:'to the gym'}).answer.english).toBe('They are going to the gym.')
})
it('rejects more advanced or unreviewed actions',()=>{
 for(const word of ['giving','showing','hotel','shoes','eat','putting'])expect(()=>actionDialogue('you',word)).toThrow()
})
it('restricts each verb to things or places that actually fit it',()=>{
 const expected:Record<string,string[]>={eating:['an apple','a banana','a sandwich'],drinking:['water'],reading:['a book'],going:['to the hotel','to the gym','to the toilet','to the restaurant'],sleeping:[],running:[],walking:[],playing:[]}
 for(const [verb,words] of Object.entries(expected)){
  expect(objectsForAction(verb).map(item=>item.word)).toEqual(words)
  for(const noun of actionObjects){
   if(!words.includes(noun.word))expect(()=>actionDialogue('you',verb,{object:noun.word})).toThrow()
  }
 }
})

it('keeps each article separate from its noun throughout the object catalogue',()=>{
 for(const action of actionVocabulary)for(const object of objectsForAction(action.word)){
  const {units}=actionDialogue('you',action.word,{object:object.word}).answer
  expect(units.filter(unit=>unit.role==='object').map(unit=>unit.english)).toEqual([object.noun+'.'])
  expect(units.filter(unit=>unit.role==='determiner').map(unit=>unit.english)).toEqual(object.phrase.determiner?[object.phrase.determiner.english]:[])
 }
})

it('uses all compatible cumulative words and rejects incompatible nouns and future content',async()=>{
 const {lessonThreeMatrixCatalogue,lessonTwoMatrixCatalogue}=await import('../../classroom/wordCatalogue')
 const {actionContextsForWord}=await import('./actionDialogue')
 for(const earlier of lessonTwoMatrixCatalogue)expect(lessonThreeMatrixCatalogue.some(item=>item.word===earlier.word)).toBe(true)
 for(const action of actionVocabulary){
  const allowed=objectsForAction(action.word,lessonThreeMatrixCatalogue)
  const expected=lessonThreeMatrixCatalogue.filter(item=>actionContextsForWord(item).some(context=>action.objects.includes(context)))
  expect(allowed.map(item=>item.noun)).toEqual(expected.map(item=>item.word))
  for(const object of allowed){
   const pair=actionDialogue('you',action.word,{vocabulary:lessonThreeMatrixCatalogue,object:object.word})
   expect(pair.answer.units.map(unit=>unit.english).join(' ')).toBe(pair.answer.english)
   expect(pair.answer.units.at(-1)?.english).toBe(object.noun+'.')
  }
 }
 expect(objectsForAction('eating',lessonThreeMatrixCatalogue).map(item=>item.noun)).toEqual(expect.arrayContaining(['apple','apples','orange','oranges','sandwiches']))
 expect(objectsForAction('going',lessonThreeMatrixCatalogue).map(item=>item.noun)).toEqual(expect.arrayContaining(['hotel','hotels','padel court','clinic','bookstore','restaurant','restaurants']))
 expect(objectsForAction('reading',lessonThreeMatrixCatalogue).map(item=>item.noun)).toEqual(['book','books'])
 expect(objectsForAction('drinking',lessonThreeMatrixCatalogue).map(item=>item.noun)).toEqual(['water'])
 expect(objectsForAction('eating',lessonThreeMatrixCatalogue).some(item=>['hotel','water','shoe'].includes(item.noun))).toBe(false)
 expect(objectsForAction('eating',[{word:'apple',thai:'แอปเปิล',categories:['food']}]).map(item=>item.noun)).toEqual(['apple'])
 expect(()=>actionDialogue('you','eating',{vocabulary:lessonThreeMatrixCatalogue,object:'the hotel'})).toThrow()
})
