import {expect,it} from 'vitest'
import {auditWhereNoun,questionIntegrity} from './questionAudit'
import type {HotelQuestion} from '../../hotel/course'
const q=(english:string):HotelQuestion=>({id:'test',english,skill:'test',audioUrl:'/audio/test.wav',correct:0,answers:[[{text:'ใช่',skill:'test'}],[{text:'ไม่ใช่',skill:'test'}]]})
it('catches duplicate answers even with incidental whitespace',()=>{
 const question=q('Where is the hotel?');question.answers[1][0].text=' ใช่ '
 expect(questionIntegrity(question).map(i=>i.code)).toContain('duplicate-answer')
 // Intentionally malformed external content must be reported by the runtime audit.
 // @ts-expect-error Test invalid answer index.
 question.correct=9;expect(questionIntegrity(question).map(i=>i.code)).toContain('invalid-answer-index')
})
it('diagnoses missing parts and incompatible meanings in actual question text',()=>{
 const words=[{word:'hotel',thai:''},{word:'thought',thai:''}]
 expect(auditWhereNoun(q('Where is the hotel?'),words)).toEqual([])
 expect(auditWhereNoun(q('Where the hotel?'),words).map(i=>i.code)).toContain('noun-agreement')
 expect(auditWhereNoun(q('Where is hotel?'),words).map(i=>i.code)).toContain('missing-determiner')
 expect(auditWhereNoun(q('Where is the thought?'),words).map(i=>i.code)).toContain('incompatible-meaning')
})
