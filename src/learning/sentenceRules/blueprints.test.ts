import {expect,it} from 'vitest'
import {validateSentence,meaningForWord} from './blueprints'
const check=(word:string,kind:'place'|'abstract'|'physical-object',verb='is',number:'singular'|'plural'='singular')=>validateSentence({blueprint:'where-noun',noun:{word,thai:'',number,meaning:{kind}},verb,determiner:'the'})
it('accepts locatable things and rejects abstract or unclassified meanings',()=>{
 expect(check('hotel','place')).toEqual([])
 expect(check('phone','physical-object')).toEqual([])
 expect(check('thought','abstract').map(i=>i.code)).toContain('incompatible-meaning')
 expect(validateSentence({blueprint:'where-noun',noun:{word:'newword',thai:''},verb:'is',determiner:'the'})[0].code).toBe('unclassified-meaning')
})
it('checks agreement independently from meaning',()=>{
 expect(check('hotels','place','is','plural')[0].code).toBe('noun-agreement')
 expect(check('hotels','place','are','plural')).toEqual([])
})
it('does not allow every locatable object as an at destination',()=>{
 const subject={word:'I',thai:'',person:1 as const}
 expect(validateSentence({blueprint:'person-at-place',subject,verb:'am',determiner:'the',noun:{word:'phone',thai:''}})[0].code).toBe('incompatible-meaning')
 expect(validateSentence({blueprint:'person-at-place',subject,verb:'am',determiner:'the',noun:{word:'bedroom',thai:''}})[0].code).toBe('preposition-review')
 expect(meaningForWord({word:'hotel',thai:''})?.kind).toBe('place')
 expect(validateSentence({blueprint:'where-person',subject,verb:'are'})[0].code).toBe('subject-agreement')
})
it('supports reviewed landmark roles and sense-specific countability',()=>{
 const subject={word:'I',thai:'',person:1 as const}
 expect(validateSentence({blueprint:'person-at-place',subject,verb:'am',determiner:'the',noun:{word:'ATM',thai:''}})).toEqual([])
 expect(validateSentence({blueprint:'where-noun',verb:'are',determiner:'the',noun:{word:'waters',thai:'',number:'plural',meaning:{kind:'physical-object',countability:'mass'}}}).map(i=>i.code)).toContain('mass-noun-number')
 expect(validateSentence({blueprint:'where-noun',verb:'is',determiner:'the',noun:{word:'glasses',thai:'',meaning:{kind:'physical-object',countability:'plural-only'}}}).map(i=>i.code)).toContain('plural-only-number')
 expect(meaningForWord({word:'thought',thai:''})?.kind).toBe('abstract')
})
