import {it,expect} from 'vitest'
import {drawingVocabulary,sharedDrawingVocabulary} from './vocabulary'
import type {WordProgress} from '../learning/wordProgress/model'
const seen=(word:string,exposure=1):WordProgress=>({word_id:'en:'+word,exposure_count:exposure,attempts:0,correct:0,listening_correct:0,direct_correct:0,last_practised:'',recent_results:[]})
it('restricts the catalogue to authored nouns, lexical verbs and adjectives, with raw English prompts',()=>{
 for(const item of drawingVocabulary){expect(['noun','verb','adjective']).toContain(item.kind);expect(item.english).toBe(item.word);expect(item.thai).toBeTruthy();expect(item.tokens.length).toBeGreaterThan(0)}
 for(const word of ['is','are','am','was','were','be','do','does','have','has','can','will','should','to','at','in','on','the','a','an','my','your','this','those','I','they'])expect(drawingVocabulary.some(item=>item.word===word)).toBe(false)
})
it('requires overlap with all three players and counts exposure without requiring a correct answer',()=>{
 const common=['phone','eating','big','is','to','they'].map(word=>seen(word))
 const players=[[...common,seen('bag')],[...common,seen('bag')],[...common,seen('bag',0)]]
 expect(sharedDrawingVocabulary(players).map(item=>[item.word,item.kind])).toEqual(expect.arrayContaining([['phone','noun'],['eating','verb'],['big','adjective']]))
 expect(sharedDrawingVocabulary(players).map(item=>item.word).sort()).toEqual(['big','eating','phone'])
})
it('keeps seen plural forms distinct and never falls back for an empty or disjoint history',()=>{
 expect(sharedDrawingVocabulary([[seen('phones')],[seen('phones')],[seen('phones')]]).map(item=>item.word)).toEqual(['phones'])
 expect(sharedDrawingVocabulary([[seen('phone')],[seen('book')],[seen('bag')]])).toEqual([])
 expect(sharedDrawingVocabulary([[seen('phone')],[]])).toEqual([])
 expect(sharedDrawingVocabulary([])).toEqual([])
})
