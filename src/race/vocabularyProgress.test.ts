import {expect,it} from 'vitest'
import {emptyLearning} from '../learning/wordProgress/learningLifecycle'
import {vocabularyScore,vocabularyLearning} from './vocabularyProgress'
import type {WordProgress} from '../learning/wordProgress/model'
const row=(word:string,correct:number,attempts=correct,listening=0):WordProgress=>({word_id:'en:'+word,correct,attempts,listening_correct:listening,direct_correct:0,last_practised:'',recent_results:[]})
it('combines singular/plural family results without claiming listening mastery from visible scores',()=>{
 expect(vocabularyScore('noun','apple',[row('apple',7,7,1),row('apples',6)])).toEqual({correct:13,attempts:13,listening:1})
 expect(vocabularyScore('verb','eating',[row('eating',16,16,1)])).toEqual({correct:16,attempts:16,listening:1})
})
it('counts a multiword phrase once and keeps missing-account results empty',()=>{
 expect(vocabularyScore('noun','padel court',[row('padel',6,7),row('court',3,3),row('courts',3,4)])).toEqual({correct:6,attempts:7,listening:0})
 expect(vocabularyScore('noun','man',[])).toEqual({correct:0,attempts:0,listening:0})
})

it('uses full fade as Learnt without requiring a separate confirmation field',()=>{
 const state=vocabularyLearning('noun','water',new Map([['en:water',{...emptyLearning(),fadeScore:25,updatedAt:'2026-11-12T00:00:00Z'}]]))
 expect(state.stage).toBe('learnt');expect(state.fadePercent).toBe(100);expect(state.provenAt).toBeTruthy()
})
