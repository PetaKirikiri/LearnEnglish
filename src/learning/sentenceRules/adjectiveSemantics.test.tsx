// @vitest-environment happy-dom
import {expect,it} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {adjectiveFitsNoun,adjectivesForNoun} from './adjectiveSemantics'
import {actionDialogue} from './actionDialogue'
import {nounPhraseUnits} from '../sentenceMatrix/nounPhrase'
import LanguageQuadrant,{quadrantLayout,type LanguageDocument} from '../sentenceMatrix/LanguageQuadrant'
import {lessonThreeMatrixCatalogue} from '../../classroom/wordCatalogue'
import {everydayPeopleCatalogue} from '../everydayVocabulary'
import {generatedCandidates} from '../../race/generatedPracticeContent'
const vocabulary=[...lessonThreeMatrixCatalogue,...everydayPeopleCatalogue]
it('uses reviewed adjective meanings, including both noun subgroups and irregular plurals',()=>{
 for(const [adjective,noun] of [['tall','man'],['short','woman'],['tall','men'],['short','daughters'],['red','bag'],['big','phone'],['small','school'],['hot','water'],['cold','sandwich'],['green','apple'],['yellow','banana']])expect(adjectiveFitsNoun(adjective,noun),`${adjective} ${noun}`).toBe(true)
 for(const [adjective,noun] of [['red','man'],['blue','woman'],['green','girl'],['hot','doctor'],['big','water'],['cold','shoe'],['blue','apple'],['red','banana'],['tall','apple']])expect(adjectiveFitsNoun(adjective,noun),`${adjective} ${noun}`).toBe(false)
 expect(adjectivesForNoun('son').map(d=>d.word)).toEqual(['tall','short'])
 expect(()=>nounPhraseUnits({noun:'man',nounThai:'ผู้ชาย',description:{english:'red',thai:'สีแดง'}})).toThrow('adjective')
})
it('composes and renders descriptions on the subject and object together without bundling cards',()=>{
 const subject={word:'the man',thai:'ผู้ชาย',kind:'person' as const,number:'singular' as const,phrase:{noun:'man',nounThai:'ผู้ชาย',determiner:{english:'the',thai:'ที่กำลังพูดถึง'},description:{english:'tall',thai:'ตัวสูง'}}}
 const pair=actionDialogue('he','holding',{vocabulary,subject,object:'a bag',determiner:'the',description:{english:'red',thai:'สีแดง'}})
 expect(pair.answer.english).toBe('The tall man is holding the red bag.')
 expect(pair.answer.thai).toBe('ผู้ชายตัวสูงกำลังถือกระเป๋าสีแดง')
 const document:LanguageDocument={...pair.answer,construction:'action-answer'}
 expect(quadrantLayout(document)).toMatchObject({nounSize:3,leadingCount:3,nounGroups:[{start:0,end:3}]})
 const html=renderToStaticMarkup(<LanguageQuadrant request={{document}}/>)
 expect(html.match(/data-group-size="3"/g)).toHaveLength(2)
 const question:LanguageDocument={...pair.question,construction:'action-question'}
 expect(question.english).toBe('What is the tall man doing?')
 expect(()=>renderToStaticMarkup(<LanguageQuadrant request={{document:question}}/>)).not.toThrow()
 expect(()=>actionDialogue('he','holding',{vocabulary,subject:{...subject,phrase:{...subject.phrase,description:{english:'red',thai:'สีแดง'}}},object:'a bag',determiner:'the'})).toThrow('adjective')
 expect(()=>actionDialogue('i','helping',{vocabulary,object:'a man',description:{english:'red',thai:'สีแดง'}})).toThrow('adjective')
})
it('generates valid adjective subjects and objects, including both sides of each listening contrast',()=>{
 const bank=([1,2,3,4,5,6] as const).flatMap(level=>generatedCandidates(level,new Set(['holding','walking','talking','sleeping','helping','drinking'])))
 const described=bank.filter(q=>q.targetWords.some(word=>['red','blue','big','small','hot','cold','tall','short'].includes(word)))
 expect(described.some(q=>q.document.english==='The tall man is walking.')).toBe(true)
 expect(described.some(q=>q.document.english==='What is the short girl doing?')).toBe(true)
 expect(described.some(q=>/holding the red bag/.test(q.document.english))).toBe(true)
 expect(described.some(q=>/helping the tall man/.test(q.document.english))).toBe(true)
 for(const q of described)for(const document of [q.document,...(q.alternatives??[])]){
  expect(()=>quadrantLayout(document),document.english).not.toThrow()
  for(const [index,unit] of document.units.entries())if(unit.role==='description')expect(adjectiveFitsNoun(unit.english,document.units[index+1].english),document.english).toBe(true)
 }
},20000)
