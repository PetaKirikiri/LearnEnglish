import {it,expect} from 'vitest'
import {assertBlueprintDocument} from './blueprintIntegrity'
import type {LanguageDocument,LanguageRole} from '../../learning/sentenceMatrix/LanguageQuadrant'
function sentence(parts:[LanguageRole,string][]):LanguageDocument{return {construction:'action-answer',english:parts.map(p=>p[1]).join(' '),thai:'',units:parts.map(([role,english])=>({role,english,thai:''}))}}
const action=(subject:string,verb:string,object:string,preposition?:string)=>sentence([['person-determiner','the'],['person',subject],['be','is'],['action',verb],...(preposition?[['preposition',preposition] as [LanguageRole,string]]:[]),['determiner','the'],['object',object+'.']])
it('accepts reviewed direct and to frames',()=>{
 expect(()=>assertBlueprintDocument(action('man','holding','phone'))).not.toThrow()
 expect(()=>assertBlueprintDocument(action('woman','walking','hotel','to'))).not.toThrow()
})
it.each([
 ['sleeping forced into to',action('man','sleeping','hotel','to')],
 ['sleeping forced into direct object',action('man','sleeping','bed')],
 ['child driving',action('son','driving','hotel','to')],
 ['inanimate subject',action('phone','drinking','water')],
 ['drinking a phone',action('man','drinking','phone')],
 ['invented at',action('man','walking','hotel','at')],
 ['invented on',action('man','holding','phone','on')],
 ['invented in',action('man','holding','phone','in')],
 ['red man',sentence([['person-determiner','the'],['description','red'],['person','man'],['be','is'],['action','holding'],['determiner','the'],['object','phone.']])],
 ['singular with these',sentence([['person-determiner','these'],['person','man'],['be','is'],['action','holding'],['determiner','the'],['object','phone.']])],
 ['wrong auxiliary',sentence([['person-determiner','the'],['person','man'],['be','are'],['action','holding'],['determiner','the'],['object','phone.']])],
])('rejects %s',(_label,doc)=>expect(()=>assertBlueprintDocument(doc)).toThrow())
