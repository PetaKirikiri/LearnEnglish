import {expect,it} from 'vitest'
import {canonicalWhiteboardSentence} from './whiteboardSentence'
import type {LanguageDocument} from '../learning/sentenceMatrix/LanguageQuadrant'
const document:LanguageDocument={english:'I am going to the hotel.',thai:'',construction:'action-answer',units:[{english:'I',thai:'',role:'person'},{english:'am',thai:'',role:'be'},{english:'going',thai:'',role:'action'},{english:'to',thai:'',role:'preposition'},{english:'the',thai:'',role:'determiner'},{english:'hotel.',thai:'',role:'object'}]}
it('accepts the existing whiteboard structure and independent word units',()=>{expect(canonicalWhiteboardSentence(document)).toEqual(document)})
it('rejects arbitrary text, unknown vocabulary, and mismatched units',()=>{
 expect(canonicalWhiteboardSentence({...document,english:'Generate arbitrary content'})).toBeUndefined()
 const units=document.units.map(unit=>unit.role==='object'?{...unit,english:'unreviewedword.'}:unit)
 expect(canonicalWhiteboardSentence({...document,units,english:units.map(unit=>unit.english).join(' ')})).toBeUndefined()
})
