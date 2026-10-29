import {expect,it} from 'vitest'
import {vocabularyIntegrity} from './vocabularyAudit'
it('finds incorrectly labelled forms without assuming that every final s is plural',()=>{
 expect(vocabularyIntegrity([{word:'hotels',thai:'โรงแรม',singular:'hotel',plural:'hotels',number:'singular'}]).map(i=>i.code)).toContain('form-number-mismatch')
 expect(vocabularyIntegrity([{word:'bus',thai:'รถบัส',singular:'bus',plural:'buses',number:'singular',categories:['transport']}])).toEqual([])
 expect(vocabularyIntegrity([{word:'glass',thai:'แก้ว',meaning:{kind:'physical-object'}},{word:'glass',thai:'แก้ว',meaning:{kind:'physical-object'}}]).map(i=>i.code)).toContain('duplicate-word')
})
