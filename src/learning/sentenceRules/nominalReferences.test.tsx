import {expect,it} from 'vitest'
import {actionDialogue} from './actionDialogue'
import {actionCapabilities} from './actionCapabilities'
import {requestLesson} from '../lessonRegistry'
import {objectPronouns,namedNouns,referencePhrase} from './nominalReferences'
import {quadrantLayout} from '../sentenceMatrix/LanguageQuadrant'
import {locationAnswer} from '../sentenceMatrix/peopleLocation'
import {identificationAnswer} from './identification'
import {subjectCanPerform} from './actionSemantics'
const noun=(word:string)=>requestLesson(4).vocabulary.find(n=>n.word===word)!
it('keeps the approved source noun and verb frame for every object/pronoun/name alternative',()=>{
 let checked=0
 for(const number of [4,5]){
  const lesson=requestLesson(number),capability=actionCapabilities(lesson)
  for(const action of capability.actions)for(const object of capability.objects(action.word)){
   const source=lesson.vocabulary.find(n=>n.word===object.noun)!
   const location=action.complement==='destination'||!!object.phrase.preposition&&object.categories.includes('destination')
   for(const option of [...objectPronouns(source,location),...namedNouns(source,lesson.subjectModes)]){
    const line=actionDialogue('i',action.word,{question:lesson.actionQuestion,vocabulary:lesson.vocabulary,object:object.word,objectReference:option.reference}).answer
    expect(line.english).not.toMatch(/\b(?:the|a|an) (?:it|them|him|her|here|there)\b|\b(?:at|to) (?:here|there)\b/)
    expect(()=>quadrantLayout({...line,construction:'action-answer'}),line.english).not.toThrow()
    if(option.reference.mode==='name'){expect(line.units.some(u=>u.role==='object'&&u.english.replace(/\.$/,'')===option.reference.name.word)).toBe(true);expect(line.english).not.toMatch(/[’']s\b/)}
    checked++
   }
  }
 }
 expect(checked).toBeGreaterThan(500)
})
it('uses objective pronouns for people, objects, plural-only nouns and mass nouns',()=>{
 expect(objectPronouns(noun('phone')).map(p=>p.word)).toEqual(['it'])
 expect(objectPronouns(noun('shoes')).map(p=>p.word)).toEqual(['them'])
 expect(objectPronouns(noun('water')).map(p=>p.word)).toEqual(['it'])
 expect(objectPronouns({word:'girl',thai:'เด็กผู้หญิง',meaning:{kind:'person'}}).map(p=>p.word)).toEqual(['her'])
 expect(()=>referencePhrase(noun('phone'),{noun:'phone',nounThai:'โทรศัพท์'},{mode:'pronoun',word:'him'})).toThrow()
})
it('uses bare proper nouns only for compatible people and places, never possessive substitutes',()=>{
 const man=requestLesson(4).subjectNouns!.find(n=>n.word==='man')!
 const bia=namedNouns(man)[0].reference
 expect(actionDialogue('i','helping',{vocabulary:[...requestLesson(4).vocabulary,man],object:'a man',objectReference:bia}).answer.english).toBe('I am helping Bia.')
 expect(namedNouns(noun('phone'))).toEqual([])
 expect(namedNouns(noun('shoes'))).toEqual([])
 expect(()=>referencePhrase(noun('phone'),{noun:'phone',nounThai:'โทรศัพท์'},bia)).toThrow()
 expect(locationAnswer({word:'I',thai:'ฉัน',person:1},noun('hotel'),false,namedNouns(noun('hotel'))[0].reference).english).toBe('I am at Central.')
})
it('treats here/there as locative proforms and never adds at/to or a determiner',()=>{
 const hotel=noun('hotel'),there=objectPronouns(hotel,true).find(p=>p.word==='there')!
 expect(locationAnswer({word:'I',thai:'ฉัน',person:1},hotel,false,there.reference).english).toBe('I am there.')
 expect(actionDialogue('i','going',{vocabulary:requestLesson(5).vocabulary,object:'to the hotel',objectReference:there.reference}).answer.english).toBe('I am going there.')
})
it('allows a pronoun or a named noun phrase in identification without an extra article',()=>{
 expect(identificationAnswer('this',noun('phone'),'the',objectPronouns(noun('phone'))[0].reference).english).toBe('This is it.')
 expect(namedNouns(noun('phone'))).toHaveLength(0)
})
it('retains agency restrictions and rejects an incompatible source noun before resolving a reference',()=>{
 expect(subjectCanPerform({word:'Bia',semanticNoun:'boy'},'driving')).toBe(false)
 expect(()=>actionDialogue('i','eating',{vocabulary:requestLesson(4).vocabulary,object:'a phone',objectReference:{mode:'pronoun',word:'it'}})).toThrow()
})
