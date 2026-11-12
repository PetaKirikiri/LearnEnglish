// @vitest-environment happy-dom
import {act} from 'react'
import {createRoot} from 'react-dom/client'
import {expect,it} from 'vitest'
import {possessiveDeterminer,possessiveFor} from './possessives'
import {nounPhraseUnits,type NounPhrase} from '../sentenceMatrix/nounPhrase'
import {locationSentence,lessonDeterminers,type MatrixLesson} from '../sentenceMatrix/model'
import {requestLesson} from '../lessonRegistry'
import {composeLessonAction} from './actionCapabilities'
import {identificationAnswer} from './identification'
import {validateSentence} from './blueprints'
import {namedNouns} from './nominalReferences'
import SentenceMatrix from '../sentenceMatrix/SentenceMatrix'
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true})
const doctor:NounPhrase={noun:'doctor',nounThai:'หมอ',determiner:{english:'my',thai:'ของฉัน'}}
const wife:NounPhrase={noun:'wife',nounThai:'ภรรยา',determiner:possessiveDeterminer({kind:'phrase',phrase:doctor})}
const extended:MatrixLesson={...requestLesson(4),vocabulary:[...requestLesson(4).vocabulary,{word:'wife',thai:'ภรรยา',plural:'wives',meaning:{kind:'person'}}]}
const phone=extended.vocabulary.find(noun=>noun.word==='phone')!
it('builds a possessive recursively, keeping its noun-phrase structure',()=>{
 const determiner=possessiveDeterminer({kind:'phrase',phrase:wife})
 expect(determiner.english).toBe('my doctor’s wife’s')
 expect(determiner.thai).toBe('ของภรรยาของหมอของฉัน')
 expect(determiner.possessor).toEqual({kind:'phrase',phrase:wife})
 expect(nounPhraseUnits({noun:'phone',nounThai:'โทรศัพท์',determiner}).map(unit=>[unit.english,unit.role])).toEqual([['my doctor’s wife’s','determiner'],['phone','noun']])
})
it('composes other nested phrases through the same recursive model',()=>{
 const mother:NounPhrase={noun:'mother',nounThai:'แม่',determiner:{english:'your',thai:'ของคุณ'}}
 const son:NounPhrase={noun:'son',nounThai:'ลูกชาย',determiner:possessiveDeterminer({kind:'phrase',phrase:mother})}
 const determiner=possessiveDeterminer({kind:'phrase',phrase:son})
 expect(nounPhraseUnits({noun:'bag',nounThai:'กระเป๋า',determiner}).map(unit=>unit.english)).toEqual(['your mother’s son’s','bag'])
 expect(determiner.thai).toBe('ของลูกชายของแม่ของคุณ')
})
it('uses the possessed head noun for agreement, including plural possessors',()=>{
 expect(locationSentence(phone,'the boys’').english).toBe('Where is the boys’ phone?')
 const shoes=extended.vocabulary.find(noun=>noun.word==='shoes')!
 expect(locationSentence(shoes,'Bia’s').english).toBe('Where are Bia’s shoes?')
 expect(validateSentence({blueprint:'where-noun',noun:phone,verb:'is',determiner:'the boys’'})).toEqual([])
 expect(validateSentence({blueprint:'where-noun',noun:phone,verb:'are',determiner:'the boys’'})).not.toEqual([])
})
it('keeps possessive determiners independent of proper-noun mode and available vocabulary',()=>{
 expect(namedNouns(phone)).toEqual([])
 expect(lessonDeterminers(requestLesson(4)).map(item=>item.word)).toContain('Bia’s')
 expect(lessonDeterminers(requestLesson(4)).map(item=>item.word)).not.toContain('my doctor’s wife’s')
 expect(lessonDeterminers(extended).map(item=>item.word)).toContain('my doctor’s wife’s')
 expect(identificationAnswer('this',phone,'Bia’s').english).toBe('This is Bia’s phone.')
 const answer=composeLessonAction(extended,{subject:'I',action:'holding',object:'a phone',determiner:'my doctor’s wife’s'}).answer
 expect(answer.english).toBe('I am holding my doctor’s wife’s phone.')
 expect(answer.thai).toContain('โทรศัพท์ของภรรยาของหมอของฉัน')
 expect(possessiveFor('my doctor’s wife’s')?.possessor.kind).toBe('phrase')
})
it('rejects sentences or prepositional phrases as possessors',()=>{
 expect(()=>possessiveDeterminer({kind:'name',word:'Bia.',thai:'เบีย'})).toThrow()
 expect(()=>possessiveDeterminer({kind:'phrase',phrase:{noun:'doctor',nounThai:'หมอ',preposition:{english:'at',thai:'ที่'}}})).toThrow()
})
it('selects the nested phrase through the actual action builder determiner picker',async()=>{
 const host=document.createElement('div'),root=createRoot(host)
 const click=async(selector:string)=>act(async()=>host.querySelector<HTMLButtonElement>(selector)!.click())
 try{
  await act(async()=>root.render(<SentenceMatrix lesson={extended} initialAction={{subject:'i',action:'holding',object:'a phone',determiner:'the'}} settings={{initialPattern:'answer',audio:false}}/>))
  await click('[data-word-role="determiner"]')
  await click('[data-word="Bia’s"]')
  expect(host.querySelector('.cw-sentence-board')?.getAttribute('aria-label')).toBe('I am holding Bia’s phone.')
  await click('[data-word-role="determiner"]')
  await click('[data-word="my doctor’s wife’s"]')
  expect(host.querySelector('.cw-sentence-board')?.getAttribute('aria-label')).toBe('I am holding my doctor’s wife’s phone.')
  expect([...host.querySelectorAll('.cw-noun-group .example-source')].map(node=>node.textContent)).toEqual(['my doctor’s wife’s','phone.'])
  expect(host.querySelector<HTMLButtonElement>('[aria-label="Object block mode"] [data-noun-mode="name"]')?.disabled).toBe(true)
 }finally{await act(async()=>root.unmount())}
})
